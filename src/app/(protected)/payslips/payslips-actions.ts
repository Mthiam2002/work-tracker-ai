"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { put, del } from "@vercel/blob";
import { revalidatePath } from "next/cache";

const MAX_SIZE = 10 * 1024 * 1024;

export async function getPayslipYears() {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  const rows = await prisma.payslip.findMany({
    where: { userId },
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });
  return rows.map((r) => r.year);
}

export async function getPayslips(year?: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  return prisma.payslip.findMany({
    where: { userId, ...(year ? { year } : {}) },
    orderBy: [{ year: "desc" }, { month: "desc" }, { uploadedAt: "desc" }],
  });
}

export async function uploadPayslip(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Stockage non configuré : renseigne BLOB_READ_WRITE_TOKEN dans .env (Vercel → Storage → Blob).");
  }

  const file = formData.get("file") as File | null;
  const year = Number(formData.get("year"));
  const monthRaw = formData.get("month");
  const month = monthRaw ? Number(monthRaw) : null;

  if (!file || file.size === 0) throw new Error("Merci de choisir un fichier PDF.");
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Seuls les fichiers PDF sont acceptés.");
  }
  if (file.size > MAX_SIZE) throw new Error("Fichier trop lourd (max 10 Mo).");
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("Année invalide.");
  if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) {
    throw new Error("Mois invalide.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `payslips/${userId}/${year}/${month ?? "00"}-${Date.now()}-${safeName}`;
  // Store privé (recommandé pour des bulletins) : lecture via /api/payslips/[id].
  const blob = await put(path, file, { access: "private" });

  await prisma.payslip.create({
    data: { userId, year, month, fileName: file.name, fileUrl: blob.url },
  });

  revalidatePath("/payslips");
}

export async function deletePayslip(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");

  const existing = await prisma.payslip.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Bulletin introuvable.");

  try {
    await del(existing.fileUrl);
  } catch {
    // Fichier déjà supprimé côté Blob : on nettoie quand même la base.
  }
  await prisma.payslip.delete({ where: { id } });

  revalidatePath("/payslips");
}
