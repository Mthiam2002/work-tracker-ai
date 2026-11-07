"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWorkShift } from "@/app/(protected)/shifts/shifts-actions";

export type LastShiftInfo = {
  start: string;
  end: string;
  endsNextDay: boolean;
  breakMinutes: number;
  overtimeHours: number;
} | null;

function nextDays(n: number) {
  const out: { iso: string; label: string }[] = [];
  const now = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const p = (x: number) => String(x).padStart(2, "0");
    const iso = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const label = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" })
      .format(d)
      .replace(/\./g, "");
    out.push({ iso, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return out;
}

export function CopyShiftCard({ last }: { last: LastShiftInfo }) {
  const days = nextDays(4);
  const [checked, setChecked] = useState<boolean[]>([true, true, false, false]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const count = checked.filter(Boolean).length;

  function handleCreate() {
    if (!last) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const targets = days.filter((_, i) => checked[i]);
        for (const t of targets) {
          await createWorkShift({
            date: t.iso,
            startTime: last.start,
            endTime: last.end,
            endsNextDay: last.endsNextDay,
            breakMinutes: last.breakMinutes,
            overtimeHours: last.overtimeHours,
          });
        }
        setMessage(`${targets.length} vacation${targets.length > 1 ? "s" : ""} créée${targets.length > 1 ? "s" : ""}.`);
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Échec de la création.");
      }
    });
  }

  return (
    <div id="copier-vacation" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white">
      <p className="flex items-center gap-2 text-[13px] font-bold">📋 Copier une vacation</p>
      <p className="mt-0.5 text-[11px] text-white/50">
        {last
          ? `Répète ${last.start} → ${last.end}${last.endsNextDay ? " (+1j)" : ""} sur les jours cochés.`
          : "Gagnez du temps sur les mêmes horaires."}
      </p>
      {last ? (
        <>
          <p className="mt-3 text-[11px] font-semibold text-white/60">Répéter sur :</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {days.map((d, i) => (
              <button
                key={d.iso}
                type="button"
                onClick={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
                aria-pressed={checked[i]}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10.5px] font-medium transition ${
                  checked[i] ? "border-[#2f8bff]/60 bg-[#2f8bff]/15 text-white" : "border-white/10 text-white/50 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded border text-[9px] ${
                    checked[i] ? "border-[#2f8bff] bg-[#2f8bff] text-white" : "border-white/30 text-transparent"
                  }`}
                >
                  ✓
                </span>
                {d.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending || count === 0}
            className="mt-3 h-10 w-full rounded-full bg-[#1d6ff2] text-[12.5px] font-semibold transition hover:bg-[#1859c4] disabled:opacity-40"
          >
            {isPending ? "Création…" : `Créer ${count} vacation${count > 1 ? "s" : ""}`}
          </button>
          {message && <p className="mt-2 text-center text-[11.5px] text-emerald-300">{message}</p>}
        </>
      ) : (
        <p className="mt-2 text-[11.5px] text-white/50">Pointez une première vacation pour pouvoir la copier.</p>
      )}
    </div>
  );
}
