"use client";

import { updateNetRatio } from "@/app/(protected)/settings/settings-actions";
import { useState, useTransition } from "react";

const inputClass =
  "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[15px] text-zinc-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10";

export function NetRatioForm({ initialRatio }: { initialRatio: number }) {
  const [pct, setPct] = useState((initialRatio * 100).toFixed(1).replace(".", ","));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    const parsed = parseFloat(pct.replace(",", ".")) / 100;
    if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 0.95) {
      setIsError(true);
      setMessage("Merci d'entrer un pourcentage entre 50 et 95.");
      return;
    }
    startTransition(async () => {
      try {
        await updateNetRatio(parsed);
        setIsError(false);
        setMessage(`Ratio enregistré : net ≈ ${(parsed * 100).toFixed(1).replace(".", ",")} % du brut.`);
      } catch (err) {
        setIsError(true);
        setMessage(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Part nette conservée (%)</label>
        <div className="relative max-w-xs">
          <input value={pct} onChange={(e) => setPct(e.target.value)} inputMode="decimal" placeholder="77,0" className={`${inputClass} pr-12`} />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400">%</span>
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">Non-cadre privé ≈ 77 %. Cadre ≈ 75 %. Ex : 12,96 € brut → {(12.96 * (parseFloat(pct.replace(",", ".")) / 100) || 0).toFixed(2).replace(".", ",")} € net.</p>
      </div>
      <button type="submit" disabled={isPending} className="flex h-11 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black">
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
      {message && (
        <p className={`rounded-2xl px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"}`}>{message}</p>
      )}
    </form>
  );
}
