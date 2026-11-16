import { requireAuth } from "@/lib/require-auth";
import { PayslipUploadForm } from "@/components/PayslipUploadForm";
import Link from "next/link";

export default async function PayslipUploadPage() {
  await requireAuth("/payslips/upload");

  return (
    <main className="mt-4">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2.5 motion-safe:animate-[card-in_500ms_ease-out_both]">
          <Link
            href="/payslips"
            className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-[12.5px] font-medium text-accent backdrop-blur transition hover:bg-accent/15"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour aux bulletins
          </Link>
        </div>

        <div className="mt-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-1.5 text-xs font-medium text-card-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            PDF · max 10 Mo
          </p>
          <h1 className="mt-4 text-[30px] font-extrabold tracking-tight text-card-foreground">Ajouter un bulletin</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">
            Téléverse ton bulletin PDF et associe-lui une année (et un mois si tu veux) pour le retrouver trié.
          </p>
        </div>

        <section className="motion-safe:animate-[card-in_500ms_ease-out_both] mt-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:shadow-none">
          <PayslipUploadForm />
          <Link href="/payslips" className="mt-5 inline-block text-[12px] font-medium text-accent transition hover:underline">
            Voir mes bulletins →
          </Link>
        </section>
      </div>
    </main>
  );
}
