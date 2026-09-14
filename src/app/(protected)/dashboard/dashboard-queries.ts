"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export type PeriodTotal = { hours: number; pay: number; count: number };

function startOfWeekMonday(now: Date) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function totalForRange(userId: string, from: Date, to?: Date): Promise<PeriodTotal> {
  const agg = await prisma.workShift.aggregate({
    where: { userId, startDate: { gte: from, ...(to ? { lt: to } : {}) } },
    _sum: { totalHours: true, estimatedPay: true },
    _count: true,
  });
  return {
    hours: agg._sum.totalHours ?? 0,
    pay: agg._sum.estimatedPay ?? 0,
    count: agg._count,
  };
}

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");

  const now = new Date();
  const weekStart = startOfWeekMonday(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [week, month, year, recent] = await Promise.all([
    totalForRange(userId, weekStart),
    totalForRange(userId, monthStart),
    totalForRange(userId, yearStart),
    prisma.workShift.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
      take: 10,
    }),
  ]);

  const lastShift = recent[0]?.startDate ?? null;
  const daysSinceLastShift = lastShift
    ? Math.floor((now.getTime() - lastShift.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return { week, month, year, recent, daysSinceLastShift };
}

export type MonthPoint = { key: string; label: string; hours: number; pay: number; count: number };

export async function getMonthlyEvolution(months = 6): Promise<MonthPoint[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");

  const now = new Date();
  const points: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const agg = await prisma.workShift.aggregate({
      where: { userId, startDate: { gte: from, lt: to } },
      _sum: { totalHours: true, estimatedPay: true },
      _count: true,
    });
    points.push({
      key: `${from.getFullYear()}-${from.getMonth()}`,
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(from).replace(".", ""),
      hours: agg._sum.totalHours ?? 0,
      pay: agg._sum.estimatedPay ?? 0,
      count: agg._count,
    });
  }
  return points;
}

export async function getMonthShifts(year: number, month: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  return prisma.workShift.findMany({
    where: { userId, startDate: { gte: from, lt: to } },
    orderBy: { startDate: "asc" },
  });
}
