"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const SMIC_HORAIRE_DEFAUT = 12.33;

async function ensureUser(userId: string) {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("L'adresse email de l'utilisateur est introuvable.");
  return prisma.user.upsert({
    where: { id: userId },
    update: { email },
    create: {
      id: userId,
      email,
      nightMult: 0.2,
      sundayMult: 0.2,
      holidayMult: 1.0,
      nightStart: 21,
      nightEnd: 6,
    },
  });
}

/** Taux en vigueur (dernier par validFrom). */
export async function getHourlyRate() {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");

  const latest = await prisma.hourlyRate.findFirst({
    where: { userId },
    orderBy: { validFrom: "desc" },
  });
  return latest?.rate ?? SMIC_HORAIRE_DEFAUT;
}

/** Taux applicable à une date donnée (historique). */
export async function getRateForDate(date: Date) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");

  const applicable = await prisma.hourlyRate.findFirst({
    where: { userId, validFrom: { lte: date } },
    orderBy: { validFrom: "desc" },
  });
  if (applicable) return applicable.rate;
  const earliest = await prisma.hourlyRate.findFirst({
    where: { userId },
    orderBy: { validFrom: "asc" },
  });
  return earliest?.rate ?? SMIC_HORAIRE_DEFAUT;
}

export async function getRateHistory(limit = 20) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  return prisma.hourlyRate.findMany({
    where: { userId },
    orderBy: { validFrom: "desc" },
    take: limit,
  });
}

/** Nouveau taux = nouvelle ligne d'historique (le passé est préservé). */
export async function updateHourlyRate(newRate: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  if (!Number.isFinite(newRate) || newRate <= 0) {
    throw new Error("Le taux horaire doit être un nombre positif.");
  }
  await ensureUser(userId);
  await prisma.hourlyRate.create({
    data: { userId, rate: newRate, validFrom: new Date() },
  });
  revalidatePath("/settings");
}

export async function getUserSettings() {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  const user = await ensureUser(userId);
  const rate = await getHourlyRate();
  const history = await getRateHistory();
  return {
    rate,
    history,
    nightMult: user.nightMult,
    sundayMult: user.sundayMult,
    holidayMult: user.holidayMult,
    nightStart: user.nightStart,
    nightEnd: user.nightEnd,
    reminderEnabled: user.reminderEnabled,
    reminderThreshold: user.reminderThreshold,
  };
}

export async function updatePremiums(input: {
  nightMult: number;
  sundayMult: number;
  holidayMult: number;
  nightStart: number;
  nightEnd: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  const { nightMult, sundayMult, holidayMult, nightStart, nightEnd } = input;
  for (const v of [nightMult, sundayMult, holidayMult]) {
    if (!Number.isFinite(v) || v < 0 || v > 5) throw new Error("Majoration invalide (0 à 5).");
  }
  if (![nightStart, nightEnd].every((h) => Number.isInteger(h) && h >= 0 && h <= 23)) {
    throw new Error("Fenêtre nuit invalide (0-23).");
  }
  await ensureUser(userId);
  await prisma.user.update({
    where: { id: userId },
    data: { nightMult, sundayMult, holidayMult, nightStart, nightEnd },
  });
  revalidatePath("/settings");
}

export async function updateReminderSettings(input: { enabled: boolean; threshold: number }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  if (!Number.isInteger(input.threshold) || input.threshold < 1 || input.threshold > 30) {
    throw new Error("Seuil invalide (1 à 30 jours).");
  }
  await ensureUser(userId);
  await prisma.user.update({
    where: { id: userId },
    data: { reminderEnabled: input.enabled, reminderThreshold: input.threshold },
  });
  revalidatePath("/settings");
}
