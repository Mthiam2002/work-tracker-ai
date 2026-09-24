import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

/** Route temporaire de diagnostic : lève volontairement une erreur pour vérifier Sentry côté serveur. */
export async function GET() {
  try {
    throw new Error("Test Sentry serveur (route /api/debug/sentry)");
  } catch (e) {
    Sentry.captureException(e);
    await Sentry.flush(2000);
    throw e;
  }
}
