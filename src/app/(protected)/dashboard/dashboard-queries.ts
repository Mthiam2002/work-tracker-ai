"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export type PeriodTotal = { hours: number; pay: number; count: number };

function startOfWeekMonday(now: Date) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
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
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

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
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
    const agg = await prisma.workShift.aggregate({
      where: { userId, startDate: { gte: from, lt: to } },
      _sum: { totalHours: true, estimatedPay: true },
      _count: true,
    });
    points.push({
      key: `${from.getUTCFullYear()}-${from.getUTCMonth()}`,
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
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  return prisma.workShift.findMany({
    where: { userId, startDate: { gte: from, lt: to } },
    orderBy: { startDate: "asc" },
  });
}

export type ShiftItem = {
  id: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  breakMinutes: number;
  totalHours: number;
  estimatedPay: number;
};

export type ShiftsPage = { items: ShiftItem[]; total: number; page: number; pages: number };

/** Recherche (date, horaires, heures, paie) + pagination, tri décroissant. */
export async function getShiftsPage({ q = "", page = 1, pageSize = 5 }: { q?: string; page?: number; pageSize?: number }): Promise<ShiftsPage> {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.min(20, Math.max(1, Math.floor(pageSize) || 5));

  const all = await prisma.workShift.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
    take: 500,
  });

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? all.filter((s) => {
        const hay = [
          new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(s.startDate),
          `${String(s.startDate.getUTCDate()).padStart(2, "0")}/${String(s.startDate.getUTCMonth() + 1).padStart(2, "0")}/${s.startDate.getUTCFullYear()}`,
          new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(s.startTime),
          new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(s.endTime),
          String(s.totalHours),
          String(s.estimatedPay),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
    : all;

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / safeSize));
  const items = filtered.slice((safePage - 1) * safeSize, safePage * safeSize).map((s) => ({
    id: s.id,
    startDate: s.startDate.toISOString(),
    startTime: s.startTime.toISOString(),
    endDate: s.endDate.toISOString(),
    endTime: s.endTime.toISOString(),
    breakMinutes: s.breakMinutes,
    totalHours: s.totalHours,
    estimatedPay: s.estimatedPay,
  }));

  return { items, total, page: Math.min(safePage, pages), pages };
}
