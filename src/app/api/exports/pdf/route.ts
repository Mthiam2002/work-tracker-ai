import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

function fmtDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function fmtTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function fmtEur(n: number) {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Non authentifié", { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return new Response("Mois invalide", { status: 400 });
  }

  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  const [shifts, user] = await Promise.all([
    prisma.workShift.findMany({ where: { userId, startDate: { gte: from, lt: to } }, orderBy: { startDate: "asc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { netRatio: true } }),
  ]);
  const netRatio = user?.netRatio ?? 0.77;

  const totalHours = shifts.reduce((a, s) => a + s.totalHours, 0);
  const totalPay = shifts.reduce((a, s) => a + s.estimatedPay, 0);

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const label = monthLabel.format(new Date(Date.UTC(year, month - 1, 1)));
  doc.fontSize(20).text(`Récapitulatif — ${label}`, { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).text(`Work Tracker · ${shifts.length} vacation(s) · ${totalHours.toFixed(2).replace(".", ",")} h`);
  doc.text(`Total brut estimé : ${fmtEur(totalPay)} · Net estimé (≈ ${(netRatio * 100).toFixed(1).replace(".", ",")} %) : ${fmtEur(totalPay * netRatio)}`);
  doc.moveDown(1);

  if (shifts.length === 0) {
    doc.fontSize(12).text("Aucune vacation ce mois-ci.");
  } else {
    doc.fontSize(10);
    const cols = [70, 60, 60, 70, 70, 80];
    const headers = ["Date", "Début", "Fin", "Heures", "Brut", "Net ≈"];
    let x = doc.x;
    headers.forEach((h, i) => {
      doc.text(h, x, doc.y, { width: cols[i], continued: i < headers.length - 1 });
      x += cols[i];
    });
    doc.moveDown(0.5);
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
    doc.moveDown(0.5);

    for (const s of shifts) {
      if (doc.y > doc.page.height - 80) doc.addPage();
      const row = [
        fmtDate(s.startDate),
        fmtTime(s.startTime),
        fmtTime(s.endTime) + (s.endDate.getTime() !== s.startDate.getTime() ? " (+1j)" : ""),
        s.totalHours.toFixed(2).replace(".", ","),
        fmtEur(s.estimatedPay),
        fmtEur(s.estimatedPay * netRatio),
      ];
      let rx = doc.page.margins.left;
      row.forEach((v, i) => {
        doc.text(v, rx, doc.y, { width: cols[i], continued: i < row.length - 1 });
        rx += cols[i];
      });
      doc.moveDown(0.7);
    }
  }

  doc.moveDown(1);
  doc.fontSize(9).fillColor("gray").text("Montants estimatifs (pauses rémunérées incluses, majorations incluses). Net indicatif selon ton ratio.");
  doc.end();

  const pdf = await done;
  const mm = String(month).padStart(2, "0");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recap-${year}-${mm}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
