import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { BackupRestoreForm } from "@/components/BackupRestoreForm";
import Link from "next/link";

async function getShiftYears(): Promise<number[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  const rows = await prisma.workShift.findMany({
    where: { userId },
    select: { startDate: true },
    orderBy: { startDate: "desc" },
  });
  const years = new Set(rows.map((r) => r.startDate.getUTCFullYear()));
  return [...years].sort((a, b) => b - a);
}

export default async function ExportsPage() {
  await requireAuth("/exports");
  const years = await getShiftYears();

  const now = new Date();
  const lastMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  });
  const pdfLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <main className="mt-4">
      <div className="min-w-0">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-[12.5px] font-medium text-accent backdrop-blur transition hover:bg-accent/15"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour au tableau de bord
        </Link>

        <div className="mt-4 motion-safe:animate-[card-in_500ms_ease-out_both]">
          <h1 className="text-[30px] font-extrabold tracking-tight text-card-foreground">Exports</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">
            CSV compatible Excel pour tes vacations, et récapitulatif PDF mensuel (totaux brut/net + détail).
          </p>
        </div>

        <section className="motion-safe:animate-[card-in_500ms_ease-out_both] mt-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:shadow-none">
          <h2 className="text-[15px] font-bold text-card-foreground">Récap PDF mensuel</h2>
          <p className="mt-1 text-sm text-muted-foreground">12 derniers mois, avec totaux brut et net estimé.</p>
          <ul className="mt-4 space-y-2.5">
            {lastMonths.map((m) => (
              <li key={`${m.year}-${m.month}`} className="flex items-center justify-between gap-4 rounded-xl p-3 transition hover:bg-muted/50">
                <span className="tnum text-sm font-semibold capitalize text-card-foreground">{pdfLabel.format(new Date(Date.UTC(m.year, m.month - 1, 1)))}</span>
                <a
                  href={`/api/exports/pdf?year=${m.year}&month=${m.month}`}
                  download
                  className="tnum rounded-full border border-border px-4 py-1.5 text-xs font-medium text-card-foreground transition hover:bg-accent/12 hover:text-accent"
                >
                  PDF
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:shadow-none">
          <h2 className="text-[15px] font-bold text-card-foreground">Sauvegarde complète (JSON)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paramètres, historique de taux, vacations et bulletins (métadonnées — les PDF restent dans Blob). La restauration fusionne sans écraser les doublons.
          </p>
          <a
            href="/api/backup"
            download
            className="mt-4 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent/90"
          >
            Télécharger la sauvegarde (.json)
          </a>
          <BackupRestoreForm />
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:shadow-none">
          <h2 className="text-[15px] font-bold text-card-foreground">CSV — toutes les vacations</h2>
          <p className="mt-1 text-sm text-muted-foreground">Un seul fichier, trié par date croissante.</p>
          <a
            href="/api/exports/csv"
            download
            className="mt-4 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent/90"
          >
            Télécharger tout (.csv)
          </a>
        </section>

        {years.length > 0 && (
          <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:shadow-none">
            <h2 className="text-[15px] font-bold text-card-foreground">CSV par année</h2>
            <ul className="mt-4 space-y-2.5">
              {years.map((y) => (
                <li key={y} className="flex items-center justify-between gap-4 rounded-xl p-3 transition hover:bg-muted/50">
                  <span className="tnum text-sm font-semibold text-card-foreground">{y}</span>
                  <a
                    href={`/api/exports/csv?year=${y}`}
                    download
                    className="tnum rounded-full border border-border px-4 py-1.5 text-xs font-medium text-card-foreground transition hover:bg-accent/12 hover:text-accent"
                  >
                    Télécharger
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
