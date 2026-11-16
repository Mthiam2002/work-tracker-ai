"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getShiftsPage, type ShiftsPage } from "@/app/(protected)/dashboard/dashboard-queries";
import { DeleteShiftButton } from "@/components/DeleteShiftButton";
import { brutToNet } from "@/lib/salary";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

const DOT_COLORS = ["var(--accent)", "var(--accent)", "var(--profit)", "var(--loss)", "var(--premium)"];

function hoursLabel(h: number) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));
}

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(iso));
}

export function ShiftsExplorer({ initial, netRatio, pageSize = 5 }: { initial: ShiftsPage; netRatio: number; pageSize?: number }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState<ShiftsPage>(initial);
  const [isPending, startTransition] = useTransition();

  function fetchPage(nextQ: string, nextPage: number) {
    startTransition(async () => {
      setData(await getShiftsPage({ q: nextQ, page: nextPage, pageSize }));
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchPage(q, 1);
  }

  function handleDeleted(id: string) {
    const items = data.items.filter((s) => s.id !== id);
    const total = Math.max(0, data.total - 1);
    if (items.length === 0 && data.page > 1) {
      fetchPage(q, data.page - 1);
      return;
    }
    setData({ ...data, items, total, pages: Math.max(1, Math.ceil(total / pageSize)) });
  }

  void brutToNet;
  void netRatio;

  return (
    <div>
      <form onSubmit={handleSearch} className="relative mt-4 max-w-[460px]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            fetchPage(e.target.value, 1);
          }}
          placeholder="Rechercher une vacation, une date..."
          className="h-10 w-full rounded-full border border-border bg-background pl-10 pr-4 text-[13px] text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent/50 focus:ring-2 focus:ring-accent/25"
        />
      </form>

      <p className="tnum mt-3 text-[11.5px] text-muted-foreground">
        {data.total} vacations · page {data.page}/{data.pages}
      </p>

      {data.items.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">
          {q ? "Aucun résultat pour cette recherche." : "Aucune vacation pour le moment."}
        </p>
      ) : (
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium text-muted-foreground">
                <th className="py-2.5 pr-2 font-medium">Date</th>
                <th className="px-2 py-2.5 font-medium">Horaires</th>
                <th className="px-2 py-2.5 font-medium">Durée</th>
                <th className="px-2 py-2.5 font-medium">Montant brut *</th>
                <th className="py-2.5 pl-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((s, idx) => (
                <tr key={s.id} className="border-b border-border/70 transition hover:bg-muted/50 last:border-0">
                  <td className="py-3 pr-2">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-card-foreground">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: DOT_COLORS[idx % DOT_COLORS.length] }} />
                      {fmtDate(s.startDate)}
                    </span>
                  </td>
                  <td className="tnum px-2 py-3 text-[12px] text-muted-foreground">
                    {fmtTime(s.startTime)} → {fmtTime(s.endTime)}
                    {s.endDate.slice(0, 10) !== s.startDate.slice(0, 10) ? " (+1j)" : ""} · pause {s.breakMinutes} min
                  </td>
                  <td className="tnum px-2 py-3 text-[13px] font-medium text-card-foreground">{hoursLabel(s.totalHours)}</td>
                  <td className="tnum px-2 py-3 text-[13px] font-bold text-card-foreground">{eur.format(s.estimatedPay)}</td>
                  <td className="py-3 pl-2">
                    <span className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/shifts/${s.id}/edit`}
                        className="rounded-full bg-accent/12 px-3 py-1 text-[11px] font-semibold text-accent transition hover:bg-accent/20"
                      >
                        Modifier
                      </Link>
                      <span className="rounded-full bg-loss/12 px-3 py-1 text-[11px] font-semibold text-loss [&_button]:!bg-transparent [&_button]:!p-0 [&_button]:!text-[11px] [&_button]:!font-semibold [&_button]:!text-loss [&_span]:!gap-0">
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

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          disabled={isPending || data.page <= 1}
          onClick={() => fetchPage(q, data.page - 1)}
          className="rounded-full border border-border px-4 py-2 text-[12px] font-medium text-card-foreground transition hover:bg-muted disabled:opacity-40"
        >
          ← Précédent
        </button>
        <span className="tnum text-[12px] text-muted-foreground">{isPending ? "Chargement..." : `Page ${data.page} / ${data.pages}`}</span>
        <button
          type="button"
          disabled={isPending || data.page >= data.pages}
          onClick={() => fetchPage(q, data.page + 1)}
          className="rounded-full border border-border px-4 py-2 text-[12px] font-medium text-card-foreground transition hover:bg-muted disabled:opacity-40"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
