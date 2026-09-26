"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getShiftsPage, type ShiftsPage } from "@/app/(protected)/dashboard/dashboard-queries";
import { DeleteShiftButton } from "@/components/DeleteShiftButton";
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

  return (
    <div>
      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher : 12/09/2026, septembre, 08:00..."
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-400 dark:focus:bg-white/10"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          Chercher
        </button>
        {q && (
          <button
            type="button"
            onClick={() => { setQ(""); fetchPage("", 1); }}
            className="shrink-0 rounded-full border border-zinc-200 px-4 py-2.5 text-sm transition hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
          >
            ✕
          </button>
        )}
      </form>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        {data.total} vacation{data.total > 1 ? "s" : ""} · page {data.page}/{data.pages}
      </p>

      {data.items.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
          {q ? "Aucun résultat pour cette recherche." : "Aucune vacation pour le moment."}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-zinc-100 dark:divide-white/10">
          {data.items.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold capitalize">{fmtDate(s.startDate)}</p>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {fmtTime(s.startTime)} → {fmtTime(s.endTime)}
                  {s.endDate.slice(0, 10) !== s.startDate.slice(0, 10) ? " (+1j)" : ""} · pause {s.breakMinutes} min · {hoursLabel(s.totalHours)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {eur.format(s.estimatedPay)} brut
                  <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400">≈ {eur.format(brutToNet(s.estimatedPay, netRatio))} net</span>
                </span>
                <Link
                  href={`/shifts/${s.id}/edit`}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                >
                  Modifier
                </Link>
                <DeleteShiftButton id={s.id} onDeleted={handleDeleted} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={isPending || data.page <= 1}
            onClick={() => fetchPage(q, data.page - 1)}
            className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-medium transition hover:bg-zinc-100 disabled:opacity-40 dark:border-white/15 dark:hover:bg-white/10"
          >
            ← Précédent
          </button>
          <span className="text-xs text-zinc-500">{isPending ? "Chargement..." : `Page ${data.page} / ${data.pages}`}</span>
          <button
            type="button"
            disabled={isPending || data.page >= data.pages}
            onClick={() => fetchPage(q, data.page + 1)}
            className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-medium transition hover:bg-zinc-100 disabled:opacity-40 dark:border-white/15 dark:hover:bg-white/10"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
