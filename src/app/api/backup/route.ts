import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Export complet : paramètres, historique de taux, vacations, métadonnées bulletins (fichiers restent dans Blob). */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [user, rates, shifts, payslips] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.hourlyRate.findMany({ where: { userId }, orderBy: { validFrom: "asc" } }),
    prisma.workShift.findMany({ where: { userId }, orderBy: { startDate: "asc" } }),
    prisma.payslip.findMany({ where: { userId }, orderBy: [{ year: "asc" }, { month: "asc" }] }),
  ]);

  const body = {
    version: 1,
    exportedAt: new Date().toISOString(),
    user: user
      ? {
          nightMult: user.nightMult, sundayMult: user.sundayMult, holidayMult: user.holidayMult,
          nightStart: user.nightStart, nightEnd: user.nightEnd,
          reminderEnabled: user.reminderEnabled, reminderThreshold: user.reminderThreshold,
          netRatio: user.netRatio,
        }
      : null,
    hourlyRates: rates.map((r) => ({ rate: r.rate, validFrom: r.validFrom.toISOString() })),
    workShifts: shifts.map((s) => ({
      startDate: s.startDate.toISOString(), startTime: s.startTime.toISOString(),
      endDate: s.endDate.toISOString(), endTime: s.endTime.toISOString(),
      breakMinutes: s.breakMinutes, totalHours: s.totalHours, estimatedPay: s.estimatedPay,
      rateSnapshot: s.rateSnapshot, nightHours: s.nightHours, sundayHours: s.sundayHours,
      holidayHours: s.holidayHours, premiumPay: s.premiumPay,
    })),
    payslips: payslips.map((p) => ({ year: p.year, month: p.month, fileName: p.fileName, fileUrl: p.fileUrl })),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="work-tracker-backup.json"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Restauration : fusionne (jamais d'écrasement aveugle). Compte les créés/ignorés. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: {
    version?: number;
    user?: Record<string, number | boolean> | null;
    hourlyRates?: { rate: number; validFrom: string }[];
    workShifts?: Record<string, string | number>[];
    payslips?: { year: number; month: number | null; fileName: string; fileUrl: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  if (!body || body.version !== 1) return NextResponse.json({ error: "Fichier de sauvegarde non reconnu (version)." }, { status: 400 });

  const summary = { rates: 0, shifts: 0, payslips: 0, skipped: 0 };

  if (body.user) {
    const u = body.user;
    const num = (v: unknown, min: number, max: number, fallback: number) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : fallback;
    const clerkEmail = (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email;
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        nightMult: num(u.nightMult, 0, 5, 0.2), sundayMult: num(u.sundayMult, 0, 5, 0.2),
        holidayMult: num(u.holidayMult, 0, 5, 1), nightStart: Math.trunc(num(u.nightStart, 0, 23, 21)),
        nightEnd: Math.trunc(num(u.nightEnd, 0, 23, 6)),
        reminderEnabled: typeof u.reminderEnabled === "boolean" ? u.reminderEnabled : true,
        reminderThreshold: Math.trunc(num(u.reminderThreshold, 1, 30, 7)),
        netRatio: num(u.netRatio, 0.5, 0.95, 0.77),
      },
      create: {
        id: userId, email: clerkEmail ?? `${userId}@local`,
        nightMult: num(u.nightMult, 0, 5, 0.2), sundayMult: num(u.sundayMult, 0, 5, 0.2),
        holidayMult: num(u.holidayMult, 0, 5, 1), nightStart: Math.trunc(num(u.nightStart, 0, 23, 21)),
        nightEnd: Math.trunc(num(u.nightEnd, 0, 23, 6)),
        reminderEnabled: typeof u.reminderEnabled === "boolean" ? u.reminderEnabled : true,
        reminderThreshold: Math.trunc(num(u.reminderThreshold, 1, 30, 7)),
        netRatio: num(u.netRatio, 0.5, 0.95, 0.77),
      },
    });
  }

  for (const r of body.hourlyRates ?? []) {
    const d = new Date(r.validFrom);
    if (!Number.isFinite(r.rate) || r.rate <= 0 || isNaN(d.getTime())) { summary.skipped++; continue; }
    const exists = await prisma.hourlyRate.findFirst({ where: { userId, validFrom: d, rate: r.rate } });
    if (exists) { summary.skipped++; continue; }
    await prisma.hourlyRate.create({ data: { userId, rate: r.rate, validFrom: d } });
    summary.rates++;
  }

  for (const w of body.workShifts ?? []) {
    const sd = new Date(String(w.startDate)), st = new Date(String(w.startTime));
    const ed = new Date(String(w.endDate)), et = new Date(String(w.endTime));
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
    if ([sd, st, ed, et].some((d) => isNaN(d.getTime())) || isNaN(num(w.totalHours)) || isNaN(num(w.estimatedPay))) {
      summary.skipped++; continue;
    }
    const exists = await prisma.workShift.findFirst({ where: { userId, startDate: sd, startTime: st } });
    if (exists) { summary.skipped++; continue; }
    await prisma.workShift.create({
      data: {
        userId, startDate: sd, startTime: st, endDate: ed, endTime: et,
        breakMinutes: Number.isInteger(w.breakMinutes) ? (w.breakMinutes as number) : 0,
        totalHours: num(w.totalHours), estimatedPay: num(w.estimatedPay),
        rateSnapshot: num(w.rateSnapshot) || 0, nightHours: num(w.nightHours) || 0,
        sundayHours: num(w.sundayHours) || 0, holidayHours: num(w.holidayHours) || 0,
        premiumPay: num(w.premiumPay) || 0,
      },
    });
    summary.shifts++;
  }

  for (const p of body.payslips ?? []) {
    if (!Number.isInteger(p.year) || typeof p.fileName !== "string" || typeof p.fileUrl !== "string") {
      summary.skipped++; continue;
    }
    const exists = await prisma.payslip.findFirst({ where: { userId, fileUrl: p.fileUrl } });
    if (exists) { summary.skipped++; continue; }
    await prisma.payslip.create({
      data: { userId, year: p.year, month: typeof p.month === "number" ? p.month : null, fileName: p.fileName, fileUrl: p.fileUrl },
    });
    summary.payslips++;
  }

  return NextResponse.json({ ok: true, ...summary });
}
