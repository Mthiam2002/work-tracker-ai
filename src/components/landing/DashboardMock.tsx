"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CountUp } from "@/components/CountUp";

/**
 * Maquette animée du tableau de bord (aperçu produit dans le hero).
 * Thème forcé en sombre (.theme-dark) : le hero reste sombre quel que
 * soit le thème système du visiteur.
 */

const NAV = [
  { label: "Tableau de bord", active: true },
  { label: "Calendrier", active: false },
  { label: "Bulletins", active: false },
  { label: "Paramètres", active: false },
];

// Brut estimé des 6 derniers mois (démo)
const MONTHS = [
  { m: "Juin", v: 4210 },
  { m: "Juil", v: 3480 },
  { m: "Août", v: 2640 },
  { m: "Sep", v: 4890 },
  { m: "Oct", v: 5120 },
  { m: "Nov", v: 793 },
];

const ROWS = [
  { day: "Lun 10", time: "12:00 → 00:00", hours: "11h", pay: "147,42 €", tag: "Jour" },
  { day: "Mer 12", time: "20:00 → 08:00", hours: "11h", pay: "172,80 €", tag: "Nuit" },
  { day: "Ven 14", time: "08:00 → 16:00", hours: "7h30", pay: "99,75 €", tag: "Jour" },
];

const max = Math.max(...MONTHS.map((x) => x.v));

export function DashboardMock() {
  const reduce = useReducedMotion();

  const rise = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: 0.6 + i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <div
      role="img"
      aria-label="Aperçu du tableau de bord Work Tracker : heures, brut et net du mois, graphique des revenus et dernières vacations"
      className="theme-dark overflow-hidden rounded-2xl border border-white/12 bg-card text-card-foreground shadow-[0_30px_70px_-20px_rgba(0,0,0,0.65)]"
    >
      {/* Barre de titre façon app */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-loss/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-premium/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-profit/70" />
        <span className="tnum ml-3 text-[11px] text-muted-foreground">app.work-tracker.fr/dashboard</span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-[152px] shrink-0 border-r border-border p-3 sm:block">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5 text-white">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-[12.5px] font-bold">Work Tracker</span>
          </div>
          <nav className="mt-3 space-y-1">
            {NAV.map((n, i) => (
              <motion.span
                key={n.label}
                {...rise(i)}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11.5px] font-semibold ${
                  n.active ? "bg-accent text-white" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${n.active ? "bg-white" : "bg-muted-foreground/50"}`}
                />
                {n.label}
              </motion.span>
            ))}
          </nav>
        </aside>

        {/* Contenu */}
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Tableau de bord
              </p>
              <p className="mt-0.5 text-[15px] font-extrabold">Novembre 2026</p>
            </div>
            <span className="hidden rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-semibold text-white sm:block">
              + Vacation
            </span>
          </div>

          {/* Stat cards avec compteurs */}
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <motion.div {...rise(0)} className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Heures</p>
              <p className="tnum mt-1 text-[19px] font-extrabold leading-none">
                <CountUp value={48} kind="hours" />
              </p>
            </motion.div>
            <motion.div {...rise(1)} className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Brut</p>
              <p className="tnum mt-1 text-[19px] font-extrabold leading-none text-profit">
                <CountUp value={793.15} kind="currency" />
              </p>
            </motion.div>
            <motion.div {...rise(2)} className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Net</p>
              <p className="tnum mt-1 text-[19px] font-extrabold leading-none text-accent">
                <CountUp value={618.66} kind="currency" />
              </p>
            </motion.div>
          </div>

          {/* Chart */}
          <div className="mt-3 rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-bold">Évolution des revenus</p>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[9.5px] font-semibold text-muted-foreground">
                Brut
              </span>
            </div>
            <div className="mt-3 flex h-[74px] items-end gap-2">
              {MONTHS.map((mo, i) => (
                <div key={mo.m} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <motion.div
                    initial={reduce ? false : { scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{
                      duration: 0.55,
                      delay: 0.75 + i * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{ height: `${Math.max(8, (mo.v / max) * 58)}px`, transformOrigin: "bottom" }}
                    className={`w-full rounded-md ${
                      i === MONTHS.length - 1 ? "bg-accent" : "bg-accent/35"
                    }`}
                  />
                  <span className="text-[9px] text-muted-foreground">{mo.m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dernières vacations */}
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-background/60">
            {ROWS.map((r, i) => (
              <motion.div key={r.day} {...rise(3 + i)} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-[9.5px] font-bold text-white">
                  {r.day.split(" ")[1]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="tnum block truncate text-[11.5px] font-bold">
                    {r.hours} · {r.pay}
                  </span>
                  <span className="tnum block text-[10px] text-muted-foreground">{r.time}</span>
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[9.5px] font-semibold text-muted-foreground">
                  {r.tag}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
