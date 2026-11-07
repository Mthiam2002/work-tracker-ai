import Link from "next/link";
import { redirect } from "next/navigation";
import { ShiftForm } from "../ShiftForm";
import { duplicateLastShiftAsToday, getLastShift } from "../shifts-actions";
import { getUserSettings } from "../../settings/settings-actions";
import { getMonthShifts } from "../../dashboard/dashboard-queries";
import { MiniMonthCal } from "@/components/MiniMonthCal";
import { CopyShiftCard } from "@/components/CopyShiftCard";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(d);
}

function toTimeInput(d: Date) {
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export default async function NewShiftPage() {
  const [last, settings] = await Promise.all([getLastShift().catch(() => null), getUserSettings().catch(() => null)]);
  const now = new Date();
  const monthShifts = await getMonthShifts(now.getFullYear(), now.getMonth() + 1).catch(() => []);
  const daysWith = [...new Set(monthShifts.map((s) => s.startDate.getUTCDate()))].sort((a, b) => a - b);
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(now);
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  async function duplicateAction() {
    "use server";
    await duplicateLastShiftAsToday();
    redirect("/dashboard");
  }

  const economy = {
    rate: settings?.rate ?? 12.33,
    nightMult: settings?.nightMult ?? 0.1,
    sundayMult: settings?.sundayMult ?? 0.1,
    holidayMult: settings?.holidayMult ?? 1.0,
    nightStart: settings?.nightStart ?? 21,
    nightEnd: settings?.nightEnd ?? 6,
    overtimeMult: settings?.overtimeMult ?? 0.25,
    netRatio: settings?.netRatio ?? 0.78,
  };

  const lastInfo = last
    ? { start: toTimeInput(last.startTime), end: toTimeInput(last.endTime), endsNextDay: last.endDate.getTime() !== last.startDate.getTime(), breakMinutes: last.breakMinutes, overtimeHours: last.overtimeHours }
    : null;

  const steps = [
    { n: "1", icon: "📅", title: "Choisissez le type de vacation", sub: "(journée, nuit, personnalisée)" },
    { n: "2", icon: "🕐", title: "Renseignez la date et les horaires", sub: "(le système détecte automatiquement les nuits et dimanches)" },
    { n: "3", icon: "€", title: "Voir le résultat en temps réel", sub: "(salaire, majorations, net estimé)" },
    { n: "4", icon: "✓", title: "Enregistrez votre vacation", sub: "et c'est terminé !" },
  ];

  const features = [
    { icon: "🚀", title: "Rapide", sub: "Pointage en quelques secondes" },
    { icon: "🛡️", title: "Fiable", sub: "Calcul automatique des majorations" },
    { icon: "🎯", title: "Clair", sub: "Résumé de vos revenus en temps réel" },
    { icon: "⭐", title: "Pratique", sub: "Copiez, répétez, gérez facilement" },
  ];

  return (
    <main className="mt-4 rounded-2xl bg-gradient-to-b from-[#0d1c38] to-[#070f24] p-4 text-white sm:p-6">
      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_290px]">
        {/* Colonne centrale */}
        <div className="min-w-0">
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[12.5px] font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour au calendrier
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2.5 text-[26px] font-extrabold tracking-tight sm:text-[30px]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-8 w-8">
                  <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                  <path d="M3 9.5h18M8 2.5v4M16 2.5v4M7 14h3M7 17h6" strokeLinecap="round" />
                </svg>
                Ajouter une vacation
              </h1>
              <p className="mt-1 text-[12.5px] text-white/55">Enregistrez vos heures en quelques secondes.</p>
            </div>
            {last && (
              <form
                action={duplicateAction}
                className="flex items-center gap-3 rounded-2xl border border-[#2f8bff]/40 bg-[#2f8bff]/10 px-4 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2f8bff]/50 text-[15px]">
                  🕐
                </span>
                <span>
                  <span className="block text-[12.5px] font-bold">Reprendre ma dernière vacation</span>
                  <span className="block text-[11px] text-white/55">
                    {fmtTime(last.startTime)} → {fmtTime(last.endTime)} · {Math.round(last.totalHours)}h · pause {last.breakMinutes} min
                  </span>
                </span>
                <button
                  type="submit"
                  className="ml-2 shrink-0 rounded-full bg-[#1d6ff2] px-4 py-2 text-[12px] font-semibold transition hover:bg-[#1859c4]"
                >
                  Reprendre
                </button>
              </form>
            )}
          </div>

          <div className="mt-5">
            <ShiftForm economy={economy} showRepeatTile />
          </div>

          {/* Bandeau bas */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {features.map((f) => (
                <div key={f.title} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1d6ff2]/20 text-[17px]">
                    {f.icon}
                  </span>
                  <span>
                    <span className="block text-[12.5px] font-bold">{f.title}</span>
                    <span className="block text-[10.5px] leading-snug text-white/50">{f.sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rail droit */}
        <div className="flex min-w-0 flex-col gap-4">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold">⚡ Une expérience simple et rapide</h2>
            <p className="mt-0.5 text-[11.5px] text-white/50">Moins de clics, plus d&apos;efficacité.</p>
            <ol className="mt-3 flex flex-col gap-2">
              {steps.map((s) => (
                <li key={s.n} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1d6ff2]/25 text-[12px] font-bold text-[#8db8ff]">
                    {s.n}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[15px]">{s.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-[11.5px] font-bold leading-snug">{s.title}</span>
                    <span className="block text-[10px] leading-snug text-white/45">{s.sub}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="flex items-center gap-2 text-[13.5px] font-bold">📅 Autres vues disponibles</h2>
            <p className="mt-0.5 text-[11px] text-white/50">Accédez à vos vacations d&apos;un simple clic.</p>
            <MiniMonthCal year={now.getFullYear()} month={now.getMonth() + 1} monthLabel={monthLabelCap} daysWith={daysWith} />
            <div className="mt-2.5 rounded-xl border border-white/10 p-3">
              <p className="text-[11px] font-bold text-white/70">Légende</p>
              <ul className="mt-1.5 space-y-1 text-[10.5px] text-white/50">
                <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#1d6ff2]" /> Vacation journée</li>
                <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#6d3fd4]" /> Vacation nuit</li>
                <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400" /> Dimanche / Férié</li>
                <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/25" /> En attente</li>
              </ul>
              <Link href="/calendar" className="mt-2 block rounded-full bg-white/5 py-1.5 text-center text-[11px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">
                Voir toutes →
              </Link>
            </div>
          </section>

          <CopyShiftCard last={lastInfo} />
        </div>
      </div>
    </main>
  );
}
