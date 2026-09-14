import { requireAuth } from "@/lib/require-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShiftForm } from "../../ShiftForm";
import { getWorkShift } from "../../shifts-actions";

function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditShiftPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const shift = await getWorkShift(id);
  if (!shift) notFound();

  const initial = {
    date: toDateInput(shift.startDate),
    startTime: toTimeInput(shift.startTime),
    endTime: toTimeInput(shift.endTime),
    endsNextDay: toDateInput(shift.endDate) !== toDateInput(shift.startDate),
    breakMinutes: String(shift.breakMinutes),
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Tableau de bord
          </Link>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            Calendrier
          </Link>
        </div>

        <div className="mt-6">
          <h1 className="text-3xl font-semibold tracking-tight">Modifier la vacation</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
            Ajuste les horaires ou la pause. La durée et le salaire estimé sont recalculés avec ton taux courant.
          </p>
        </div>

        <div className="mt-8">
          <ShiftForm shiftId={shift.id} initial={initial} />
        </div>
      </main>
    </div>
  );
}
