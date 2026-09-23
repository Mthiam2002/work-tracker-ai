"use client";

import { useState, useTransition } from "react";

export function BackupRestoreForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    if (!file) {
      setIsError(true);
      setMessage("Choisis un fichier work-tracker-backup.json.");
      return;
    }
    startTransition(async () => {
      try {
        const body = JSON.parse(await file.text());
        const res = await fetch("/api/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Échec de la restauration.");
        setIsError(false);
        setMessage(
          `Restauration OK : ${data.shifts} vacation(s), ${data.rates} taux, ${data.payslips} bulletin(s) ajoutés, ${data.skipped} doublon(s) ignoré(s). Recharge la page pour voir.`
        );
      } catch (err) {
        setIsError(true);
        setMessage(err instanceof Error ? err.message : "Échec de la restauration.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <input
        type="file"
        accept="application/json,.json"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:file:bg-white dark:file:text-black"
      />
      <button
        type="submit"
        disabled={isPending || !file}
        className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium transition hover:bg-zinc-100 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
      >
        {isPending ? "Restauration..." : "Restaurer"}
      </button>
      {message && (
        <p className={`rounded-2xl px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
