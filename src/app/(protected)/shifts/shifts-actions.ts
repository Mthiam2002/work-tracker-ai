"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { computePay, DEFAULT_PREMIUMS } from "@/lib/pay";
import { getRateForDate } from "../settings/settings-actions";

type CreateShiftInput = {
  date: string;
  startTime: string;
  endTime: string;
  endsNextDay: boolean;
  breakMinutes: number;
  recalcRate?: boolean; // edit : recalculer au taux du jour (sinon garde snapshot)
};

function computeShift(input: CreateShiftInput) {
  const { date, startTime, endTime, endsNextDay, breakMinutes } = input;

  if (!date || !startTime || !endTime) {
    throw new Error("Merci de renseigner la date et les heures.");
  }
  if (breakMinutes < 0) {
    throw new Error("La pause ne peut pas être négative.");
  }

  // Heures murales figées en UTC : "08:00" saisi = 08:00 stocké = 08:00 affiché,
  // quel que soit le fuseau du serveur ou du navigateur.
  const wall = (d: string, t: string) => {
    const [y, mo, da] = d.split("-").map(Number);
    const [h, mi] = t.split(":").map(Number);
    return new Date(Date.UTC(y, mo - 1, da, h, mi, 0));
  };
  const dayWall = (d: string) => {
    const [y, mo, da] = d.split("-").map(Number);
    return new Date(Date.UTC(y, mo - 1, da, 0, 0, 0));
  };

  const startDate = dayWall(date);
  const startDateTime = wall(date, startTime);

  const endDate = dayWall(date);
  if (endsNextDay) {
    endDate.setUTCDate(endDate.getUTCDate() + 1);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const endDateStr = `${endDate.getUTCFullYear()}-${pad(endDate.getUTCMonth() + 1)}-${pad(endDate.getUTCDate())}`;
  const endDateTime = wall(endDateStr, endTime);

  if (endDateTime <= startDateTime) {
    throw new Error("L'heure de fin doit être après l'heure de début.");
  }

  const diffMinutes = (endDateTime.getTime() - startDateTime.getTime()) / 60000;
  if (diffMinutes <= 0) {
    throw new Error("La durée totale de la vacation doit être positive.");
  }

  return { startDate, startDateTime, endDate, endDateTime };
}

async function getPremiumConfig(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return {
    nightMult: user?.nightMult ?? DEFAULT_PREMIUMS.nightMult,
    sundayMult: user?.sundayMult ?? DEFAULT_PREMIUMS.sundayMult,
    holidayMult: user?.holidayMult ?? DEFAULT_PREMIUMS.holidayMult,
    nightStart: user?.nightStart ?? DEFAULT_PREMIUMS.nightStart,
    nightEnd: user?.nightEnd ?? DEFAULT_PREMIUMS.nightEnd,
  };
}

export async function createWorkShift(input: CreateShiftInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");

  const { startDate, startDateTime, endDate, endDateTime } = computeShift(input);
  const cfg = await getPremiumConfig(userId);
  const rate = await getRateForDate(startDateTime);
  const pay = computePay(startDateTime, endDateTime, rate, cfg);

  await prisma.workShift.create({
    data: {
      userId,
      startDate,
      startTime: startDateTime,
      endDate,
      endTime: endDateTime,
      breakMinutes: input.breakMinutes,
      totalHours: pay.totalHours,
      estimatedPay: pay.estimatedPay,
      rateSnapshot: rate,
      nightHours: pay.nightHours,
      sundayHours: pay.sundayHours,
      holidayHours: pay.holidayHours,
      premiumPay: pay.premiumPay,
    },
  });

  revalidatePath("/shifts");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function getWorkShift(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  return prisma.workShift.findFirst({ where: { id, userId } });
}

export async function getLastShift() {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  return prisma.workShift.findFirst({
    where: { userId },
    orderBy: { startDate: "desc" },
  });
}

export async function updateWorkShift(id: string, input: CreateShiftInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");

  const existing = await prisma.workShift.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Vacation introuvable.");

  const { startDate, startDateTime, endDate, endDateTime } = computeShift(input);
  const cfg = await getPremiumConfig(userId);
  const rate =
    input.recalcRate || !existing.rateSnapshot
      ? await getRateForDate(startDateTime)
      : existing.rateSnapshot;
  const pay = computePay(startDateTime, endDateTime, rate, cfg);

  await prisma.workShift.update({
    where: { id },
    data: {
      startDate,
      startTime: startDateTime,
      endDate,
      endTime: endDateTime,
      breakMinutes: input.breakMinutes,
      totalHours: pay.totalHours,
      estimatedPay: pay.estimatedPay,
      rateSnapshot: rate,
      nightHours: pay.nightHours,
      sundayHours: pay.sundayHours,
      holidayHours: pay.holidayHours,
      premiumPay: pay.premiumPay,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function duplicateLastShiftAsToday() {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  const last = await prisma.workShift.findFirst({
    where: { userId },
    orderBy: { startDate: "desc" },
  });
  if (!last) throw new Error("Aucune vacation à dupliquer.");
  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const todayStr = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
  const toTime = (d: Date) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  const endsNextDay = last.endDate.getTime() !== last.startDate.getTime();
  await createWorkShift({
    date: todayStr,
    startTime: toTime(last.startTime),
    endTime: toTime(last.endTime),
    endsNextDay,
    breakMinutes: last.breakMinutes,
  });
}

export async function deleteWorkShift(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");

  await prisma.workShift.deleteMany({ where: { id, userId } });

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}
