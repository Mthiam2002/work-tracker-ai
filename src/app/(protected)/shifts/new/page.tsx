import Link from "next/link";
import { ShiftForm } from "../ShiftForm";

export default function NewShiftPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour au tableau de bord
        </Link>

        <div className="mt-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Pointage manuel
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Ajouter une vacation</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
            Renseigne ta journée de 12h, de jour comme de nuit. La durée et le salaire estimé sont calculés automatiquement.
          </p>
        </div>

        <div className="mt-8">
          <ShiftForm />
        </div>
      </main>
    </div>
  );
}
