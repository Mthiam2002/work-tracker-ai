"use client";

import { updatePremiums } from "@/app/(protected)/settings/settings-actions";
import { useState, useTransition } from "react";

const inputClass =
  "w-full rounded-2xl border border-border bg-card px-4 py-3 text-[15px] text-card-foreground outline-none transition focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/20";

export function PremiumsForm({ initial }: { initial: { nightMult: number; sundayMult: number; holidayMult: number; nightStart: number; nightEnd: number; overtimeMult: number } }) {
  const [nightMult, setNightMult] = useState(String(initial.nightMult * 100));
  const [sundayMult, setSundayMult] = useState(String(initial.sundayMult * 100));
  const [holidayMult, setHolidayMult] = useState(String(initial.holidayMult * 100));
  const [overtimeMult, setOvertimeMult] = useState(String(initial.overtimeMult * 100));
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
      overtimeMult: parsePct(overtimeMult),
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
    <form onSubmit={handleSubmit} className="space-y-4 motion-safe:animate-[card-in_450ms_ease-out_both]">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">Nuit (%)</label>
          <input value={nightMult} onChange={(e) => setNightMult(e.target.value)} inputMode="decimal" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">Dimanche (%)</label>
          <input value={sundayMult} onChange={(e) => setSundayMult(e.target.value)} inputMode="decimal" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">Férié (%)</label>
          <input value={holidayMult} onChange={(e) => setHolidayMult(e.target.value)} inputMode="decimal" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">Heures suppl. (%)</label>
          <input value={overtimeMult} onChange={(e) => setOvertimeMult(e.target.value)} inputMode="decimal" className={inputClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">Nuit de (h)</label>
          <input type="number" min="0" max="23" value={nightStart} onChange={(e) => setNightStart(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-card-foreground">Nuit à (h)</label>
          <input type="number" min="0" max="23" value={nightEnd} onChange={(e) => setNightEnd(e.target.value)} className={inputClass} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Cumulables : une heure nuit + dimanche cumule les deux. HS : heures supplémentaires retenues sur une vacation (dernières heures). Défaut : 10% nuit, 10% dimanche, 100% férié, 25% HS, nuit 21h-6h.</p>
      <button type="submit" disabled={isPending} className="flex h-11 items-center justify-center rounded-full bg-accent px-7 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
      {message && (
        <p className={`rounded-2xl px-4 py-3 text-sm ${isError ? "bg-loss/12 text-loss dark:bg-loss/20 dark:text-loss" : "bg-profit/12 text-profit dark:bg-profit/20 dark:text-profit"}`}>{message}</p>
      )}
    </form>
  );
}
