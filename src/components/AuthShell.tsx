import Link from "next/link";

const points = [
  { title: "Vacations 12h jour & nuit", text: "Pointage en secondes, pauses rémunérées incluses." },
  { title: "Salaire estimé en direct", text: "Basé sur ton taux horaire courant." },
  { title: "Calendrier + bulletins", text: "Vue mensuelle et PDF triés par année." },
];

export function AuthShell({
  badge,
  title,
  subtitle,
  children,
}: {
  badge: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased">
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
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:hover:text-white"
        >
          ← Retour à l&apos;accueil
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-12 lg:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden overflow-hidden rounded-3xl bg-zinc-950 p-10 text-white lg:flex lg:flex-col lg:justify-between dark:border dark:border-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl"
          />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {badge}
            </p>
            <h1 className="mt-6 max-w-md text-3xl font-semibold leading-[1.15] tracking-tight">
              Tes heures de travail, enfin claires et valorisées.
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-7 text-zinc-400">
              Un espace personnel pour suivre tes vacations, estimer ta paie et retrouver tes bulletins.
            </p>
          </div>
          <ul className="relative mt-10 space-y-4">
            {points.map((p, i) => (
              <li key={p.title} className="flex gap-3.5 rounded-2xl border border-white/10 bg-white/4 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{p.title}</span>
                  <span className="mt-0.5 block text-sm text-zinc-400">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200/80 bg-white px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm text-center">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{subtitle}</p>
          </div>
          <div className="mt-6 flex w-full justify-center">{children}</div>
        </section>
      </main>
    </div>
  );
}
