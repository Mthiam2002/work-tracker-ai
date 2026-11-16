import { requireAuth } from "@/lib/require-auth";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { getDashboardData, getMonthlyEvolution, getShiftsPage } from "./dashboard-queries";
import { MonthlyChart } from "@/components/MonthlyChart";
import { ShiftsExplorer } from "@/components/ShiftsExplorer";
import { StatCard } from "@/components/StatCard";
import { CountUp } from "@/components/CountUp";
import { getNetRatio } from "../settings/settings-actions";

function pct(cur: number, prev: number) {
  if (!prev || prev <= 0) return cur > 0 ? "+100%" : "+0%";
  const v = ((cur - prev) / prev) * 100;
  return `+${Math.round(v)}%`;
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

  const [{ week, month, year, prevWeek, prevMonth, prevYear }, evolution, netRatio, initialShifts] = await Promise.all([
    getDashboardData(),
    getMonthlyEvolution(6),
    getNetRatio(),
    getShiftsPage({ page: 1, pageSize: 5 }),
  ]);

  return (
    <main className="mt-4">
      {/* Colonne centrale */}
      <div className="min-w-0">
        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-2xl text-white shadow-[0_1px_2px_rgba(16,42,80,0.12)] motion-safe:animate-[card-in_500ms_ease-out_both]"
          style={{ background: "linear-gradient(120deg, var(--hero-from) 0%, var(--hero-to) 100%)" }}
        >
          {/* Glow accent */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-premium/20 blur-3xl" />
          {/* Grille subtile */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
              maskImage: "radial-gradient(ellipse at 75% 25%, black, transparent 75%)",
            }}
          />
          <div className="relative flex min-h-[168px] items-center justify-between gap-6 p-6 sm:p-7">
            <div>
              <p className="text-[15px] font-medium text-white/95">Bonjour {firstName} 👋</p>
              <h1 className="mt-1 text-[32px] font-extrabold leading-none tracking-tight">Tableau de bord</h1>
              <p className="mt-2 max-w-[380px] text-[13px] leading-snug text-white/75">
                Suivez vos heures, vos revenus et vos prochaines vacations en un coup d&apos;œil.
              </p>
            </div>
            {/* KPI glass */}
            <div className="hidden shrink-0 rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-right backdrop-blur-sm md:block">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/65">
                Cette année
              </p>
              <p className="tnum mt-1 text-[22px] font-extrabold leading-none">
                <CountUp value={year.hours} kind="hours" />
              </p>
              <p className="tnum text-[13px] font-semibold text-white/85">
                <CountUp value={year.pay} kind="currency" />
              </p>
            </div>
          </div>
        </section>

        {/* 4 cartes */}
        <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard
            index={0}
            title="Cette semaine"
            tone="accent"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 1.5" strokeLinecap="round" /></svg>}
            footer={
              <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 text-accent"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18" /></svg>
                {week.count} vacation{week.count > 1 ? "s" : ""}
              </p>
            }
          >
            <p className="tnum mt-2 text-[26px] font-extrabold text-card-foreground">
              <CountUp value={week.hours} kind="hours" />
            </p>
            <p className="tnum text-[13px] font-semibold text-accent">
              <CountUp value={week.pay} kind="currency" /> brut
            </p>
            <p className={`mt-0.5 text-[11.5px] font-medium ${week.pay >= prevWeek.pay ? "text-profit" : "text-loss"}`}>
              {week.pay >= prevWeek.pay ? "↑" : "↓"} {pct(week.pay, prevWeek.pay)} vs. semaine précédente
            </p>
            <MiniSpark color="var(--accent)" id="w" />
          </StatCard>

          <StatCard
            index={1}
            title="Ce mois-ci"
            tone="profit"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" /></svg>}
            footer={
              <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 text-profit"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18" /></svg>
                {month.count} vacations
              </p>
            }
          >
            <p className="tnum mt-2 text-[26px] font-extrabold text-card-foreground">
              <CountUp value={month.hours} kind="hours" />
            </p>
            <p className="tnum text-[13px] font-semibold text-profit">
              <CountUp value={month.pay} kind="currency" /> brut
            </p>
            <p className={`mt-0.5 text-[11.5px] font-medium ${month.pay >= prevMonth.pay ? "text-profit" : "text-loss"}`}>
              {month.pay >= prevMonth.pay ? "↑" : "↓"} {pct(month.pay, prevMonth.pay)} vs. mois précédent
            </p>
            <MiniSpark color="var(--profit)" id="m" />
          </StatCard>

          <StatCard
            index={2}
            title="Cette année"
            tone="premium"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" /></svg>}
            footer={
              <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <span className="font-bold text-card-foreground">{year.count}</span> vacations
              </p>
            }
          >
            <p className="tnum mt-2 text-[26px] font-extrabold text-card-foreground">
              <CountUp value={year.hours} kind="hours" />
            </p>
            <p className="tnum text-[13px] font-semibold text-premium">
              <CountUp value={year.pay} kind="currency" /> brut
            </p>
            <p className={`mt-0.5 text-[11.5px] font-medium ${year.pay >= prevYear.pay ? "text-profit" : "text-loss"}`}>
              {year.pay >= prevYear.pay ? "↑" : "↓"} {pct(year.pay, prevYear.pay)} vs. année précédente
            </p>
            <MiniSpark color="var(--premium)" id="y" />
          </StatCard>

          <StatCard
            index={3}
            title="Cette année (revenus)"
            tone="warning"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 1.5" strokeLinecap="round" /></svg>}
            footer={<p className="text-[12px] text-muted-foreground">brut (cette année)</p>}
          >
            <p className="tnum mt-2 text-[24px] font-extrabold text-card-foreground">
              <CountUp value={year.pay} kind="currency" />
            </p>
            <p className={`mt-0.5 text-[11.5px] font-medium ${year.pay >= prevYear.pay ? "text-profit" : "text-loss"}`}>
              {year.pay >= prevYear.pay ? "↑" : "↓"} {pct(year.pay, prevYear.pay)} vs. année précédente
            </p>
            <svg viewBox="0 0 148 40" className="mt-2 h-10 w-full" preserveAspectRatio="none">
              {[10, 18, 8, 22, 16, 26, 20, 30, 24, 34].map((h, i) => (
                <rect key={i} x={i * 15} y={40 - h} width="9" rx="2" height={h} fill={i >= 8 ? "var(--profit)" : "var(--muted)"} opacity={i >= 8 ? 1 : 0.7} />
              ))}
            </svg>
          </StatCard>
        </section>

        <div className="mt-4">
          <MonthlyChart points={evolution} netRatio={netRatio} />
        </div>

        <section className="motion-safe:animate-[card-in_500ms_ease-out_both] mt-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:shadow-none">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" /></svg>
            </span>
            <h2 className="text-[15px] font-bold text-card-foreground">Vacations</h2>
            <span className="ml-auto flex items-center gap-2">
              <Link href="/calendar" className="text-[12px] font-semibold text-accent transition hover:underline">Voir le calendrier →</Link>
              <Link href="/shifts/new" className="rounded-full border border-accent/25 bg-accent/10 px-3.5 py-1.5 text-[12px] font-semibold text-accent transition hover:bg-accent/20">+ Ajouter</Link>
            </span>
          </div>
          <ShiftsExplorer initial={initialShifts} netRatio={netRatio} pageSize={5} />
        </section>
      </div>
    </main>
  );
}
