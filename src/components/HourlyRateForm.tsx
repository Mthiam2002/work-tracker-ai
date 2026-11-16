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
    <form onSubmit={handleSubmit} className="space-y-4 motion-safe:animate-[card-in_450ms_ease-out_both]">
      <div>
        <label
          htmlFor="hourlyRate"
          className="mb-1.5 block text-sm font-medium text-card-foreground"
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
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 pr-12 text-[15px] font-medium text-card-foreground outline-none transition placeholder:font-normal placeholder:text-muted-foreground focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/20"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            €/h
          </span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Utilise une virgule ou un point. Ex : 12,33.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-11 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50 sm:w-auto sm:px-7"
      >
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>

      {message && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            isError ? "bg-loss/12 text-loss dark:bg-loss/20 dark:text-loss" : "bg-profit/12 text-profit dark:bg-profit/20 dark:text-profit"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
