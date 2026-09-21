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
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-blue-600" />
        <span className="font-medium">M&apos;envoyer un email si j&apos;oublie de pointer</span>
      </label>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Seuil (jours sans vacation)</label>
        <input
          type="number"
          min="1"
          max="30"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[15px] outline-none focus:border-blue-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
      </div>
      <button type="submit" disabled={isPending} className="flex h-11 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black">
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
      {message && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">{message}</p>}
      <p className="text-xs text-zinc-500">Nécessite RESEND_API_KEY côté serveur. Envoi quotidien à 8h via cron Vercel.</p>
    </form>
  );
}
