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

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 motion-safe:animate-[card-in_500ms_ease-out_both]">
          <div>
            <h1 className="text-[30px] font-extrabold tracking-tight text-card-foreground">Bulletins de paie</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              {payslips.length} document{payslips.length > 1 ? "s" : ""} · triés par année.
            </p>
          </div>
          <Link
            href="/payslips/upload"
            className="rounded-full bg-accent px-5 py-2.5 text-[12px] font-medium text-white transition hover:bg-accent/90"
          >
            + Ajouter un bulletin
          </Link>
        </div>

        {years.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 motion-safe:animate-[card-in_500ms_ease-out_both]">
            <Link
              href="/payslips"
              className={`rounded-full px-4 py-2 text-[12px] font-medium transition ${
                !selectedYear
                  ? "bg-accent text-white"
                  : "border border-border bg-card text-card-foreground hover:bg-muted"
              }`}
            >
              Tous
            </Link>
            {years.map((y) => (
              <Link
                key={y}
                href={`/payslips?year=${y}`}
                className={`rounded-full px-4 py-2 text-[12px] font-medium transition ${
                  selectedYear === y
                    ? "bg-accent text-white"
                    : "border border-border bg-card text-card-foreground hover:bg-muted"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        )}

        <section className="motion-safe:animate-[card-in_500ms_ease-out_both] mt-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:shadow-none">
          {payslips.length === 0 ? (
            <div className="mt-4 rounded-xl bg-muted p-8 text-center">
              <p className="text-sm font-medium text-card-foreground">
                Aucun bulletin {selectedYear ? `pour ${selectedYear}` : "pour le moment"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Téléverse ton premier PDF pour le retrouver ici.
              </p>
              <Link
                href="/payslips/upload"
                className="mt-4 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent/90"
              >
                Téléverser un bulletin
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {payslips.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-4 transition hover:bg-muted/50">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                        <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
                        <path d="M14 3v5h5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="tnum truncate text-sm font-semibold text-card-foreground">{p.fileName}</p>
                      <p className="tnum mt-0.5 text-sm text-muted-foreground">
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
                      className="tnum rounded-full border border-border px-4 py-1.5 text-xs font-medium text-card-foreground transition hover:bg-muted hover:text-accent"
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
      </div>
    </main>
  );
}
