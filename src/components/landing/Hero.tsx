"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { DashboardMock } from "./DashboardMock";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Parallax : la maquette remonte et se redresse, les lueurs s'éloignent.
  const mockY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  const mockTilt = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -9]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 170]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70]);
  const copyFade = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0.25]);

  const loop = (from: number, to: number) =>
    reduce
      ? {}
      : {
          x: [0, from, 0],
          y: [0, to, 0],
          scale: [1, 1.18, 1],
          transition: { duration: 15, repeat: Infinity, ease: "easeInOut" as const },
        };

  return (
    <section
      ref={ref}
      className="relative overflow-hidden px-6 pb-24 pt-24 sm:pt-28"
      style={{ background: "linear-gradient(125deg, var(--hero-from) 0%, var(--hero-to) 72%)" }}
    >
      {/* Lueurs en mouvement (dégradé animé) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <motion.div
          style={{ y: glowY }}
          className="absolute -left-32 -top-40 h-[420px] w-[420px] rounded-full bg-accent/35 blur-[110px]"
          animate={loop(70, 50)}
        />
        <motion.div
          style={{ y: glowY }}
          className="absolute -right-40 top-10 h-[380px] w-[380px] rounded-full bg-premium/30 blur-[110px]"
          animate={loop(-60, 60)}
        />
        <motion.div
          className="absolute -bottom-56 left-1/3 h-[440px] w-[440px] rounded-full bg-profit/20 blur-[120px]"
          animate={loop(80, -40)}
        />
        {/* Grille technique façon dashboard */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 35%, black, transparent)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <motion.div
          variants={stagger}
          initial={reduce ? false : "hidden"}
          animate="visible"
          style={{ y: copyY, opacity: copyFade }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-profit opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-profit" />
            </span>
            Suivi d&apos;heures &amp; salaire estimé
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-[40px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-[56px]"
          >
            Tes vacations de 12h,{" "}
            <motion.span
              className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 bg-clip-text text-transparent"
              style={{ backgroundSize: "220% 100%" }}
              animate={reduce ? undefined : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              ton salaire
            </motion.span>{" "}
            en clair.
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-5 max-w-xl text-[15.5px] leading-7 text-white/70 sm:text-base"
          >
            Pointe tes heures de jour comme de nuit, visualise ton calendrier
            et estime ta paie à partir de ton taux horaire. Simple, rapide, personnel.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-7 text-[15px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(37,99,235,0.7)] transition hover:scale-[1.03] hover:bg-accent/90 active:scale-100 sm:w-auto"
            >
              Créer un compte gratuit
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/sign-in"
              className="flex h-12 w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 text-[15px] font-semibold text-white backdrop-blur transition hover:scale-[1.03] hover:bg-white/20 active:scale-100 sm:w-auto"
            >
              Se connecter
            </Link>
          </motion.div>

          <motion.p variants={item} className="mt-5 text-xs text-white/60">
            Connexion par e-mail, Google ou Apple via Clerk · sans carte bancaire.
          </motion.p>
        </motion.div>

        {/* Maquette : parallax + redressement au scroll */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 70, rotateX: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{ y: mockY, rotateX: mockTilt, transformPerspective: 1600 }}
          className="relative mx-auto mt-14 max-w-4xl"
        >
          <div className="absolute -inset-x-6 -top-6 h-24 rounded-full bg-accent/30 blur-3xl" aria-hidden />
          <div className="relative">
            <DashboardMock />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
