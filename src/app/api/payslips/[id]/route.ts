import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response("Non authentifié", { status: 401 });

  const { id } = await params;
  const payslip = await prisma.payslip.findFirst({ where: { id, userId } });
  if (!payslip) return new Response("Introuvable", { status: 404 });

  const blob = await get(payslip.fileUrl, { access: "private" });
  if (!blob || !blob.stream) return new Response("Fichier indisponible", { status: 404 });

  const safeName = payslip.fileName.replace(/"/g, "");
  return new Response(blob.stream as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
