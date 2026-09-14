import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const features = [
  {
    title: "Pointage 12h, même de nuit",
    text: "Déclare tes vacations jour ou nuit en quelques secondes, pauses incluses car rémunérées.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Salaire estimé",
    text: "Heures × ton taux horaire courant, basé sur le SMIC et modifiable à tout moment.",
    icon: <span className="text-base font-bold">€</span>,
  },
  {
    title: "Calendrier & dashboard",
    text: "Vue mensuelle de tes vacations et totaux par semaine, mois et année.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 9h18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Bulletins de paie",
    text: "Centralise tes PDF, triés par année, accessibles quand tu en as besoin.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
        <path d="M14 3v5h5M10 13h5M10 17h5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  const primaryHref = "/sign-up";
  const primaryLabel = "Créer un compte gratuit";

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-[17px] font-semibold tracking-tight">Work Tracker</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/sign-in"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200/70 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Se connecter
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            S&apos;inscrire
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6">
        <section className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white px-6 py-16 text-center shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:px-12 sm:py-20 dark:border-white/10 dark:bg-zinc-950">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-32 mx-auto h-64 max-w-2xl rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-500/20"
          />
          <p className="relative mx-auto inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Suivi d&apos;heures & salaire estimé
          </p>
          <h1 className="relative mx-auto mt-6 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Tes vacations de 12h,
            <span className="text-blue-600 dark:text-blue-400"> ton salaire</span> en clair.
          </h1>
          <p className="relative mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8 dark:text-zinc-400">
            Pointe tes heures de jour comme de nuit, visualise ton calendrier
            et estime ta paie à partir de ton taux horaire. Simple, rapide, personnel.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className="flex h-12 w-full items-center justify-center rounded-full bg-blue-600 px-7 text-[15px] font-medium text-white transition hover:bg-blue-700 sm:w-auto"
            >
              {primaryLabel}
            </Link>
            <Link
              href="/sign-in"
              className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-200 px-7 text-[15px] font-medium transition hover:bg-zinc-100 sm:w-auto dark:border-white/15 dark:hover:bg-white/10"
            >
              Se connecter
            </Link>
          </div>
          <p className="relative mt-5 text-xs text-zinc-500 dark:text-zinc-500">
            Connexion par e-mail, Google ou Apple via Clerk.
          </p>
        </section>

        <section className="grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 text-left transition hover:shadow-sm dark:border-white/10 dark:bg-zinc-950"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                {f.icon}
              </span>
              <h2 className="mt-4 text-[15px] font-semibold tracking-tight">{f.title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="mb-12 flex flex-col items-center justify-between gap-5 rounded-2xl bg-zinc-950 px-8 py-8 text-center sm:flex-row sm:text-left dark:bg-white/[0.06] dark:border dark:border-white/10">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Prêt à pointer ta prochaine vacation ?</h2>
            <p className="mt-1 text-sm text-zinc-400">2 minutes suffisent pour créer ton compte et ajouter ta première heure.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/sign-up"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              S&apos;inscrire
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Se connecter
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200/80 py-6 text-center text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-500">
        Work Tracker — suivi personnel des heures & bulletins de paie.
      </footer>
    </div>
  );
}
