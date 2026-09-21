"use client";

import { updatePremiums } from "@/app/(protected)/settings/settings-actions";
import { useState, useTransition } from "react";

const inputClass =
  "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[15px] text-zinc-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10";

export function PremiumsForm({ initial }: { initial: { nightMult: number; sundayMult: number; holidayMult: number; nightStart: number; nightEnd: number } }) {
  const [nightMult, setNightMult] = useState(String(initial.nightMult * 100));
  const [sundayMult, setSundayMult] = useState(String(initial.sundayMult * 100));
  const [holidayMult, setHolidayMult] = useState(String(initial.holidayMult * 100));
  const [nightStart, setNightStart] = useState(String(initial.nightStart));
  const [nightEnd, setNightEnd] = useState(String(initial.nightEnd));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    const parsePct = (v: string) => parseFloat(v.replace(",", ".")) / 100;
    const payload = {
      nightMult: parsePct(nightMult),
      sundayMult: parsePct(sundayMult),
      holidayMult: parsePct(holidayMult),
      nightStart: parseInt(nightStart, 10),
      nightEnd: parseInt(nightEnd, 10),
    };
    startTransition(async () => {
      try {
        await updatePremiums(payload);
        setIsError(false);
        setMessage("Majorations enregistrées. Les prochaines vacations les utiliseront.");
      } catch (err) {
        setIsError(true);
        setMessage(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nuit (%)</label>
          <input value={nightMult} onChange={(e) => setNightMult(e.target.value)} inputMode="decimal" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Dimanche (%)</label>
          <input value={sundayMult} onChange={(e) => setSundayMult(e.target.value)} inputMode="decimal" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Férié (%)</label>
          <input value={holidayMult} onChange={(e) => setHolidayMult(e.target.value)} inputMode="decimal" className={inputClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nuit de (h)</label>
          <input type="number" min="0" max="23" value={nightStart} onChange={(e) => setNightStart(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nuit à (h)</label>
          <input type="number" min="0" max="23" value={nightEnd} onChange={(e) => setNightEnd(e.target.value)} className={inputClass} />
        </div>
      </div>
      <p className="text-xs text-zinc-500">Cumulables : une heure nuit + dimanche cumule les deux. Défaut : 20% nuit, 20% dimanche, 100% férié, nuit 21h-6h.</p>
      <button type="submit" disabled={isPending} className="flex h-11 items-center justify-center rounded-full bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black">
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
      {message && (
        <p className={`rounded-2xl px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"}`}>{message}</p>
      )}
    </form>
  );
}
