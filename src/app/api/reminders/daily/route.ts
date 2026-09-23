import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import webpush from "web-push";

export const dynamic = "force-dynamic";

function pushConfigured() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contact@work-tracker-ai.vercel.app", pub, priv);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const users = await prisma.user.findMany({
    where: { reminderEnabled: true },
    select: { id: true, email: true, reminderThreshold: true, lastReminderAt: true },
  });

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Work Tracker <onboarding@resend.dev>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resend = resendKey ? new Resend(resendKey) : null;

  const now = Date.now();
  const canPush = pushConfigured();
  let checked = 0;
  let sent = 0;
  let pushed = 0;
  const skippedNoKey: string[] = [];

  for (const u of users) {
    checked++;
    const last = await prisma.workShift.findFirst({
      where: { userId: u.id },
      orderBy: { startDate: "desc" },
      select: { startDate: true },
    });
    const daysSince = last ? Math.floor((now - last.startDate.getTime()) / 86400000) : 999;
    if (daysSince < u.reminderThreshold) continue;

    // Anti-spam : 1 rappel max / 7j (email + push partagent le compteur)
    if (u.lastReminderAt && now - u.lastReminderAt.getTime() < 7 * 86400000) continue;

    if (canPush) {
      const subs = await prisma.pushSubscription.findMany({ where: { userId: u.id } });
      const payload = JSON.stringify({
        title: "Work Tracker",
        body: `Aucune vacation depuis ${daysSince} jour${daysSince > 1 ? "s" : ""} — pense à pointer.`,
        url: "/shifts/new",
      });
      let userPushed = 0;
      for (const s of subs) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
          pushed++;
          userPushed++;
        } catch (e: unknown) {
          // Abonnement expiré (410/404) → nettoyage
          const status = (e as { statusCode?: number })?.statusCode;
          if (status === 410 || status === 404) {
            await prisma.pushSubscription.delete({ where: { id: s.id } });
          } else {
            console.error("Push error pour", u.id, e);
          }
        }
      }
      if (!resend && userPushed > 0) {
        await prisma.user.update({ where: { id: u.id }, data: { lastReminderAt: new Date() } });
      }
    }

    if (!resend) {
      skippedNoKey.push(u.id);
      continue;
    }

    try {
      await resend.emails.send({
        from,
        to: u.email,
        subject: `Pense à pointer (${daysSince} jours sans vacation)`,
        html: `<p>Salut,</p><p>Aucune vacation pointée depuis <strong>${daysSince} jours</strong>.</p><p><a href="${appUrl}/shifts/new">Pointer maintenant</a></p>`,
      });
      sent++;
    } catch (e) {
      console.error("Resend error pour", u.id, e);
      continue;
    }

    await prisma.user.update({ where: { id: u.id }, data: { lastReminderAt: new Date() } });
  }

  return NextResponse.json({ checked, sent, pushed, skippedNoKey: skippedNoKey.length, resendConfigured: Boolean(resend), pushConfigured: canPush });
}
