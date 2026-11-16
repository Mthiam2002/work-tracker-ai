"use client";

import { updateReminderSettings } from "@/app/(protected)/settings/settings-actions";
import { useState, useTransition } from "react";

export function ReminderSettingsForm({ initial }: { initial: { enabled: boolean; threshold: number } }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [threshold, setThreshold] = useState(String(initial.threshold));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        await updateReminderSettings({ enabled, threshold: parseInt(threshold, 10) });
        setMessage("Préférences de rappel enregistrées.");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Erreur.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 motion-safe:animate-[card-in_450ms_ease-out_both]">
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-accent" />
        <span className="font-medium text-card-foreground">M&apos;envoyer un email si j&apos;oublie de pointer</span>
      </label>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-card-foreground">Seuil (jours sans vacation)</label>
        <input
          type="number"
          min="1"
          max="30"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-[15px] text-card-foreground outline-none transition focus:border-accent focus:bg-card"
        />
      </div>
      <button type="submit" disabled={isPending} className="flex h-11 items-center justify-center rounded-full bg-accent px-7 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
      {message && <p className="rounded-2xl px-4 py-3 text-sm bg-profit/12 text-profit dark:bg-profit/20 dark:text-profit">{message}</p>}
    </form>
  );
}
