"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DeleteShiftButton } from "@/components/DeleteShiftButton";
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
      className="mt-1 flex items-center gap-1 truncate rounded-md bg-[#1d6ff2] px-1.5 py-1 text-[9.5px] font-semibold leading-tight text-white sm:text-[10.5px]"
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
  const [items, setItems] = useState<CalShift[]>(shifts);
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
  const inCurrentMonth = selectedISO.slice(0, 7) === monthPrefix;

  const totalHours = items.reduce((a, s) => a + s.totalHours, 0);
  const totalPay = items.reduce((a, s) => a + s.estimatedPay, 0);

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <>
      {/* Carte grille + toolbar */}
      <section className="rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgba(16,42,80,0.08)] sm:p-5 dark:bg-zinc-950 dark:border dark:border-white/10 dark:shadow-none">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-1.5">
            <Link
              href={prevHref}
              aria-label="Mois précédent"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f5fb] text-[16px] font-bold text-[#3d4e68] transition hover:bg-[#e3edfb] dark:bg-white/10 dark:text-zinc-200"
            >
              ‹
            </Link>
            <span className="flex items-center gap-2 rounded-full bg-[#f1f5fb] px-4 py-2 text-[13px] font-bold text-[#16233a] dark:bg-white/10 dark:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                <path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
              </svg>
              {monthLabel}
            </span>
            <Link
              href={nextHref}
              aria-label="Mois suivant"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f5fb] text-[16px] font-bold text-[#3d4e68] transition hover:bg-[#e3edfb] dark:bg-white/10 dark:text-zinc-200"
            >
              ›
            </Link>
          </span>

          <span className="mx-auto flex gap-1 rounded-full bg-[#eef3f9] p-1 dark:bg-white/10">
            {(["mois", "semaine", "jour"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold capitalize transition ${
                  view === v ? "bg-[#1d6ff2] text-white shadow-sm" : "text-[#7b8aa0] hover:text-[#1e2a3b]"
                }`}
              >
                {v === "mois" ? "Mois" : v === "semaine" ? "Semaine" : "Jour"}
              </button>
            ))}
          </span>

          <Link
            href="/shifts/new"
            className="rounded-full bg-[#1d6ff2] px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-[#1859c4]"
          >
            + Ajouter une vacation
          </Link>
        </div>

        {view === "mois" && (
          <>
            <div className="mt-4 grid grid-cols-7 gap-1.5 text-center sm:gap-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1.5 text-[11.5px] font-medium text-[#8a97ad]">
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
                        ? "border-transparent bg-[#f7f9fc] text-[#b3bdcf] dark:bg-white/[0.02]"
                        : selected
                          ? "border-[#1d6ff2] bg-[#f2f7ff] ring-2 ring-[#1d6ff2]/40"
                          : cellShifts.length > 0
                            ? "border-[#bfd6f8] bg-white hover:border-[#1d6ff2]/60"
                            : "border-[#eef2f7] bg-white hover:border-[#c7d6ec] dark:bg-zinc-950 dark:border-white/10"
                    }`}
                  >
                    <span className={`text-[11px] font-semibold sm:text-[12.5px] ${c.inMonth ? "text-[#16233a] dark:text-white" : ""}`}>
                      {c.day}
                    </span>
                    {c.inMonth && (
                      <span className="block">
                        {cellShifts.slice(0, 2).map((s) => (
                          <Badge key={s.id} s={s} />
                        ))}
                        {cellShifts.length > 2 && (
                          <span className="mt-1 block text-[10px] font-semibold text-[#1d6ff2]">+{cellShifts.length - 2}</span>
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
                className="rounded-full bg-[#f1f5fb] px-3.5 py-1.5 text-[12px] font-semibold text-[#3d4e68] hover:bg-[#e3edfb]"
              >
                ← Semaine préc.
              </button>
              <p className="text-[12.5px] font-semibold text-[#3d4e68] dark:text-zinc-300">
                Sem. du {fmtLong(weekCells[0].iso)} au {fmtLong(weekCells[6].iso)}
              </p>
              <button
                type="button"
                onClick={() => setSelectedISO(addDaysISO(selectedISO, 7))}
                className="rounded-full bg-[#f1f5fb] px-3.5 py-1.5 text-[12px] font-semibold text-[#3d4e68] hover:bg-[#e3edfb]"
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
                        ? "border-[#1d6ff2] bg-[#f2f7ff] ring-2 ring-[#1d6ff2]/40"
                        : "border-[#eef2f7] bg-white hover:border-[#c7d6ec] dark:bg-zinc-950 dark:border-white/10"
                    } ${c.inMonth ? "" : "opacity-55"}`}
                  >
                    <span className="block text-[10.5px] font-medium text-[#8a97ad]">{WEEKDAYS[(new Date(`${c.iso}T12:00:00Z`).getUTCDay() + 6) % 7]}</span>
                    <span className="text-[13px] font-bold text-[#16233a] dark:text-white">{c.day}</span>
                    <span className="block">
                      {cellShifts.slice(0, 3).map((s) => (
                        <Badge key={s.id} s={s} />
                      ))}
                      {cellShifts.length > 3 && (
                        <span className="mt-1 block text-[10px] font-semibold text-[#1d6ff2]">+{cellShifts.length - 3}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view === "jour" && (
          <div className="mt-4 rounded-xl border border-[#eef2f7] p-4 dark:border-white/10">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedISO(addDaysISO(selectedISO, -1))}
                className="rounded-full bg-[#f1f5fb] px-3.5 py-1.5 text-[12px] font-semibold text-[#3d4e68] hover:bg-[#e3edfb]"
              >
                ← Jour préc.
              </button>
              <p className="text-[14px] font-bold capitalize text-[#16233a] dark:text-white">
                {fmtLong(selectedISO)}
                {!inCurrentMonth && <span className="ml-2 text-[11px] font-medium text-[#8a97ad]">(hors mois chargé)</span>}
              </p>
              <button
                type="button"
                onClick={() => setSelectedISO(addDaysISO(selectedISO, 1))}
                className="rounded-full bg-[#f1f5fb] px-3.5 py-1.5 text-[12px] font-semibold text-[#3d4e68] hover:bg-[#e3edfb]"
              >
                Jour suiv. →
              </button>
            </div>
            {dayShifts.length === 0 ? (
              <p className="mt-3 rounded-xl bg-[#f3f6fb] p-5 text-center text-[13px] text-[#8a97ad] dark:bg-white/5">
                Aucune vacation ce jour-là.{" "}
                <Link href="/shifts/new" className="font-semibold text-[#1d6ff2]">
                  En pointer une →
                </Link>
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {dayShifts.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#f2f7ff] px-4 py-3 dark:bg-white/5">
                    <span className="text-[13px] font-semibold text-[#16233a] dark:text-white">
                      {fmtHM(s.startTime)} → {fmtHM(s.endTime)}
                      {s.endDate.slice(0, 10) !== s.startDate.slice(0, 10) ? " (+1j)" : ""} · pause {s.breakMinutes} min
                    </span>
                    <span className="ml-auto text-[13px] font-bold text-[#1d6ff2]">
                      {hoursLabel(s.totalHours)} · {eur.format(s.estimatedPay)}
                    </span>
                    <Link
                      href={`/shifts/${s.id}/edit`}
                      className="rounded-full bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#1d5dbf] shadow-sm hover:bg-[#e3edfb]"
                    >
                      Modifier
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Détail du mois (sombre) */}
      <section
        id="detail-mois"
        className="mt-4 rounded-2xl bg-gradient-to-b from-[#101f3a] to-[#0a1730] p-5 text-white shadow-[0_1px_2px_rgba(16,42,80,0.2)] sm:p-6"
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-[#6ea8ff]">
            <rect x="3" y="4" width="18" height="16" rx="2.5" />
            <path d="M3 9h18M8 2v4M16 2v4M7 14h4M7 17.5h7" strokeLinecap="round" />
          </svg>
          <h2 className="text-[14px] font-bold">Détail du mois</h2>
          <Link href="/dashboard" className="ml-auto text-[12px] font-semibold text-[#6ea8ff]">
            → Voir tous les détails
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="mt-4 rounded-xl bg-white/5 p-6 text-center text-[13px] text-white/70">
            Aucune vacation ce mois-ci.{" "}
            <Link href="/shifts/new" className="font-semibold text-[#6ea8ff]">
              En pointer une →
            </Link>
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-medium text-white/50">
                  <th className="py-2.5 pr-2 font-medium">Date</th>
                  <th className="px-2 py-2.5 font-medium">· Horaires</th>
                  <th className="px-2 py-2.5 font-medium">· Durée</th>
                  <th className="px-2 py-2.5 font-medium">· Montant brut</th>
                  <th className="py-2.5 pl-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 pr-2">
                      <span className="flex items-center gap-2 text-[12.5px] font-medium">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#2f8bff]" />
                        {fmtLong(s.startDate.slice(0, 10))}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-[12px] text-white/70">
                      {fmtHM(s.startTime)} → {fmtHM(s.endTime)}
                    </td>
                    <td className="px-2 py-3 text-[12.5px]">{hoursLabel(s.totalHours)}</td>
                    <td className="px-2 py-3 text-[12.5px] font-bold">{eur.format(s.estimatedPay)}</td>
                    <td className="py-3 pl-2">
                      <span className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/shifts/${s.id}/edit`}
                          className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#6ea8ff] transition hover:bg-white/10"
                        >
                          Modifier
                        </Link>
                        <span className="rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold text-[#ff7a7a] [&_button]:!bg-transparent [&_button]:!p-0 [&_button]:!text-[11px] [&_button]:!font-semibold [&_button]:!text-[#ff7a7a] [&_span]:!gap-0">
                          <DeleteShiftButton id={s.id} onDeleted={handleDeleted} />
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-[12px] text-white/60">
            {items.length} vacation{items.length > 1 ? "s" : ""} · {hoursLabel(totalHours)} · {eur.format(totalPay)} brut (≈{" "}
            {eur.format(brutToNet(totalPay, netRatio))} net)
          </p>
          <a
            href={`/api/exports/pdf?year=${year}&month=${month}`}
            className="ml-auto flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12px] font-semibold transition hover:bg-white/15"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
              <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 17v3.5h16V17" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Exporter le mois
          </a>
        </div>
      </section>
    </>
  );
}
