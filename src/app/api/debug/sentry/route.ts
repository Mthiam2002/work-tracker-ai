export const dynamic = "force-dynamic";

/** Route temporaire de diagnostic : lève volontairement une erreur pour vérifier Sentry côté serveur. */
export async function GET() {
  throw new Error("Test Sentry serveur (route /api/debug/sentry)");
}
