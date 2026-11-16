"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const points = [
  { title: "Vacations 12h jour & nuit", text: "Pointage en secondes, pauses rémunérées incluses." },
  { title: "Salaire estimé en direct", text: "Basé sur ton taux horaire courant, brut et net." },
  { title: "Calendrier + bulletins", text: "Vue mensuelle et PDF triés par année." },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

/**
 * Coquille des pages d'authentification (connexion / inscription).
 * Mixte comme la page d'accueil : panneau marketing sombre à gauche,
 * panneau formulaire clair à droite (tokens force via .theme-light).
 */
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
  const reduce = useReducedMotion();

  const loop = (x: number, y: number) =>
    reduce
      ? {}
      : {
          x: [0, x, 0],
          y: [0, y, 0],
          scale: [1, 1.15, 1],
          transition: { duration: 14, repeat: Infinity, ease: "easeInOut" as const },
        };

  return (
    <div className="theme-light min-h-screen bg-background text-foreground antialiased">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.75)] transition group-hover:scale-105">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-[17px] font-bold tracking-tight text-card-foreground">Work Tracker</span>
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:bg-muted"
        >
          ← Retour à l&apos;accueil
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-12 lg:grid-cols-[1.05fr_1fr]">
        {/* Panneau marketing (sombre) */}
        <section
          className="relative hidden overflow-hidden rounded-3xl p-10 text-white lg:flex lg:flex-col lg:justify-between"
          style={{ background: "linear-gradient(125deg, var(--hero-from) 0%, var(--hero-to) 100%)" }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <motion.div
              className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-accent/40 blur-3xl"
              animate={loop(-50, 45)}
            />
            <motion.div
              className="absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-premium/35 blur-3xl"
              animate={loop(45, -40)}
            />
            <div
              className="absolute inset-0 opacity-[0.13]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "52px 52px",
                maskImage: "radial-gradient(ellipse 80% 70% at 60% 20%, black, transparent)",
              }}
            />
          </div>

          <motion.div variants={container} initial={reduce ? false : "hidden"} animate="visible" className="relative">
            <motion.span
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-profit opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-profit" />
              </span>
              {badge}
            </motion.span>
            <motion.h1
              variants={item}
              className="mt-6 max-w-md text-[32px] font-extrabold leading-[1.12] tracking-tight"
            >
              Tes heures de travail,{" "}
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                enfin claires
              </span>{" "}
              et valorisées.
            </motion.h1>
            <motion.p variants={item} className="mt-3 max-w-md text-[15px] leading-7 text-white/65">
              Un espace personnel pour suivre tes vacations, estimer ta paie et retrouver tes bulletins.
            </motion.p>
          </motion.div>

          <motion.ul
            variants={container}
            initial={reduce ? false : "hidden"}
            animate="visible"
            className="relative mt-10 space-y-3.5"
          >
            {points.map((p, i) => (
              <motion.li
                key={p.title}
                variants={item}
                whileHover={reduce ? undefined : { x: 6 }}
                className="flex gap-3.5 rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-sm transition hover:border-white/25"
              >
                <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(37,99,235,0.9)]">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{p.title}</span>
                  <span className="mt-0.5 block text-sm text-white/60">{p.text}</span>
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </section>

        {/* Panneau formulaire (clair) */}
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-10 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:px-10"
        >
          <div className="w-full max-w-sm text-center">
            <h2 className="text-[26px] font-extrabold tracking-tight text-card-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
          </div>
          <div className="auth-form mt-6 flex w-full justify-center">{children}</div>
        </motion.section>
      </main>
    </div>
  );
}
