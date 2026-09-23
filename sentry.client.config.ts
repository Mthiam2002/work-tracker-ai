import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN || undefined,
  enabled: Boolean(SENTRY_DSN),
  // Volume réduit : 10 % des transactions, erreurs à 100 %.
  tracesSampleRate: 0.1,
  // Pas de replay session en v1 (limite le bruit et les données).
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});
