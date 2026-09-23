"use client";

import { useState } from "react";
import type { MonthPoint } from "@/app/(protected)/dashboard/dashboard-queries";
import { brutToNet } from "@/lib/salary";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

type Mode = "brut" | "net" | "heures";

const modes: { key: Mode; label: string }[] = [
  { key: "brut", label: "Brut" },
  { key: "net", label: "Net" },
  { key: "heures", label: "Heures" },
];

function hoursLabel(h: number) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
}

export function MonthlyChart({ points, netRatio }: { points: MonthPoint[]; netRatio: number }) {
  const [mode, setMode] = useState<Mode>("brut");

  const value = (p: MonthPoint) => (mode === "heures" ? p.hours : mode === "net" ? brutToNet(p.pay, netRatio) : p.pay);
  const max = Math.max(1, ...points.map(value));
  const formatValue = (p: MonthPoint) => (mode === "heures" ? hoursLabel(p.hours) : eur.format(value(p)));

  return (
    <section className="mt-4 rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">Évolution — 6 derniers mois</h2>
        <div className="flex gap-1 rounded-full bg-zinc-100 p-1 dark:bg-white/10">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              aria-pressed={mode === m.key}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                mode === m.key
                  ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {mode === "heures" ? "Heures pointées / mois" : mode === "net" ? `Net estimé / mois (≈ ${(netRatio * 100).toFixed(1).replace(".", ",")} % du brut)` : "Salaire brut estimé / mois"}
      </p>
      {points.every((p) => p.count === 0) ? (
        <p className="mt-4 text-sm text-zinc-500">
          Pas encore de données. Pointe des vacations pour voir ta courbe ici.
        </p>
      ) : (
        <div className="mt-6 flex items-end gap-2 sm:gap-3" role="img" aria-label={`Évolution ${mode} par mois`}>
          {points.map((p, i) => {
            const v = value(p);
            const height = v > 0 ? Math.max(6, Math.round((v / max) * 160)) : 4;
            const isCurrent = i === points.length - 1;
            return (
              <div key={p.key} className="flex flex-1 flex-col items-center gap-2" title={`${p.label} : ${hoursLabel(p.hours)} · ${eur.format(p.pay)} brut (≈ ${eur.format(brutToNet(p.pay, netRatio))} net)`}>
                <span className="text-[11px] font-medium text-zinc-500 sm:text-xs">
                  {p.count > 0 ? formatValue(p) : "—"}
                </span>
                <div
                  style={{ height }}
                  className={`w-full rounded-t-xl transition ${
                    isCurrent ? "bg-blue-600" : "bg-blue-600/35"
                  }`}
                />
                <span className={`text-[11px] capitalize sm:text-xs ${isCurrent ? "font-semibold" : "text-zinc-500"}`}>
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
