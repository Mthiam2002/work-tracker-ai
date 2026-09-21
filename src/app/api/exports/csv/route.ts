import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { brutToNet } from "@/lib/salary";

export const dynamic = "force-dynamic";
function fmtDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function fmtTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function csvCell(v: string | number) {
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Non authentifié", { status: 401 });

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;
  const where =
    year && Number.isInteger(year)
      ? { userId, startDate: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } }
      : { userId };

  const shifts = await prisma.workShift.findMany({
    where,
    orderBy: { startDate: "asc" },
  });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { netRatio: true } });
  const netRatio = user?.netRatio ?? 0.77;

  const header = ["Date", "Heure début", "Heure fin", "Nuit (+1j)", "Pause (min)", "Heures totales", "Taux (€/h)", "Heures nuit", "Heures dimanche", "Heures férié", "Majorations (€)", "Paie brute estimée (€)", "Paie nette estimée (€)"];
  const lines = shifts.map((s) =>
    [
      csvCell(fmtDate(s.startDate)),
      csvCell(fmtTime(s.startTime)),
      csvCell(fmtTime(s.endTime)),
      csvCell(s.endDate.getTime() !== s.startDate.getTime() ? "oui" : "non"),
      csvCell(s.breakMinutes),
      csvCell(s.totalHours.toFixed(2).replace(".", ",")),
      csvCell((s.rateSnapshot || 0).toFixed(2).replace(".", ",")),
      csvCell((s.nightHours || 0).toFixed(2).replace(".", ",")),
      csvCell((s.sundayHours || 0).toFixed(2).replace(".", ",")),
      csvCell((s.holidayHours || 0).toFixed(2).replace(".", ",")),
      csvCell((s.premiumPay || 0).toFixed(2).replace(".", ",")),
      csvCell(s.estimatedPay.toFixed(2).replace(".", ",")),
      csvCell(brutToNet(s.estimatedPay, netRatio).toFixed(2).replace(".", ",")),
    ].join(";")
  );

  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
  const suffix = year && Number.isInteger(year) ? `-${year}` : "-toutes";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vacations${suffix}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
