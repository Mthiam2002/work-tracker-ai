"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

import { revalidatePath } from "next/cache";


const SMIC_HORAIRE_DEFAUT = 12.33;

/**
 * Récupérer le taux horaire du SMIC en vigueur.
*/

export async function getHourlyRate() {
    const { userId } = await auth();
    if (!userId) throw new Error("Utilisateur non authentifié");

    const existing = await prisma.hourlyRate.findUnique({
        where: { userId },
    });

    return existing?.rate ?? SMIC_HORAIRE_DEFAUT;
}

/**
 * Créer et mettre à jour le taux horaire courant de l'utilisateur.
*/

export async function updateHourlyRate(newRate: number) {
    const { userId } = await auth();
    if (!userId) throw new Error("Utilisateur non authentifié");

    if (!Number.isFinite(newRate) || newRate <= 0) {
        throw new Error("Le taux horaire doit être un nombre positif.");
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    if (!email) throw new Error("L'adresse email de l'utilisateur est introuvable.");

    await prisma.user.upsert({
        where: { id: userId },
        update: { email },
        create: { id: userId, email },
    });

    await prisma.hourlyRate.upsert({
        where: { userId },
        update: { rate: newRate },
        create: { userId, rate: newRate },
    });

    revalidatePath("/settings");
}
