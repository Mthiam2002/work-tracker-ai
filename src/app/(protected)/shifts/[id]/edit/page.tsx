import { requireAuth } from "@/lib/require-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShiftForm } from "../../ShiftForm";
import { getWorkShift } from "../../shifts-actions";
import { getUserSettings } from "../../../settings/settings-actions";

function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function toTimeInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export default async function EditShiftPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const [shift, settings] = await Promise.all([getWorkShift(id), getUserSettings().catch(() => null)]);
  if (!shift) notFound();

  const initial = {
    date: toDateInput(shift.startDate),
    startTime: toTimeInput(shift.startTime),
    endTime: toTimeInput(shift.endTime),
    endsNextDay: toDateInput(shift.endDate) !== toDateInput(shift.startDate),
    breakMinutes: String(shift.breakMinutes),
  };

  const economy = {
    rate: settings?.rate ?? 12.33,
    nightMult: settings?.nightMult ?? 0.2,
    sundayMult: settings?.sundayMult ?? 0.2,
    holidayMult: settings?.holidayMult ?? 1.0,
    nightStart: settings?.nightStart ?? 21,
    nightEnd: settings?.nightEnd ?? 6,
    netRatio: settings?.netRatio ?? 0.77,
  };

  return (
    <main className="mt-4 rounded-2xl bg-gradient-to-b from-[#0d1c38] to-[#070f24] p-4 text-white sm:p-6">
      <div className="flex flex-wrap gap-2.5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[12.5px] font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tableau de bord
        </Link>
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[12.5px] font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Calendrier
        </Link>
      </div>

      <div className="mt-4">
        <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">Modifier la vacation</h1>
        <p className="mt-1 max-w-xl text-[12.5px] text-white/55">
          Ajuste les horaires ou la pause. Le taux d&apos;origine est conservé sauf si tu coches « Recalculer ».
        </p>
      </div>

      <div className="mt-5">
        <ShiftForm shiftId={shift.id} initial={initial} economy={economy} />
      </div>
    </main>
  );
}
