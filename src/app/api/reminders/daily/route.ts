import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

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
  let checked = 0;
  let sent = 0;
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

    // Anti-spam : 1 email max / 7j
    if (u.lastReminderAt && now - u.lastReminderAt.getTime() < 7 * 86400000) continue;

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

  return NextResponse.json({ checked, sent, skippedNoKey: skippedNoKey.length, resendConfigured: Boolean(resend) });
}
