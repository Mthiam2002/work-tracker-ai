"use client";

import { updateHourlyRate } from "@/app/(protected)/settings/settings-actions";
import { useState, useTransition } from "react";

export function HourlyRateForm({ initialRate }: { initialRate: number }) {
  const [rate, setRate] = useState(initialRate.toString().replace(".", ","));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    const parsed = parseFloat(rate.replace(",", "."));

    if (isNaN(parsed) || parsed <= 0) {
      setIsError(true);
      setMessage("Merci d'entrer un taux horaire valide.");
      return;
    }

    startTransition(async () => {
      try {
        await updateHourlyRate(parsed);
        setIsError(false);
        setMessage("Taux horaire mis à jour avec succès !");
      } catch (error) {
        console.error("Erreur mise à jour du taux horaire :", error);
        setIsError(true);
        setMessage("Une erreur est survenue lors de la mise à jour du taux horaire.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="hourlyRate"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Taux horaire (€/h)
        </label>
        <div className="relative">
          <input
            id="hourlyRate"
            type="text"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="12,33"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 pr-12 text-[15px] font-medium text-zinc-950 outline-none transition placeholder:font-normal placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400">
            €/h
          </span>
        </div>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
          Utilise une virgule ou un point. Ex : 12,33.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-11 w-full items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 sm:w-auto sm:px-7 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>

      {message && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            isError
              ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
