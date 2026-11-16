"use client";

import { updateNetRatio } from "@/app/(protected)/settings/settings-actions";
import { useState, useTransition } from "react";

const inputClass =
  "w-full rounded-2xl border border-border bg-card px-4 py-3 text-[15px] text-card-foreground outline-none transition focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/20";

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
    <form onSubmit={handleSubmit} className="space-y-4 motion-safe:animate-[card-in_450ms_ease-out_both]">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-card-foreground">Part nette conservée (%)</label>
        <div className="relative max-w-xs">
          <input value={pct} onChange={(e) => setPct(e.target.value)} inputMode="decimal" placeholder="77,0" className={`${inputClass} pr-12`} />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">%</span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Non-cadre privé ≈ 77 %. Cadre ≈ 75 %. Ex : 12,96 € brut → {(12.96 * (parseFloat(pct.replace(",", ".")) / 100) || 0).toFixed(2).replace(".", ",")} € net.
        </p>
      </div>
      <button type="submit" disabled={isPending} className="flex h-11 items-center justify-center rounded-full bg-accent px-7 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
      {message && (
        <p className={`rounded-2xl px-4 py-3 text-sm ${isError ? "bg-loss/12 text-loss dark:bg-loss/20 dark:text-loss" : "bg-profit/12 text-profit dark:bg-profit/20 dark:text-profit"}`}>{message}</p>
      )}
    </form>
  );
}
