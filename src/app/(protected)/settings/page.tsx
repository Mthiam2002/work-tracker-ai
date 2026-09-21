import { HourlyRateForm } from "@/components/HourlyRateForm";
import { NetRatioForm } from "@/components/NetRatioForm";
import { PremiumsForm } from "@/components/PremiumsForm";
import { ReminderSettingsForm } from "@/components/ReminderSettingsForm";
import { requireAuth } from "@/lib/require-auth";
import { brutToNet } from "@/lib/salary";
import Link from "next/link";
import { getUserSettings } from "./settings-actions";

export default async function SettingsPage() {
  await requireAuth("/settings");
  const s = await getUserSettings();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          Retour au tableau de bord
        </Link>

        <div className="mt-6">
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Paramètres</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
            Taux horaire historisé, majorations et rappels. Les vacations passées gardent leur taux d&apos;origine.
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-base font-semibold">Taux horaire — actuel : {s.rate.toFixed(2)} €/h brut (≈ {brutToNet(s.rate, s.netRatio).toFixed(2)} €/h net)</h2>
            <div className="mt-4">
              <HourlyRateForm initialRate={s.rate} />
            </div>
            {s.history.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold">Historique</h3>
                <ul className="mt-2 divide-y divide-zinc-100 text-sm dark:divide-white/10">
                  {s.history.map((h) => (
                    <li key={h.id} className="flex justify-between py-2">
                      <span>{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(h.validFrom)}</span>
                      <span className="font-semibold">{h.rate.toFixed(2)} €/h brut (≈ {brutToNet(h.rate, s.netRatio).toFixed(2)} €/h net)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-base font-semibold">Conversion brut → net</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Actuellement : net ≈ {(s.netRatio * 100).toFixed(1).replace(".", ",")} % du brut.</p>
            <div className="mt-4">
              <NetRatioForm initialRatio={s.netRatio} />
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-base font-semibold">Majorations nuit / dimanche / férié</h2>
            <div className="mt-4">
              <PremiumsForm initial={{ nightMult: s.nightMult, sundayMult: s.sundayMult, holidayMult: s.holidayMult, nightStart: s.nightStart, nightEnd: s.nightEnd }} />
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-base font-semibold">Rappels d&apos;oubli</h2>
            <div className="mt-4">
              <ReminderSettingsForm initial={{ enabled: s.reminderEnabled, threshold: s.reminderThreshold }} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
