import { requireAuth } from "@/lib/require-auth";
import { DeletePayslipButton } from "@/components/DeletePayslipButton";
import Link from "next/link";
import { getPayslips, getPayslipYears } from "./payslips-actions";

const monthNames = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default async function PayslipsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireAuth("/payslips");
  const params = await searchParams;
  const selectedYear = params.year ? Number(params.year) : undefined;
  const [years, payslips] = await Promise.all([
    getPayslipYears(),
    getPayslips(selectedYear && Number.isInteger(selectedYear) ? selectedYear : undefined),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour au tableau de bord
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Bulletins de paie</h1>
            <p className="mt-2 text-[15px] text-zinc-600 dark:text-zinc-400">
              {payslips.length} document{payslips.length > 1 ? "s" : ""} · triés par année.
            </p>
          </div>
          <Link
            href="/payslips/upload"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Ajouter un bulletin
          </Link>
        </div>

        {years.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/payslips"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                !selectedYear
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                  : "border border-zinc-200 bg-white hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
              }`}
            >
              Tous
            </Link>
            {years.map((y) => (
              <Link
                key={y}
                href={`/payslips?year=${y}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedYear === y
                    ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                    : "border border-zinc-200 bg-white hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        )}

        <section className="mt-6 rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950">
          {payslips.length === 0 ? (
            <div className="rounded-2xl bg-zinc-50 p-8 text-center dark:bg-white/5">
              <p className="text-sm font-medium">Aucun bulletin {selectedYear ? `pour ${selectedYear}` : "pour le moment"}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Téléverse ton premier PDF pour le retrouver ici.</p>
              <Link
                href="/payslips/upload"
                className="mt-4 inline-flex rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Téléverser un bulletin
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-white/10">
              {payslips.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                        <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
                        <path d="M14 3v5h5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.fileName}</p>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {p.month ? `${monthNames[p.month]} ` : ""}{p.year} · téléversé le{" "}
                        {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(p.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/api/payslips/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-medium transition hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
                    >
                      Voir
                    </a>
                    <DeletePayslipButton id={p.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
