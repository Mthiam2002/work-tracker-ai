"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createWorkShift, updateWorkShift } from "./shifts-actions";
import { computePay } from "@/lib/pay";
import { brutToNet } from "@/lib/salary";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export type ShiftEconomy = {
  rate: number;
  nightMult: number;
  sundayMult: number;
  holidayMult: number;
  nightStart: number;
  nightEnd: number;
  netRatio: number;
};

export type ShiftInitial = {
  date: string;
  startTime: string;
  endTime: string;
  endsNextDay: boolean;
  breakMinutes: string;
};

const TYPES = [
  { key: "jour", label: "Journée", sub: "08h → 20h", start: "08:00", end: "20:00", night: false },
  { key: "nuit", label: "Nuit", sub: "20h → 08h", start: "20:00", end: "08:00", night: true },
  { key: "nuit2", label: "Nuit → lendemain", sub: "19h → 07h (J+1)", start: "19:00", end: "07:00", night: true },
  { key: "custom", label: "Personnalisée", sub: "Horaires libres", start: "", end: "", night: false },
];

const TIME_OPTS: string[] = Array.from({ length: 96 }, (_, i) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(i / 4))}:${p((i % 4) * 15)}`;
});

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function hoursLabel(h: number) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
}

function longDateLabel(date: string) {
  const parts = date.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return date;
  const s = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function withFallback(value: string) {
  return TIME_OPTS.includes(value) ? TIME_OPTS : [value, ...TIME_OPTS];
}

const darkInput =
  "w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-white outline-none transition placeholder:text-white/30 focus:border-[#2f8bff]/60 [color-scheme:dark]";

export function ShiftForm({
  shiftId,
  initial,
  economy,
  showRepeatTile = false,
}: {
  shiftId?: string;
  initial?: ShiftInitial;
  economy: ShiftEconomy;
  showRepeatTile?: boolean;
}) {
  const isEdit = Boolean(shiftId);
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);
  const [date, setDate] = useState(initial?.date ?? today);
  const [startTime, setStartTime] = useState(initial?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "20:00");
  const [endsNextDay, setEndsNextDay] = useState(initial?.endsNextDay ?? false);
  const [breakMinutes, setBreakMinutes] = useState(initial?.breakMinutes ?? "20");
  const [recalcRate, setRecalcRate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const activeType = useMemo(() => {
    const found = TYPES.find((t) => t.key !== "custom" && t.start === startTime && t.end === endTime && t.night === endsNextDay);
    return found?.key ?? "custom";
  }, [startTime, endTime, endsNextDay]);

  function applyType(key: string) {
    const t = TYPES.find((x) => x.key === key);
    if (!t || t.key === "custom") return;
    setStartTime(t.start);
    setEndTime(t.end);
    setEndsNextDay(t.night);
  }

  // Même calcul que le serveur (computePay), avec le taux en vigueur.
  const estimate = useMemo(() => {
    if (!date || !startTime || !endTime) return null;
    const dp = date.split("-").map(Number);
    const sp = startTime.split(":").map(Number);
    const ep = endTime.split(":").map(Number);
    if ([...dp, ...sp, ...ep].some((n) => !Number.isFinite(n))) return null;
    const start = new Date(Date.UTC(dp[0], dp[1] - 1, dp[2], sp[0], sp[1], 0));
    const endDay = new Date(Date.UTC(dp[0], dp[1] - 1, dp[2]));
    if (endsNextDay) endDay.setUTCDate(endDay.getUTCDate() + 1);
    const end = new Date(Date.UTC(endDay.getUTCFullYear(), endDay.getUTCMonth(), endDay.getUTCDate(), ep[0], ep[1], 0));
    if (!(end > start)) return null;
    const pay = computePay(start, end, economy.rate, {
      nightMult: economy.nightMult,
      sundayMult: economy.sundayMult,
      holidayMult: economy.holidayMult,
      nightStart: economy.nightStart,
      nightEnd: economy.nightEnd,
    });
    return {
      ...pay,
      base: pay.totalHours * economy.rate,
      nightBonus: pay.nightHours * economy.rate * economy.nightMult,
      sundayBonus: pay.sundayHours * economy.rate * economy.sundayMult,
      holidayBonus: pay.holidayHours * economy.rate * economy.holidayMult,
      net: brutToNet(pay.estimatedPay, economy.netRatio),
    };
  }, [date, startTime, endTime, endsNextDay, economy]);

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
        const payload = { date, startTime, endTime, endsNextDay, breakMinutes: parsedBreak, recalcRate };
        if (isEdit && shiftId) {
          await updateWorkShift(shiftId, payload);
          setIsError(false);
          setMessage(`Vacation mise à jour : ${estimate ? hoursLabel(estimate.totalHours) : "durée calculée"} (pause incluse).`);
        } else {
          await createWorkShift(payload);
          setIsError(false);
          setMessage(`Vacation créée : ${estimate ? hoursLabel(estimate.totalHours) : "durée calculée"} (pause incluse).`);
          setDate(today);
          setStartTime("08:00");
          setEndTime("20:00");
          setEndsNextDay(false);
          setBreakMinutes("0");
        }
      } catch (error) {
        console.error("Erreur lors de l'enregistrement de la vacation :", error);
        setIsError(true);
        setMessage(error instanceof Error ? error.message : "Une erreur est survenue lors de l'enregistrement de la vacation.");
      }
    });
  }

  const durationMin = estimate ? Math.round(estimate.totalHours * 60) : 0;
  const barPct = Math.max(4, Math.min(100, Math.round((durationMin / (12 * 60)) * 100)));
  const detected: string[] = [];
  if (estimate && estimate.sundayHours > 0) detected.push("Dimanche détecté – majoration appliquée automatiquement");
  if (estimate && estimate.nightHours > 0) detected.push("Nuit détectée – majoration appliquée automatiquement");
  if (estimate && estimate.holidayHours > 0) detected.push("Jour férié détecté – majoration appliquée automatiquement");

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      {/* Formulaire */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white sm:p-6"
      >
        {/* 1. Type */}
        <p className="text-[13px] font-bold">
          <span className="text-[#6ea8ff]">1.</span> <span className="ml-1">Type de vacation</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {TYPES.map((t) => {
            const active = activeType === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => applyType(t.key)}
                aria-pressed={active}
                className={`relative rounded-xl border p-3.5 text-left transition ${
                  active ? "border-[#2f8bff] bg-[#2f8bff]/15" : "border-white/10 bg-white/[0.03] hover:border-white/25"
                }`}
              >
                {active && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#2f8bff] text-[10px] font-bold">
                    ✓
                  </span>
                )}
                <span className="block text-[19px]">
                  {t.key === "jour" ? "☀️" : t.key === "custom" ? "🎚️" : t.key === "nuit2" ? "🌙→" : "🌙"}
                </span>
                <span className="mt-1 block text-[12.5px] font-bold">{t.label}</span>
                <span className="block text-[11px] text-white/50">{t.sub}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Date et horaires */}
        <p className="mt-6 text-[13px] font-bold">
          <span className="text-[#6ea8ff]">2.</span> <span className="ml-1">Date et horaires</span>
        </p>
        <div className="mt-3 max-w-[300px]">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={darkInput} />
        </div>

        <div className="mt-3 grid items-center gap-2.5 sm:grid-cols-[1fr_auto_1fr]">
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <span className="text-[15px]">🕐</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10.5px] text-white/45">Début</span>
              <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full appearance-none bg-transparent text-[15px] font-bold outline-none [color-scheme:dark]">
                {withFallback(startTime).map((o) => (
                  <option key={o} value={o} className="bg-[#101f3a]">
                    {o}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <span className="hidden text-white/40 sm:block">→</span>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <span className="text-[15px]">🕐</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10.5px] text-white/45">Fin{endsNextDay ? " (J+1)" : ""}</span>
              <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full appearance-none bg-transparent text-[15px] font-bold outline-none [color-scheme:dark]">
                {withFallback(endTime).map((o) => (
                  <option key={o} value={o} className="bg-[#101f3a]">
                    {o}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setEndsNextDay((v) => !v)}
          aria-pressed={endsNextDay}
          className={`mt-2.5 flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-left text-[12px] transition ${
            endsNextDay ? "border-[#2f8bff]/60 bg-[#2f8bff]/10 text-white" : "border-white/10 bg-white/[0.02] text-white/55 hover:text-white"
          }`}
        >
          <span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${endsNextDay ? "justify-end bg-[#2f8bff]" : "justify-start bg-white/20"}`}>
            <span className="h-4 w-4 rounded-full bg-white" />
          </span>
          Fin le lendemain <span className="text-white/40">(nuit : ex. 20h → 08h)</span>
        </button>

        {/* Barre visuelle */}
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <span className="text-[16px]">☀️</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#2f8bff] to-[#5ea9ff] transition-all" style={{ width: `${barPct}%` }} />
            </div>
            <span className="text-[16px]">🌙</span>
          </div>
          <div className="mt-1.5 flex items-center text-[11.5px] text-white/50">
            <span>{startTime || "--:--"}</span>
            <span className="mx-auto text-[14px] font-extrabold text-[#5ea9ff]">{estimate ? hoursLabel(estimate.totalHours) : "—"}</span>
            <span>{endTime || "--:--"}</span>
          </div>
        </div>

        {/* Pause */}
        <div className="mt-3 flex flex-wrap items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[14px]">⏸</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-bold">Pause</span>
            <span className="block text-[10.5px] text-white/45">(en minutes, rémunérée ou non)</span>
          </span>
          <input
            type="number"
            value={breakMinutes}
            min="0"
            step="5"
            onChange={(e) => setBreakMinutes(e.target.value)}
            className="w-[70px] rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center text-[13px] font-bold outline-none focus:border-[#2f8bff]/60 [color-scheme:dark]"
          />
          <span className="text-[11.5px] text-white/50">min</span>
          <span
            title="La pause est toujours rémunérée (incluse dans le total)"
            className="flex cursor-help items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11.5px] font-semibold text-white/70"
          >
            <span className="h-2 w-2 rounded-full bg-[#2f8bff]" /> Rémunérée
          </span>
        </div>

        {isEdit && (
          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[13px]">
            <input type="checkbox" checked={recalcRate} onChange={(e) => setRecalcRate(e.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-500" />
            <span>
              <span className="block font-semibold">Recalculer au taux actuel</span>
              <span className="block text-[11.5px] text-white/50">Décoché = garde le taux d&apos;origine (historique préservé).</span>
            </span>
          </label>
        )}

        {/* 3. Options avancées */}
        <p className="mt-6 flex items-center justify-between text-[13px] font-bold">
          <span>
            <span className="text-[#6ea8ff]">3.</span> <span className="ml-1">Options avancées</span>{" "}
            <span className="font-medium text-white/40">(facultatif)</span>
          </span>
          <span className="text-white/30">⌄</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Link href="/settings" className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 transition hover:border-white/25">
            <span className="block text-[16px]">👻</span>
            <span className="mt-1 block text-[12px] font-bold">Majoration(s)</span>
            <span className="block text-[10.5px] text-white/45">Dimanche, Nuit, Férié…</span>
          </Link>
          {[
            { icon: "📍", label: "Lieu", sub: "Site, chantier…" },
            { icon: "📝", label: "Commentaire", sub: "Ajouter une note…" },
          ].map((o) => (
            <span key={o.label} title="Bientôt disponible" className="cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.02] p-3.5 opacity-60">
              <span className="block text-[16px]">{o.icon}</span>
              <span className="mt-1 block text-[12px] font-bold">
                {o.label} <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white/60">Bientôt</span>
              </span>
              <span className="block text-[10.5px] text-white/45">{o.sub}</span>
            </span>
          ))}
          {showRepeatTile && (
            <a href="#copier-vacation" className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 transition hover:border-white/25">
              <span className="block text-[16px]">🔁</span>
              <span className="mt-1 block text-[12px] font-bold">Répéter</span>
              <span className="block text-[10.5px] text-white/45">Même vacation plusieurs jours</span>
            </a>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1d6ff2] text-[14px] font-semibold text-white transition hover:bg-[#1859c4] disabled:opacity-50"
        >
          {isPending ? (isEdit ? "Mise à jour…" : "Création en cours…") : isEdit ? "Mettre à jour" : "Continuer"} →
        </button>
        <Link
          href="/calendar"
          className="mt-2 block text-center text-[12.5px] font-medium text-white/50 transition hover:text-white"
        >
          Annuler
        </Link>

        {message && (
          <p className={`mt-4 rounded-xl px-4 py-3 text-[13px] ${isError ? "bg-red-500/15 text-[#ff9a9a]" : "bg-emerald-500/15 text-emerald-300"}`}>
            {message}
          </p>
        )}
      </form>

      {/* Récapitulatif temps réel */}
      <aside className="flex min-w-0 flex-col gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-[15px]">🧾</span>
            <h2 className="text-[14px] font-bold">Récapitulatif</h2>
          </div>
          <p className="ml-auto mt-1 w-fit rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
            Estimation en temps réel
          </p>

          <div className="mt-3 rounded-xl bg-white/[0.04] p-3.5">
            <p className="flex items-center gap-2 text-[13px] font-bold">☀️ {longDateLabel(date)}</p>
            <p className="mt-0.5 pl-7 text-[11px] text-white/50">{endsNextDay ? "Vacation de nuit" : "Vacation de jour"}</p>
          </div>
          <div className="mt-2 rounded-xl bg-white/[0.04] p-3.5">
            <p className="flex items-center gap-2 text-[13px] font-bold">
              🕐 {startTime || "--:--"} → {endTime || "--:--"}
              {endsNextDay ? " (+1j)" : ""}
            </p>
            <p className="mt-0.5 pl-7 text-[11px] text-white/50">{estimate ? `${hoursLabel(estimate.totalHours)} travaillées` : "—"}</p>
          </div>
          <div className="mt-2 rounded-xl bg-white/[0.04] p-3.5">
            <p className="flex items-center gap-2 text-[13px] font-bold">⏸ Pause</p>
            <p className="mt-0.5 pl-7 text-[11px] text-white/50">{breakMinutes || "0"} min (rémunérée)</p>
          </div>

          <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[17px] font-bold">$</span>
            <span>
              <span className="block text-[19px] font-extrabold">{estimate ? eur.format(estimate.estimatedPay) : "—"}</span>
              <span className="block text-[10.5px] text-white/50">brut estimé</span>
            </span>
            <span className="ml-auto text-right">
              <span className="block text-[12.5px] font-bold text-white/85">≈ {estimate ? eur.format(estimate.net) : "—"}</span>
              <span className="block text-[10.5px] text-white/50">net estimé</span>
            </span>
          </div>

          <div className="mt-2 rounded-xl bg-white/[0.04] p-3.5">
            <p className="flex items-center gap-1.5 text-[12px] font-bold">📘 Détail des majorations</p>
            <dl className="mt-2 space-y-1.5 text-[12px]">
              <div className="flex justify-between gap-2">
                <dt className="text-white/55">Salaire de base ({estimate ? hoursLabel(estimate.totalHours) : "—"})</dt>
                <dd className="font-semibold">{estimate ? eur.format(estimate.base) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-white/55">Majoration dimanche</dt>
                <dd className="font-semibold">+ {estimate ? eur.format(estimate.sundayBonus) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-white/55">Majoration nuit</dt>
                <dd className="font-semibold">+ {estimate ? eur.format(estimate.nightBonus) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-white/55">Majoration férié</dt>
                <dd className="font-semibold">+ {estimate ? eur.format(estimate.holidayBonus) : "—"}</dd>
              </div>
            </dl>
          </div>

          {detected.map((d) => (
            <p key={d} className="mt-2 rounded-xl bg-emerald-500/10 p-3 text-[11px] leading-snug text-emerald-300">
              ☀️ {d}
            </p>
          ))}

          <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-[#6d3fd4]/25 p-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6d3fd4] text-[15px]">📅</span>
            <p className="text-[11.5px] leading-snug text-white/80">Vous pouvez encore ajouter cette vacation à votre calendrier.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
