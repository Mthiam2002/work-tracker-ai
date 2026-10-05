"use client";

import { useState } from "react";
import type { MonthPoint } from "@/app/(protected)/dashboard/dashboard-queries";
import { brutToNet } from "@/lib/salary";

const eur0 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

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
  const topLabel = (p: MonthPoint) => {
    if (p.count === 0) return "0 €";
    if (mode === "heures") return hoursLabel(p.hours);
    return `${eur0.format(value(p))} €`.replace("€€", "€");
  };

  const ticks = [2000, 1500, 1500, 1000, 500];

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:border dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1d6ff2] text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 2a10 10 0 1 0 10 10c0-.34-.02-.67-.05-1L14 19l-2-6-6-2 8-7c-.33-.03-.66-.05-1-.05z" opacity=".9" />
              <circle cx="18.5" cy="5.5" r="1.6" fill="white" />
            </svg>
          </span>
          <span>
            <span className="block text-[15px] font-bold text-[#16233a]">Évolution des revenus</span>
            <span className="block text-[12px] text-[#8a97ad]">
              {mode === "heures" ? "Heures pointées / mois" : mode === "net" ? "Salaire net estimé / mois" : "Salaire brut estimé / mois"}
            </span>
          </span>
        </div>
        <div className="flex gap-1 rounded-full bg-[#eef3f9] p-1">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              aria-pressed={mode === m.key}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
                mode === m.key ? "bg-[#1d6ff2] text-white shadow-sm" : "text-[#7b8aa0] hover:text-[#1e2a3b]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {points.every((p) => p.count === 0) ? (
        <p className="mt-4 text-sm text-[#8a97ad]">Pas encore de données. Pointe des vacations pour voir ta courbe ici.</p>
      ) : (
        <div className="mt-5 flex gap-2">
          <div className="flex w-11 flex-col justify-between pb-6.5 pt-4.5 text-right text-[10.5px] leading-none text-[#8a97ad]">
            {ticks.map((t, i) => (
              <span key={i}>{t.toLocaleString("fr-FR")} €</span>
            ))}
            <span>0 €</span>
          </div>
          <div className="grid flex-1 grid-cols-6 items-end gap-2 sm:gap-3" role="img" aria-label={`Évolution ${mode} par mois`}>
            {points.map((p, i) => {
              const v = value(p);
              const height = p.count === 0 ? 3 : Math.max(10, Math.round((v / max) * 148));
              const isSept = i === points.length - 2;
              const isCurrent = i === points.length - 1;
              return (
                <div
                  key={p.key}
                  className="flex min-w-0 flex-col items-center gap-1.5"
                  title={`${p.label} : ${hoursLabel(p.hours)} · ${eur2.format(p.pay)} brut`}
                >
                  <span className="h-4 text-[10.5px] font-bold text-[#3d4e68]">{p.count > 0 ? topLabel(p) : "0 €"}</span>
                  <div className="flex h-37.5 w-full items-end rounded-md bg-[#f3f6fb]">
                    <div
                      style={{ height: `${height}px` }}
                      className={`w-full rounded-md ${p.count === 0 ? "bg-[#1d6ff2]/25" : isCurrent ? "bg-[#1d6ff2]" : isSept ? "bg-[#a9c6f5]" : "bg-[#1d6ff2]/30"}`}
                    />
                  </div>
                  <span className={`text-[11px] capitalize ${isCurrent || isSept ? "font-semibold text-[#1e2a3b]" : "text-[#8a97ad]"}`}>
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
