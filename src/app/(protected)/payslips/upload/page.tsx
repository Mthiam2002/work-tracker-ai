import { requireAuth } from "@/lib/require-auth";
import { PayslipUploadForm } from "@/components/PayslipUploadForm";
import Link from "next/link";

export default async function PayslipUploadPage() {
  await requireAuth("/payslips/upload");

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/payslips"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour aux bulletins
          </Link>
        </div>

        <div className="mt-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            PDF · max 10 Mo
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Ajouter un bulletin</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
            Téléverse ton bulletin PDF et associe-lui une année (et un mois si tu veux) pour le retrouver trié.
          </p>
        </div>

        <section className="mt-8 rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950">
          <PayslipUploadForm />
          <Link href="/payslips" className="mt-5 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            Voir mes bulletins →
          </Link>
        </section>
      </main>
    </div>
  );
}
