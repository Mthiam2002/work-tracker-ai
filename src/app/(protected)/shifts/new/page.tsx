import Link from "next/link";
import { redirect } from "next/navigation";
import { ShiftForm } from "../ShiftForm";
import { duplicateLastShiftAsToday, getLastShift } from "../shifts-actions";

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(d);
}

export default async function NewShiftPage() {
  const last = await getLastShift().catch(() => null);

  async function duplicateAction() {
    "use server";
    await duplicateLastShiftAsToday();
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          Retour au tableau de bord
        </Link>

        <div className="mt-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Pointage manuel
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Ajouter une vacation</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
            Modèles 1-clic, majorations nuit / dimanche / férié calculées automatiquement.
          </p>
        </div>

        {last && (
          <form action={duplicateAction} className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl border border-zinc-200/80 bg-white p-4 text-sm dark:border-white/10 dark:bg-zinc-950">
            <span className="text-zinc-600 dark:text-zinc-400">
              Dernière : {fmtTime(last.startTime)} → {fmtTime(last.endTime)} · {Math.round(last.totalHours)}h
            </span>
            <button type="submit" className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black">
              Reprendre aujourd&apos;hui
            </button>
          </form>
        )}

        <div className="mt-8">
          <ShiftForm />
        </div>
      </main>
    </div>
  );
}
