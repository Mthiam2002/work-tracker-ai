"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll } from "framer-motion";
import { CountUp } from "@/components/CountUp";

const rise = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

const grid = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const inView = { once: true, amount: 0.2 } as const;

/* ============================================================
   Bande de compteurs — un aperçu chiffré du produit
   ============================================================ */
const STATS = [
  { value: 48, kind: "hours" as const, label: "heures pointées ce mois-ci" },
  { value: 793.15, kind: "currency" as const, label: "brut estimé en un mois" },
  { value: 12, kind: "raw" as const, label: "vacations enregistrées" },
  { value: 77, kind: "raw" as const, label: "% net conservé (réglable)" },
];

export function StatsBand() {
  return (
    <section className="theme-light border-b border-border bg-background px-6 py-12">
      <motion.div
        variants={grid}
        initial="hidden"
        whileInView="visible"
        viewport={inView}
        className="mx-auto grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {STATS.map((s) => (
          <motion.div
            key={s.label}
            variants={rise}
            className="rounded-2xl border border-border bg-card p-5 text-center shadow-[0_1px_2px_rgba(16,42,80,0.06)]"
          >
            <p className="tnum text-[30px] font-extrabold leading-none text-card-foreground">
              <CountUp value={s.value} kind={s.kind} duration={1400} />
            </p>
            <p className="mt-2 text-[12.5px] leading-snug text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
      <p className="mt-5 text-center text-[11.5px] text-muted-foreground">
        Aperçu d&apos;un tableau de bord réel — tes chiffres seront les tiens.
      </p>
    </section>
  );
}

/* ============================================================
   Fonctionnalités
   ============================================================ */
const FEATURES = [
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
    title: "Salaire estimé en direct",
    text: "Heures × ton taux horaire courant, avec conversion brut → net. Le taux est historisé : tes vacations passées ne bougent pas.",
    icon: <span className="text-base font-bold">€</span>,
  },
  {
    title: "Majorations automatiques",
    text: "Nuit, dimanche, jour férié et heures supplémentaires calculées et cumulées automatiquement.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
    ),
  },
  {
    title: "Calendrier & dashboard",
    text: "Vue mensuelle, hebdomadaire ou journalière de tes vacations, avec totaux par semaine, mois et année.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 9h18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Bulletins de paie",
    text: "Centralise tes PDF, triés par année, accessibles instantanément depuis n'importe quel appareil.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
        <path d="M14 3v5h5M10 13h5M10 17h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Exports & sauvegarde",
    text: "CSV compatible Excel, récapitulatif PDF mensuel et sauvegarde JSON complète de toutes tes données.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path d="M12 3v12M8 11l4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function Features() {
  const reduce = useReducedMotion();
  return (
    <section className="theme-light bg-background px-6 py-16 sm:py-20">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={inView}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-5xl text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11.5px] font-semibold text-accent">
          Fonctionnalités
        </span>
        <h2 className="mt-4 text-[30px] font-extrabold leading-tight tracking-tight text-card-foreground sm:text-[36px]">
          Tout ce qu&apos;il faut pour être payé correctement
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-7 text-muted-foreground">
          Un outil personnel, pas un logiciel RH : tu pointes, il calcule.
        </p>
      </motion.div>

      <motion.div
        variants={grid}
        initial="hidden"
        whileInView="visible"
        viewport={inView}
        className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((f) => (
          <motion.article
            key={f.title}
            variants={rise}
            whileHover={reduce ? undefined : { y: -7 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="group rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] transition hover:border-accent/40 hover:shadow-[0_14px_34px_-14px_rgba(16,42,80,0.3)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-white">
              {f.icon}
            </span>
            <h3 className="mt-4 text-[15px] font-bold tracking-tight text-card-foreground">{f.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-6 text-muted-foreground">{f.text}</p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

/* ============================================================
   Étapes — ligne qui se dessine au scroll
   ============================================================ */
const STEPS = [
  {
    n: "01",
    title: "Crée ton compte",
    text: "E-mail, Google ou Apple. Deux minutes, aucune carte bancaire.",
  },
  {
    n: "02",
    title: "Pointe ta vacation",
    text: "Date, horaires, pause : le brut et le net estimé s'affichent tout de suite.",
  },
  {
    n: "03",
    title: "Suis ta paie",
    text: "Totaux par semaine, mois et année, bulletins archivés, exports prêts.",
  },
];

export function Steps() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });

  return (
    <section className="theme-light border-y border-border bg-card px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-[11.5px] font-semibold text-white">
            Mode d&apos;emploi
          </span>
          <h2 className="mt-4 text-[30px] font-extrabold leading-tight tracking-tight text-card-foreground sm:text-[36px]">
            Opérationnel en 3 étapes
          </h2>
        </div>

        <div ref={ref} className="relative mt-10">
          {/* Ligne de progression dessinée au scroll */}
          <div className="absolute left-[19px] top-2 hidden h-[calc(100%-2rem)] w-px bg-border sm:block" aria-hidden>
            <motion.div
              style={reduce ? { scaleY: 1 } : { scaleY: scrollYProgress }}
              className="h-full w-full origin-top bg-accent"
            />
          </div>

          <motion.ol
            variants={grid}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="space-y-8"
          >
            {STEPS.map((s) => (
              <motion.li key={s.n} variants={rise} className="relative flex gap-5 sm:pl-14">
                <span className="tnum absolute left-0 top-0 hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-[13px] font-extrabold text-accent sm:flex">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-[17px] font-bold tracking-tight text-card-foreground">{s.title}</h3>
                  <p className="mt-1 max-w-lg text-[14.5px] leading-6 text-muted-foreground">{s.text}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Aperçu produit : bénéfices + miniature calendrier animée
   ============================================================ */
const BENEFITS = [
  "Heures, brut et net calculés à la saisie",
  "Majorations nuit / dimanche / férié / HS cumulées",
  "Taux horaire historisé, jamais de recalcul rétroactif",
  "Rappels par e-mail et notification push si tu oublies",
  "Données exportables et sauvegardables à tout moment",
];

const CAL_DAYS = [0, 0, 1, 1, 0, 2, 0, 1, 0, 0, 3, 1, 0, 2, 1, 0, 0, 4, 1, 0, 2, 0, 1, 3, 0, 0, 1, 2, 0, 1];
const DOT_TONES = ["", "bg-accent", "bg-profit", "bg-premium", "bg-accent"];

export function Preview() {
  const reduce = useReducedMotion();
  return (
    <section className="theme-light bg-background px-6 py-16 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={inView}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11.5px] font-semibold text-accent">
            Ton quotidien
          </span>
          <h2 className="mt-4 text-[30px] font-extrabold leading-tight tracking-tight text-card-foreground sm:text-[34px]">
            Un mois d&apos;heures,<br className="hidden sm:block" /> lu en un coup d&apos;œil
          </h2>
          <ul className="mt-6 space-y-3">
            {BENEFITS.map((b, i) => (
              <motion.li
                key={b}
                initial={reduce ? false : { opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={inView}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.08 }}
                className="flex items-start gap-3 text-[14.5px] leading-6 text-muted-foreground"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-profit/15 text-profit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {b}
              </motion.li>
            ))}
          </ul>
          <Link
            href="/sign-up"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.03] hover:bg-accent/90"
          >
            Commencer gratuitement →
          </Link>
        </motion.div>

        {/* Miniature calendrier */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 34, rotate: -1.5 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={inView}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-border bg-card p-5 shadow-[0_14px_40px_-20px_rgba(16,42,80,0.45)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-bold text-card-foreground">Novembre 2026</p>
            <span className="flex gap-1.5 text-muted-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px]">‹</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px]">›</span>
            </span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <span key={`h${i}`} className="pb-1 text-center text-[10px] font-semibold text-muted-foreground">
                {d}
              </span>
            ))}
            {CAL_DAYS.map((v, i) => (
              <motion.span
                key={i}
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={inView}
                transition={{ duration: 0.3, delay: 0.25 + i * 0.015 }}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border border-border bg-background text-[11px] font-semibold text-muted-foreground"
              >
                {i + 1}
                {v > 0 && <span className={`mt-1 h-1.5 w-1.5 rounded-full ${DOT_TONES[v]}`} />}
              </motion.span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3 text-[10.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Jour
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-profit" /> Week-end
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-premium" /> Nuit / majeur
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA final
   ============================================================ */
export function FinalCTA() {
  const reduce = useReducedMotion();
  return (
    <section
      className="relative overflow-hidden px-6 py-16 sm:py-20"
      style={{ background: "linear-gradient(120deg, var(--hero-from) 0%, var(--hero-to) 100%)" }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/35 blur-[100px]"
        animate={reduce ? undefined : { x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={inView}
        transition={{ duration: 0.6 }}
        className="relative mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left"
      >
        <div>
          <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-white sm:text-[30px]">
            Prêt à pointer ta prochaine vacation ?
          </h2>
          <p className="mt-2 text-[14.5px] text-white/65">
            2 minutes suffisent pour créer ton compte et ajouter ta première heure.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.03] hover:bg-white/90"
          >
            Créer un compte
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition hover:scale-[1.03] hover:bg-white/10"
          >
            Se connecter
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
