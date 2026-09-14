import { HourlyRateForm } from "@/components/HourlyRateForm";
import { requireAuth } from "@/lib/require-auth";
import Link from "next/link";
import { getHourlyRate } from "./settings-actions";

export default async function SettingsPage() {
  await requireAuth("/settings");
  const currentRate = await getHourlyRate();

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
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Configuration initiale
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Paramètres</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
            Définis ton taux horaire pour estimer ton salaire à partir de tes vacations.
            Tu pourras le modifier à tout moment en cas d&apos;évolution du SMIC.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                  <path d="M12 2v20M17 6.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2 2.6 5 3.2 5 1.4 5 3.3-2.2 3-5 3-5-1.1-5-3" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-semibold tracking-tight">Taux horaire</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Actuellement : {currentRate.toFixed(2)} €/h</p>
              </div>
            </div>
            <div className="mt-6">
              <HourlyRateForm initialRate={currentRate} />
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl bg-zinc-950 p-6 text-white dark:border dark:border-white/10">
              <h2 className="text-sm font-semibold">Comment c&apos;est calculé ?</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Salaire estimé = heures pointées × taux horaire.
                Les vacations passées gardent le taux du moment.
              </p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
                <p className="text-zinc-400">Exemple</p>
                <p className="mt-1 font-semibold">12h × {currentRate.toFixed(2)} € = {(12 * currentRate).toFixed(2)} €</p>
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold">Étape suivante</h2>
              <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Pointe ta première vacation pour alimenter ton tableau de bord.
              </p>
              <Link
                href="/shifts/new"
                className="mt-4 flex h-11 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Pointer une vacation
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
