"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { Hero } from "./Hero";
import { StatsBand, Features, Steps, Preview, FinalCTA } from "./Sections";

export function Landing() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  // Le header passe de transparent (sur le hero sombre) à une barre floutée.
  useMotionValueEvent(scrollY, "change", (v) => {
    const next = v > 40;
    setScrolled((prev) => (prev === next ? prev : next));
  });

  const navLink =
    "rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-80";

  return (
    <div className="theme-light min-h-screen bg-background text-foreground antialiased">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-border bg-background/85 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-[0_6px_16px_-6px_rgba(37,99,235,0.8)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
            </span>
            <span
              className={`text-[16.5px] font-bold tracking-tight transition-colors ${
                scrolled ? "text-card-foreground" : "text-white"
              }`}
            >
              Work Tracker
            </span>
          </Link>

          <nav className="flex items-center gap-1.5">
            <Link
              href="/sign-in"
              className={`${navLink} ${scrolled ? "text-muted-foreground hover:text-card-foreground" : "text-white/80 hover:text-white"}`}
            >
              Se connecter
            </Link>
            <motion.div whileHover={reduce ? undefined : { scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/sign-up"
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.9)] transition hover:bg-accent/90"
              >
                S&apos;inscrire
              </Link>
            </motion.div>
          </nav>
        </div>
      </header>

      <main>
        <Hero />
        <StatsBand />
        <Features />
        <Steps />
        <Preview />
        <FinalCTA />
      </main>

      <footer className="border-t border-border bg-background px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
            </span>
            Work Tracker — suivi personnel des heures &amp; bulletins de paie.
          </p>
          <p className="text-[12px] text-muted-foreground">
            Fait en France · Données personnelles et exportables
          </p>
        </div>
      </footer>
    </div>
  );
}
