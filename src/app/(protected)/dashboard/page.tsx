import { requireAuth } from "@/lib/require-auth";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { getDashboardData, getMonthlyEvolution, getShiftsPage } from "./dashboard-queries";
import { MonthlyChart } from "@/components/MonthlyChart";
import { ShiftsExplorer } from "@/components/ShiftsExplorer";
import { getNetRatio } from "../settings/settings-actions";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function hoursLabel(h: number) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
}

function pct(cur: number, prev: number) {
  if (!prev || prev <= 0) return cur > 0 ? "+100%" : "+0%";
  const v = ((cur - prev) / prev) * 100;
  return `+${Math.round(v)}%`;
}

function fmtFull(iso: string) {
  const d = new Date(iso);
  const s = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtHM(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(iso));
}

function MiniSpark({ color, id }: { color: string; id: string }) {
  const paths: Record<string, string> = {
    w: "M0,26 C15,24 25,18 38,20 C50,22 58,10 72,12 C86,14 94,20 108,14 C120,9 132,12 148,6",
    m: "M0,24 C20,22 35,26 55,20 C75,14 95,18 115,12 C130,8 140,14 148,10",
    y: "M0,22 C20,20 40,24 60,18 C80,12 100,16 120,12 C135,9 142,12 148,8",
  };
  return (
    <svg viewBox="0 0 148 32" className="mt-2 h-8 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${paths[id] ?? paths.w} L148,32 L0,32 Z`} fill={`url(#${id})`} />
      <path d={paths[id] ?? paths.w} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default async function DashboardPage() {
  await requireAuth("/dashboard");
  const clerkUser = await currentUser().catch(() => null);
  const firstName = clerkUser?.firstName ?? "Mamoudou";

  const [{ week, month, year, recent, prevWeek, prevMonth, prevYear }, evolution, netRatio, initialShifts] = await Promise.all([
    getDashboardData(),
    getMonthlyEvolution(6),
    getNetRatio(),
    getShiftsPage({ page: 1, pageSize: 5 }),
  ]);

  const upcoming = [...recent]
    .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))
    .slice(0, 5);

  const dot: Record<number, string> = { 0: "#1d6ff2", 1: "#1d6ff2", 2: "#0e7c6b", 3: "#6d3fd4", 4: "#6d3fd4" };

  return (
    <main className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      {/* Colonne centrale */}
      <div className="min-w-0">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-[#2f6db3] text-white shadow-[0_1px_2px_rgba(16,42,80,0.12)]">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgba(38,93,158,0.96) 30%, rgba(58,130,190,0.55) 58%, rgba(40,100,160,0.15) 78%), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop') center/cover",
            }}
          />
          <div className="relative flex min-h-[168px] flex-col justify-center p-6 sm:p-7">
            <p className="text-[15px] font-medium text-white/95">Bonjour {firstName} 👋</p>
            <h1 className="mt-1 text-[32px] font-extrabold leading-none tracking-tight">Tableau de bord</h1>
            <p className="mt-2 max-w-[380px] text-[13px] leading-snug text-white/85">
              Suivez vos heures, vos revenus et vos prochaines vacations en un coup d&apos;œil.
            </p>
            <p className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 rotate-[-6deg] text-right font-[cursive] text-[22px] italic leading-tight text-white drop-shadow-md md:block">
              Chaque heure
              <br />
              compte !
            </p>
          </div>
        </section>

        {/* 4 cartes */}
        <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <div className="rounded-2xl border border-[#dbe9fd] bg-[#f2f7ff] p-4 shadow-[0_1px_2px_rgba(16,42,80,0.06)] dark:bg-zinc-950 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#16233a] dark:text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1d6ff2] text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 1.5" strokeLinecap="round" /></svg>
                </span>
                Cette semaine
              </span>
              <span className="text-[#9aa7bc]">...</span>
            </div>
            <p className="mt-2 text-[26px] font-extrabold text-[#16233a] dark:text-white">{hoursLabel(week.hours)}</p>
            <p className="text-[13px] font-semibold text-[#1d6ff2]">{eur.format(week.pay)} brut</p>
            <p className="mt-0.5 text-[11.5px] font-medium text-emerald-600">↑ {pct(week.pay, prevWeek.pay)} vs. semaine précédente</p>
            <MiniSpark color="#1d6ff2" id="w" />
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#5b6b82] dark:text-zinc-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 text-[#1d6ff2]"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18" /></svg>
              {week.count} vacation{week.count > 1 ? "s" : ""}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d6f0e3] bg-[#f0faf5] p-4 shadow-[0_1px_2px_rgba(16,42,80,0.06)] dark:bg-zinc-950 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#16233a] dark:text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" /></svg>
                </span>
                Ce mois-ci
              </span>
              <span className="text-[#9aa7bc]">...</span>
            </div>
            <p className="mt-2 text-[26px] font-extrabold text-[#16233a] dark:text-white">{hoursLabel(month.hours)}</p>
            <p className="text-[13px] font-semibold text-emerald-700">{eur.format(month.pay)} brut</p>
            <p className="mt-0.5 text-[11.5px] font-medium text-emerald-600">↑ {pct(month.pay, prevMonth.pay)} vs. mois précédent</p>
            <MiniSpark color="#10b981" id="m" />
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#5b6b82] dark:text-zinc-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 text-emerald-500"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18" /></svg>
              {month.count} vacations
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2d9fb] bg-[#f5f1ff] p-4 shadow-[0_1px_2px_rgba(16,42,80,0.06)] dark:bg-zinc-950 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#16233a] dark:text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6d3fd4] text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" /></svg>
                </span>
                Cette année
              </span>
              <span className="text-[#9aa7bc]">...</span>
            </div>
            <p className="mt-2 text-[26px] font-extrabold text-[#16233a] dark:text-white">{hoursLabel(year.hours)}</p>
            <p className="text-[13px] font-semibold text-[#6d3fd4]">{eur.format(year.pay)} brut</p>
            <p className="mt-0.5 text-[11.5px] font-medium text-emerald-600">↑ {pct(year.pay, prevYear.pay)} vs. année précédente</p>
            <MiniSpark color="#7c4dff" id="y" />
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#5b6b82] dark:text-zinc-400">
              <span className="font-bold text-[#16233a] dark:text-white">13</span> {year.count} vacations
            </p>
          </div>

          <div className="rounded-2xl border border-[#f5e3c8] bg-[#fdf6ea] p-4 shadow-[0_1px_2px_rgba(16,42,80,0.06)] dark:bg-zinc-950 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#16233a] dark:text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-400 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 1.5" strokeLinecap="round" /></svg>
                </span>
                Cette année (revenus)
              </span>
              <span className="text-[#9aa7bc]">...</span>
            </div>
            <p className="mt-2 text-[24px] font-extrabold text-[#16233a] dark:text-white">{eur.format(year.pay)}</p>
            <p className="text-[12px] text-[#8a97ad]">brut (cette année)</p>
            <p className="mt-0.5 text-[11.5px] font-medium text-emerald-600">↑ {pct(year.pay, prevYear.pay)} vs. année précédente</p>
            <svg viewBox="0 0 148 40" className="mt-2 h-10 w-full" preserveAspectRatio="none">
              {[10, 18, 8, 22, 16, 26, 20, 30, 24, 34].map((h, i) => (
                <rect key={i} x={i * 15} y={40 - h} width="9" rx="2" height={h} fill={i >= 8 ? "#f5a623" : "#f5c57c"} opacity={i >= 8 ? 1 : 0.7} />
              ))}
            </svg>
          </div>
        </section>

        <div className="mt-4">
          <MonthlyChart points={evolution} netRatio={netRatio} />
        </div>

        <section className="mt-4 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:bg-zinc-950 dark:border dark:border-white/10 dark:shadow-none">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1d6ff2] text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" /></svg>
            </span>
            <h2 className="text-[15px] font-bold text-[#16233a] dark:text-white">Vacations</h2>
            <span className="ml-auto flex items-center gap-2">
              <Link href="/calendar" className="text-[12px] font-semibold text-[#1d6ff2]">Voir le calendrier →</Link>
              <Link href="/shifts/new" className="rounded-full border border-[#dbe9fd] bg-[#f2f7ff] px-3.5 py-1.5 text-[12px] font-semibold text-[#1d5dbf]">+ Ajouter</Link>
            </span>
          </div>
          <ShiftsExplorer initial={initialShifts} netRatio={netRatio} pageSize={5} />
        </section>
      </div>

      {/* Sidebar droite */}
      <div className="flex min-w-0 flex-col gap-5">
        <section className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(16,42,80,0.06)] dark:bg-zinc-950 dark:border dark:border-white/10 dark:shadow-none">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-[#16233a] dark:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" strokeLinejoin="round" /></svg>
            Actions rapides
          </h2>
          <div className="mt-3 flex flex-col gap-2.5">
            <Link href="/calendar" className="flex items-center gap-3 rounded-xl bg-[#f2f7ff] p-3 transition hover:bg-[#e6efff]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d6ff2] text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" /></svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-bold text-[#16233a]">Voir mon calendrier</span>
                <span className="block text-[11px] text-[#8a97ad]">Consulter mes vacations</span>
              </span>
              <span className="text-[#8a97ad]">›</span>
            </Link>
            <Link href="/shifts/new" className="flex items-center gap-3 rounded-xl bg-[#eefaf4] p-3 transition hover:bg-[#dff3e8]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-xl font-bold text-white">+</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-bold text-[#16233a]">Ajouter une vacation</span>
                <span className="block text-[11px] text-[#8a97ad]">Enregistrer une nouvelle période</span>
              </span>
              <span className="text-[#8a97ad]">›</span>
            </Link>
            <Link href="/payslips" className="flex items-center gap-3 rounded-xl bg-[#f5f1ff] p-3 transition hover:bg-[#ece4fd]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6d5ef0] text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4"><path d="M6 2.5h9l4 4v15H6V2.5z" strokeLinejoin="round" /><path d="M14.5 2.5v5h5" /></svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-bold text-[#16233a]">Voir mes bulletins</span>
                <span className="block text-[11px] text-[#8a97ad]">Consulter mes fiches de paie</span>
              </span>
              <span className="text-[#8a97ad]">›</span>
            </Link>
            <Link href="/exports" className="flex items-center gap-3 rounded-xl bg-[#fdf6ea] p-3 transition hover:bg-[#fbeed9]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-400 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4"><path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 17v3.5h16V17" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-bold text-[#16233a]">Exporter mes données</span>
                <span className="block text-[11px] text-[#8a97ad]">PDF, Excel, CSV</span>
              </span>
              <span className="text-[#8a97ad]">›</span>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(16,42,80,0.06)] dark:bg-zinc-950 dark:border dark:border-white/10 dark:shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-[#16233a] dark:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" /></svg>
              Prochaines vacations
            </h2>
            <Link href="/calendar" className="text-[12px] font-semibold text-[#1d6ff2]">Voir tout →</Link>
          </div>
          <ul className="mt-2 divide-y divide-[#f1f4f9] dark:divide-white/5">
            {upcoming.length === 0 && <li className="py-3 text-[12.5px] text-[#8a97ad]">Aucune vacation à venir.</li>}
            {upcoming.map((s, i) => (
              <li key={s.id}>
                <Link href="/calendar" className="flex items-center gap-2.5 py-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot[i] ?? "#1d6ff2" }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-bold text-[#16233a] dark:text-white">{fmtFull(s.startDate.toISOString())}</span>
                    <span className="block text-[11.5px] text-[#8a97ad]">
                      {fmtHM(s.startTime.toISOString())} → {fmtHM(s.endTime.toISOString())}
                      {s.endDate.toISOString().slice(0, 10) !== s.startDate.toISOString().slice(0, 10) ? " (+1j)" : ""} · {hoursLabel(s.totalHours)}
                    </span>
                  </span>
                  <span className="rounded-full bg-[#e8f0fd] px-2.5 py-1 text-[10.5px] font-semibold text-[#1d5dbf]">À venir</span>
                  <span className="text-[#9aa7bc]">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </main>
  );
}
