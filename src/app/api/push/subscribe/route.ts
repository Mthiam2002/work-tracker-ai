import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Enregistre l'abonnement push du navigateur courant. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { endpoint?: string; p256dh?: string; auth?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  if (typeof body.endpoint !== "string" || !body.endpoint.startsWith("https://")) {
    return NextResponse.json({ error: "Endpoint invalide." }, { status: 400 });
  }
  if (typeof body.p256dh !== "string" || typeof body.auth !== "string") {
    return NextResponse.json({ error: "Clés invalides." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: { userId, p256dh: body.p256dh, auth: body.auth },
    create: { userId, endpoint: body.endpoint, p256dh: body.p256dh, auth: body.auth },
  });

  return NextResponse.json({ ok: true });
}

/** Supprime l'abonnement push (cet appareil ne reçoit plus les rappels). */
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  if (typeof body.endpoint === "string") {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId } });
  }
  return NextResponse.json({ ok: true });
}
