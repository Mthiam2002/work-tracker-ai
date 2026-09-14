import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

async function getShiftYears(): Promise<number[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Utilisateur non authentifié");
  const rows = await prisma.workShift.findMany({
    where: { userId },
    select: { startDate: true },
    orderBy: { startDate: "desc" },
  });
  const years = new Set(rows.map((r) => r.startDate.getFullYear()));
  return [...years].sort((a, b) => b - a);
}

export default async function ExportsPage() {
  await requireAuth("/exports");
  const years = await getShiftYears();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour au tableau de bord
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-semibold tracking-tight">Exports CSV</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
            Télécharge tes vacations : date, horaires, nuit, pause, heures totales et paie estimée. Format compatible Excel (séparateur point-virgule).
          </p>
        </div>

        <section className="mt-8 rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-base font-semibold tracking-tight">Toutes les vacations</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Un seul fichier, trié par date croissante.</p>
          <a
            href="/api/exports/csv"
            download
            className="mt-4 inline-flex rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Télécharger tout (.csv)
          </a>
        </section>

        {years.length > 0 && (
          <section className="mt-4 rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-base font-semibold tracking-tight">Par année</h2>
            <ul className="mt-4 space-y-2.5">
              {years.map((y) => (
                <li key={y} className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-white/5">
                  <span className="text-sm font-semibold">{y}</span>
                  <a
                    href={`/api/exports/csv?year=${y}`}
                    download
                    className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-medium transition hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    Télécharger
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
