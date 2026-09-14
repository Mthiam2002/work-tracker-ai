"use server";

import { prisma } from "@/lib/prisma";
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from "next/cache";
import { getHourlyRate } from "../settings/settings-actions";

type CreateShiftInput = {
    date: string;
    startTime: string;
    endTime: string;
    endsNextDay: boolean;
    breakMinutes: number;
};

function computeShift(input: CreateShiftInput) {
    const { date, startTime, endTime, endsNextDay, breakMinutes } = input;

    if (!date || !startTime || !endTime) {
        throw new Error("Merci de renseigner la date et les heures.");
    }
    if (breakMinutes < 0) {
        throw new Error("La pause ne peut pas être négative.");
    }

    // Jour de début (civil) + datetime début
    const startDate = new Date(`${date}T00:00:00`);
    const startDateTime = new Date(`${date}T${startTime}:00`);

    // Jour de fin (civil) + +1 jour si la vacation chevauche minuit.
    // Format local manuel (pas toISOString qui bascule en UTC et décale le jour).
    const endDate = new Date(`${date}T00:00:00`);
    if (endsNextDay) {
        endDate.setDate(endDate.getDate() + 1);
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const endDateStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;
    const endDateTime = new Date(`${endDateStr}T${endTime}:00`);

    if (endDateTime <= startDateTime) {
        throw new Error("L'heure de fin doit être après l'heure de début.");
    }

    // Pauses rémunérées : NON déduites, breakMinutes reste informatif.
    const diffMinutes = (endDateTime.getTime() - startDateTime.getTime()) / 60000;

    if (diffMinutes <= 0) {
        throw new Error("La durée totale de la vacation doit être positive.");
    }

    return { startDate, startDateTime, endDate, endDateTime, totalHours: diffMinutes / 60 };
}

export async function createWorkShift(input: CreateShiftInput) {
    const { userId } = await auth();
    if (!userId) throw new Error("Utilisateur non authentifié");

    const { startDate, startDateTime, endDate, endDateTime, totalHours } = computeShift(input);
    const hourlyRate = await getHourlyRate();
    const estimatedPay = totalHours * hourlyRate;

    await prisma.workShift.create({
        data: {
            userId,
            startDate,
            startTime: startDateTime,
            endDate,
            endTime: endDateTime,
            breakMinutes: input.breakMinutes,
            totalHours,
            estimatedPay,
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

export async function updateWorkShift(id: string, input: CreateShiftInput) {
    const { userId } = await auth();
    if (!userId) throw new Error("Utilisateur non authentifié");

    const existing = await prisma.workShift.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("Vacation introuvable.");

    const { startDate, startDateTime, endDate, endDateTime, totalHours } = computeShift(input);
    const hourlyRate = await getHourlyRate();
    const estimatedPay = totalHours * hourlyRate;

    await prisma.workShift.update({
        where: { id },
        data: {
            startDate,
            startTime: startDateTime,
            endDate,
            endTime: endDateTime,
            breakMinutes: input.breakMinutes,
            totalHours,
            estimatedPay,
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/calendar");
}

export async function deleteWorkShift(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Utilisateur non authentifié");

    await prisma.workShift.deleteMany({ where: { id, userId } });

    revalidatePath("/dashboard");
    revalidatePath("/calendar");
}