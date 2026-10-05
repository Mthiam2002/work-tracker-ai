"use client";

import { useState } from "react";

type Tab = "mois" | "semaine" | "jour";

const WD = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function MiniMonthCal({
  year,
  month,
  monthLabel,
  daysWith,
}: {
  year: number;
  month: number;
  monthLabel: string;
  daysWith: number[];
}) {
  const [tab, setTab] = useState<Tab>("mois");
  const today = new Date();
  const inMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const [sel, setSel] = useState<number>(inMonth ? today.getDate() : (daysWith[0] ?? 1));

  const marked = new Set(daysWith);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (number | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const monday = (() => {
    const d = new Date(Date.UTC(year, month - 1, Math.min(sel, daysInMonth)));
    const dow = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - dow);
    return d;
  })();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    return { day: d.getUTCDate(), inMonth: d.getUTCMonth() + 1 === month };
  });

  const dayCls = (day: number | null, inM = true) => {
    if (day === null) return "text-transparent";
    const isMarked = inM && marked.has(day);
    const isSel = inM && day === sel;
    if (isMarked) return "bg-[#1d6ff2] font-bold text-white";
    if (isSel) return "ring-1 ring-[#1d6ff2] font-bold text-white";
    return inM ? "text-white/70 hover:bg-white/10" : "text-white/25";
  };

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-white">📅 Calendrier</span>
        <span className="flex gap-0.5 rounded-full bg-white/5 p-0.5">
          {(["mois", "semaine", "jour"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold capitalize transition ${
                tab === t ? "bg-[#1d6ff2] text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {t === "mois" ? "Mois" : t === "semaine" ? "Semaine" : "Jour"}
            </button>
          ))}
        </span>
      </div>

      <p className="mt-2 flex items-center justify-between text-[11px] font-semibold text-white/60">
        <span>‹</span> {monthLabel} <span>›</span>
      </p>

      {tab === "mois" && (
        <div className="mt-1.5 grid grid-cols-7 gap-0.5 text-center">
          {WD.map((d) => (
            <span key={d} className="py-0.5 text-[8.5px] text-white/35">
              {d}
            </span>
          ))}
          {cells.map((c, i) => (
            <button
              key={i}
              type="button"
              disabled={c === null}
              onClick={() => c !== null && setSel(c)}
              className={`rounded-md py-1 text-[10px] transition ${dayCls(c)}`}
            >
              {c ?? "·"}
            </button>
          ))}
        </div>
      )}

      {tab === "semaine" && (
        <div className="mt-1.5 grid grid-cols-7 gap-0.5 text-center">
          {week.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => c.inMonth && setSel(c.day)}
              className={`flex flex-col items-center rounded-md py-1 transition ${dayCls(c.day, c.inMonth)}`}
            >
              <span className="text-[8px] text-white/40">{WD[i]}</span>
              <span className="text-[10px]">{c.day}</span>
            </button>
          ))}
        </div>
      )}

      {tab === "jour" && (
        <div className="mt-1.5 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2.5">
          <button type="button" onClick={() => setSel((s) => Math.max(1, s - 1))} className="text-white/50 hover:text-white">
            ‹
          </button>
          <span className="text-center">
            <span className="block text-[20px] font-extrabold leading-none text-white">{pad(Math.min(sel, daysInMonth))}</span>
            <span className="mt-0.5 block text-[10px] text-white/50">
              {marked.has(sel) ? "1+ vacation ce jour" : "Aucune vacation"}
            </span>
          </span>
          <button type="button" onClick={() => setSel((s) => Math.min(daysInMonth, s + 1))} className="text-white/50 hover:text-white">
            ›
          </button>
        </div>
      )}
    </div>
  );
}
