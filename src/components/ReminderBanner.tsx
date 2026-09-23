import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function ReminderBanner() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const threshold = user?.reminderThreshold ?? 7;

  const last = await prisma.workShift.findFirst({
    where: { userId },
    orderBy: { startDate: "desc" },
    select: { startDate: true },
  });

  const now = new Date();
  const daysSince = last
    ? Math.floor((now.getTime() - last.startDate.getTime()) / 86400000)
    : null;
  const show = daysSince === null || daysSince >= threshold;
  if (!show) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:flex-row sm:items-center dark:border-amber-500/30 dark:bg-amber-500/10">
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
            {daysSince === null
              ? "Bienvenue ! Pointe ta première vacation."
              : `Aucune vacation depuis ${daysSince} jour${daysSince > 1 ? "s" : ""} — pense à pointer.`}
          </p>
          <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/70">
            Un pointage régulier fiabilise tes totaux et ton salaire estimé.
          </p>
        </div>
        <Link
          href="/shifts/new"
          className="shrink-0 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700"
        >
          Pointer maintenant
        </Link>
      </div>
    </div>
  );
}
