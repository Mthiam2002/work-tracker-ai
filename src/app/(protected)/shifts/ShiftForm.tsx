"use client";

import { useMemo, useState, useTransition } from "react"
import { createWorkShift } from "./shifts-actions";

const inputClass =
  "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[15px] text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10 dark:[color-scheme:dark]";

function minutesToLabel(total: number | null) {
  if (total === null || isNaN(total) || total <= 0) return null;
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export function ShiftForm() {
  const today = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("20:00");
  const [endsNextDay, setEndsNextDay] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState("20");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const preview = useMemo(() => {
    if (!date || !startTime || !endTime) return null;
    const start = new Date(`${date}T${startTime}:00`);
    const endBase = new Date(`${date}T00:00:00`);
    if (endsNextDay) endBase.setDate(endBase.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const endStr = `${endBase.getFullYear()}-${pad(endBase.getMonth() + 1)}-${pad(endBase.getDate())}`;
    const end = new Date(`${endStr}T${endTime}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
    return (end.getTime() - start.getTime()) / 60000;
  }, [date, startTime, endTime, endsNextDay]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);

    const parsedBreak = parseInt(breakMinutes || "0", 10);
    if (isNaN(parsedBreak) || parsedBreak < 0) {
      setIsError(true);
      setMessage("La pause doit être un nombre positif ou nul.");
      return;
    }
    if (!date || !startTime || !endTime) {
      setIsError(true);
      setMessage("Merci de renseigner la date et les heures.");
      return;
    }

    startTransition(async () => {
      try {
        await createWorkShift({ date, startTime, endTime, endsNextDay, breakMinutes: parsedBreak });
        setIsError(false);
        setMessage(`Vacation créée : ${minutesToLabel(preview) ?? "durée calculée"} (pause incluse).`);
        setDate(today);
        setStartTime("08:00");
        setEndTime("20:00");
        setEndsNextDay(false);
        setBreakMinutes("0");
      } catch (error) {
        console.error("Erreur lors de la création de la vacation :", error);
        setIsError(true);
        setMessage(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la création de la vacation."
        );
      }
    });
  }

  const previewLabel = minutesToLabel(preview);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date de la vacation
            </label>
            <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="startTime" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Heure de début
            </label>
            <input type="time" id="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="endTime" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Heure de fin
            </label>
            <input type="time" id="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={inputClass} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEndsNextDay((v) => !v)}
          aria-pressed={endsNextDay}
          className={`mt-5 flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
            endsNextDay
              ? "border-blue-500/50 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10"
              : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          }`}
        >
          <span
            className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition ${
              endsNextDay ? "justify-end bg-blue-600" : "justify-start bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <span className="h-4 w-4 rounded-full bg-white" />
          </span>
          <span>
            <span className="block text-sm font-semibold">Vacation de nuit</span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">Se termine le lendemain (ex : 20h → 08h)</span>
          </span>
        </button>

        <div className="mt-5">
          <label htmlFor="breakMinutes" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Pause (en minutes, rémunérée, informative)
          </label>
          <input
            type="number"
            id="breakMinutes"
            value={breakMinutes}
            min="0"
            step="5"
            onChange={(e) => setBreakMinutes(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-blue-600 px-7 text-[15px] font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Création en cours..." : "Créer la vacation"}
        </button>

        {message && (
          <p
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
              isError
                ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            }`}
          >
            {message}
          </p>
        )}
      </form>

      <aside className="flex flex-col gap-4">
        <div className="rounded-3xl bg-zinc-950 p-6 text-white dark:border dark:border-white/10">
          <h2 className="text-sm font-semibold">Résumé</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-400">Date</dt>
              <dd className="font-medium">{date || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-400">Horaires</dt>
              <dd className="font-medium">{startTime || "—"} → {endTime || "—"}{endsNextDay ? " (+1j)" : ""}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-400">Pause</dt>
              <dd className="font-medium">{breakMinutes || "0"} min</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-zinc-400">Durée (pause incluse, rémunérée)</p>
            <p className="mt-1 text-xl font-semibold">{previewLabel ?? "—"}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 text-sm leading-6 text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          Exemple nuit : début 20:00, fin 08:00 + <span className="font-semibold text-zinc-900 dark:text-white">nuit activée</span> = 12h.
        </div>
      </aside>
    </div>
  );
}
