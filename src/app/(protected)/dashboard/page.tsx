import { requireAuth } from "@/lib/require-auth";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { getDashboardData, getMonthlyEvolution, getShiftsPage } from "./dashboard-queries";
import { MonthlyChart } from "@/components/MonthlyChart";
import { ShiftsExplorer } from "@/components/ShiftsExplorer";
import { getNetRatio } from "../settings/settings-actions";
import { brutToNet } from "@/lib/salary";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function hoursLabel(h: number) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  await requireAuth("/dashboard");
  const [{ week, month, year, recent }, evolution, netRatio, initialShifts] = await Promise.all([
    getDashboardData(),
    getMonthlyEvolution(6),
    getNetRatio(),
    getShiftsPage({ page: 1, pageSize: 5 }),
  ]);

  const cards = [
    { label: "Cette semaine", ...week },
    { label: "Ce mois-ci", ...month },
    { label: "Cette année", ...year },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Tableau de bord</h1>
            <p className="mt-2 text-[15px] text-zinc-600 dark:text-zinc-400">
              Heures pointées et salaire estimé, par période.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/shifts/new"
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              + Pointer une vacation
            </Link>
            <SignOutButton redirectUrl="/">
              <button
                type="button"
                className="rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Se déconnecter
              </button>
            </SignOutButton>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-3xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-zinc-950"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{c.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{hoursLabel(c.hours)}</p>
              <p className="mt-1 text-lg font-medium text-blue-600 dark:text-blue-400">{eur.format(c.pay)} brut</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">≈ {eur.format(brutToNet(c.pay, netRatio))} net</p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {c.count} vacation{c.count > 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </section>

        <MonthlyChart points={evolution} netRatio={netRatio} />

        <section className="mt-4 rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Vacations</h2>
            <Link href="/calendar" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Voir le calendrier →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-zinc-50 p-8 text-center dark:bg-white/5">
              <p className="text-sm font-medium">Aucune vacation pour le moment</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Pointe ta première vacation de 12h pour voir tes totaux ici.
              </p>
              <Link
                href="/shifts/new"
                className="mt-4 inline-flex rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Pointer une vacation
              </Link>
            </div>
          ) : (
            <ShiftsExplorer initial={initialShifts} netRatio={netRatio} pageSize={5} />
          )}
        </section>
      </main>
    </div>
  );
}
