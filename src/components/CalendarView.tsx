"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { brutToNet } from "@/lib/salary";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export type CalShift = {
  id: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  breakMinutes: number;
  totalHours: number;
  estimatedPay: number;
};

type View = "mois" | "semaine" | "jour";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function hoursLabel(h: number) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
}

function fmtHM(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(iso));
}

function fmtLong(isoDate: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${isoDate}T12:00:00Z`)
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoOf(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function addDaysISO(iso: string, delta: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function mondayOfWeek(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

function Badge({ s }: { s: CalShift }) {
  const night = s.endDate.slice(0, 10) !== s.startDate.slice(0, 10) ? " (+1j)" : "";
  return (
    <div
      title={`${fmtHM(s.startTime)} → ${fmtHM(s.endTime)}${night} · pause ${s.breakMinutes} min`}
      className="mt-1 flex items-center gap-1 truncate rounded-md bg-accent px-1.5 py-1 text-[9.5px] font-semibold leading-tight text-white sm:text-[10.5px]"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
      <span className="truncate">
        {hoursLabel(s.totalHours)} - {eur.format(s.estimatedPay)}
      </span>
    </div>
  );
}

export function CalendarView({
  shifts,
  year,
  month,
  monthLabel,
  prevHref,
  nextHref,
  netRatio,
}: {
  shifts: CalShift[];
  year: number;
  month: number;
  monthLabel: string;
  prevHref: string;
  nextHref: string;
  netRatio: number;
}) {
  const items = shifts;
  const [view, setView] = useState<View>("mois");

  const todayISO = new Date().toISOString().slice(0, 10);
  const monthPrefix = `${year}-${pad(month)}`;
  const [selectedISO, setSelectedISO] = useState<string>(() =>
    todayISO.slice(0, 7) === monthPrefix
      ? todayISO
      : shifts.length > 0
        ? shifts[shifts.length - 1].startDate.slice(0, 10)
        : isoOf(year, month, 1)
  );

  const byDay = useMemo(() => {
    const m = new Map<number, CalShift[]>();
    for (const s of items) {
      if (s.startDate.slice(0, 7) !== monthPrefix) continue;
      const day = Number(s.startDate.slice(8, 10));
      if (!m.has(day)) m.set(day, []);
      m.get(day)!.push(s);
    }
    return m;
  }, [items, monthPrefix]);

  const byISO = useMemo(() => {
    const m = new Map<string, CalShift[]>();
    for (const s of items) {
      const k = s.startDate.slice(0, 10);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return m;
  }, [items]);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadBlanks = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const prevMonthDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  const monthCells: { day: number; inMonth: boolean; iso: string | null }[] = [];
  for (let i = leadBlanks - 1; i >= 0; i--) {
    monthCells.push({ day: prevMonthDays - i, inMonth: false, iso: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    monthCells.push({ day: d, inMonth: true, iso: isoOf(year, month, d) });
  }
  let trail = 1;
  while (monthCells.length % 7 !== 0) {
    monthCells.push({ day: trail++, inMonth: false, iso: null });
  }

  const weekStart = mondayOfWeek(selectedISO);
  const weekCells = Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysISO(weekStart, i);
    const inMonth = iso.slice(0, 7) === monthPrefix;
    return { iso, day: Number(iso.slice(8, 10)), inMonth };
  });

  const dayShifts = byISO.get(selectedISO) ?? [];

  void brutToNet;
  void netRatio;

  return (
    <>
      {/* Carte grille + toolbar */}
      <section className="motion-safe:animate-[card-in_500ms_ease-out_both] rounded-2xl border border-border bg-card p-3 shadow-[0_1px_2px_rgba(16,42,80,0.08)] sm:p-5 dark:shadow-none">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-1.5">
            <Link
              href={prevHref}
              aria-label="Mois précédent"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-[16px] font-bold text-card-foreground transition hover:bg-accent/15"
            >
              ‹
            </Link>
            <span className="flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-[13px] font-bold text-card-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                <path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
              </svg>
              {monthLabel}
            </span>
            <Link
              href={nextHref}
              aria-label="Mois suivant"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-[16px] font-bold text-card-foreground transition hover:bg-accent/15"
            >
              ›
            </Link>
          </span>

          <span className="mx-auto flex gap-1 rounded-full bg-muted p-1">
            {(["mois", "semaine", "jour"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold capitalize transition ${
                  view === v ? "bg-accent text-white shadow-sm" : "text-muted-foreground hover:text-card-foreground"
                }`}
              >
                {v === "mois" ? "Mois" : v === "semaine" ? "Semaine" : "Jour"}
              </button>
            ))}
          </span>

          <Link
            href="/shifts/new"
            className="rounded-full bg-accent px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-accent/90"
          >
            + Ajouter une vacation
          </Link>
        </div>

        {view === "mois" && (
          <>
            <div className="mt-4 grid grid-cols-7 gap-1.5 text-center sm:gap-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1.5 text-[11.5px] font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {monthCells.map((c, i) => {
                const cellShifts = c.inMonth ? (byDay.get(c.day) ?? []) : [];
                const selected = c.iso !== null && c.iso === selectedISO;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!c.inMonth}
                    onClick={() => c.iso && setSelectedISO(c.iso)}
                    className={`min-h-[64px] rounded-xl border p-1.5 text-left align-top transition sm:min-h-[92px] sm:p-2 ${
                      !c.inMonth
                        ? "border-transparent bg-muted text-muted-foreground"
                        : selected
                          ? "border-accent bg-accent/10 ring-2 ring-accent/40"
                          : cellShifts.length > 0
                            ? "border-accent/30 bg-card hover:border-accent/60"
                            : "border-border bg-card hover:border-border dark:bg-zinc-950 dark:border-white/10"
                    }`}
                  >
                    <span className={`text-[11px] font-semibold sm:text-[12.5px] ${c.inMonth ? "text-card-foreground" : "text-muted-foreground"}`}>
                      {c.day}
                    </span>
                    {c.inMonth && (
                      <span className="block">
                        {cellShifts.slice(0, 2).map((s) => (
                          <Badge key={s.id} s={s} />
                        ))}
                        {cellShifts.length > 2 && (
                          <span className="mt-1 block text-[10px] font-semibold text-accent">+{cellShifts.length - 2}</span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view === "semaine" && (
          <>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedISO(addDaysISO(selectedISO, -7))}
                className="rounded-full bg-accent/10 px-3.5 py-1.5 text-[12px] font-semibold text-card-foreground hover:bg-accent/15"
              >
                ← Semaine préc.
              </button>
              <p className="text-[12.5px] font-semibold text-card-foreground dark:text-zinc-300">
                Sem. du {fmtLong(weekCells[0].iso)} au {fmtLong(weekCells[6].iso)}
              </p>
              <button
                type="button"
                onClick={() => setSelectedISO(addDaysISO(selectedISO, 7))}
                className="rounded-full bg-accent/10 px-3.5 py-1.5 text-[12px] font-semibold text-card-foreground hover:bg-accent/15"
              >
                Semaine suiv. →
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekCells.map((c) => {
                const cellShifts = byISO.get(c.iso) ?? [];
                const selected = c.iso === selectedISO;
                return (
                  <button
                    key={c.iso}
                    type="button"
                    onClick={() => setSelectedISO(c.iso)}
                    className={`min-h-[110px] rounded-xl border p-1.5 text-left align-top transition sm:min-h-[150px] sm:p-2 ${
                      selected
                        ? "border-accent bg-accent/10 ring-2 ring-accent/40"
                        : "border-border bg-card hover:border-border dark:bg-zinc-950 dark:border-white/10"
                    } ${c.inMonth ? "" : "opacity-55"}`}
                  >
                    <span className="block text-[10.5px] font-medium text-muted-foreground">{WEEKDAYS[(new Date(`${c.iso}T12:00:00Z`).getUTCDay() + 6) % 7]}</span>
                    <span className="tnum text-[13px] font-bold text-card-foreground">{c.day}</span>
                    <span className="block">
                      {cellShifts.slice(0, 3).map((s) => (
                        <Badge key={s.id} s={s} />
                      ))}
                      {cellShifts.length > 3 && (
                        <span className="mt-1 block text-[10px] font-semibold text-accent">+{cellShifts.length - 3}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view === "jour" && (
          <>
            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-[12.5px] font-semibold text-card-foreground dark:text-zinc-300">
                {fmtLong(selectedISO)}
              </h2>
              <Link
                href="/shifts/new"
                className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-accent/90"
              >
                + Ajouter
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {dayShifts.length > 0 ? (
                dayShifts.map((s) => (
                  <div key={s.id} className="flex items-start gap-3 rounded-xl bg-accent/10 p-3 transition hover:bg-accent/15">
                    <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                    <div className="min-w-0 flex-1">
                      <span className="tnum block text-[12px] font-bold text-card-foreground">
                        {fmtHM(s.startTime)} → {fmtHM(s.endTime)}
                      </span>
                      <span className="block text-[11px] text-muted-foreground tnum">
                        {hoursLabel(s.totalHours)} · {eur.format(s.estimatedPay)} brut{s.endDate.slice(0, 10) !== s.startDate.slice(0, 10) ? " (+1j)" : ""}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-sm text-muted-foreground">Aucune vacation ce jour.</p>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}
