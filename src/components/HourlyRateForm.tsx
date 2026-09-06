"use client";


import { updateHourlyRate } from "@/app/(protected)/settings/settings-actions";
import { useState, useTransition } from "react";

export function HourlyRateForm({ initialRate }: { initialRate: number }) {
    const [rate, setRate] = useState(initialRate.toString());
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      const parsed = parseFloat(rate.replace(",", "."));

      if (isNaN(parsed) || parsed <= 0) {
        setMessage("Merci d'entrer un taux horaire valide.");
        return;
      }

      startTransition(async () => {
        try {
          await updateHourlyRate(parsed);
          setMessage("Taux horaire mis à jour avec succès !");
        } catch (error) {
          console.error("Erreur mise à jour du taux horaire :", error);
          setMessage("Une erreur est survenue lors de la mise à jour du taux horaire.");
        }
      });
    }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label
          htmlFor="hourlyRate"
          className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
        >
          Taux horaire (€/h)
        </label>
        <input 
          id="hourlyRate"
          type="text"
          inputMode="decimal"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>

      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </form>
  )
}
