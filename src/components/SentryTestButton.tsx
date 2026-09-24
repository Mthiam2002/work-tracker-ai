"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export function SentryTestButton() {
  const [message, setMessage] = useState<string | null>(null);

  async function handleTest() {
    setMessage(null);
    // 1. Erreur côté navigateur
    Sentry.captureException(new Error("Test Sentry client (bouton diagnostic)"));
    // 2. Erreur côté serveur (route qui lève volontairement)
    try {
      await fetch("/api/debug/sentry");
    } catch {
      // L'échec HTTP est normal : c'est l'erreur serveur qui compte
    }
    setMessage("Erreurs de test envoyées. Vérifie Sentry → Issues dans 1 à 2 minutes.");
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleTest}
        className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium transition hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10"
      >
        Envoyer une erreur de test
      </button>
      {message && <p className="text-xs text-zinc-500">{message}</p>}
    </div>
  );
}
