import { HourlyRateForm } from "@/components/HourlyRateForm";
import { NetRatioForm } from "@/components/NetRatioForm";
import { PushReminderToggle } from "@/components/PushReminderToggle";
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
    <main className="mt-4">
      <div className="min-w-0">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-[12.5px] font-medium text-accent backdrop-blur transition hover:bg-accent/15"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour au tableau de bord
        </Link>

        <div className="mt-4 motion-safe:animate-[card-in_500ms_ease-out_both]">
          <h1 className="text-[30px] font-extrabold tracking-tight text-card-foreground">Paramètres</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">
            Taux horaire historisé, majorations et rappels. Les vacations passées gardent leur taux d&apos;origine.
          </p>
        </div>

        <div className="mt-4 grid gap-4 motion-safe:animate-[card-in_500ms_ease-out_both]">
          {/* Taux horaire */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:shadow-none">
            <h2 className="text-[15px] font-bold text-card-foreground">Taux horaire</h2>
            <p className="mt-1 text-sm text-muted-foreground">Actuel : {s.rate.toFixed(2)} €/h brut (≈ {brutToNet(s.rate, s.netRatio).toFixed(2)} €/h net)</p>
            <div className="mt-4">
              <HourlyRateForm initialRate={s.rate} />
            </div>
            {s.history.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[12.5px] font-semibold text-muted-foreground">Historique</h3>
                <ul className="mt-2 divide-y divide-border">
                  {s.history.map((h) => (
                    <li key={h.id} className="flex justify-between py-2">
                      <span className="text-sm text-muted-foreground">{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(h.validFrom)}</span>
                      <span className="tnum font-semibold text-card-foreground">{h.rate.toFixed(2)} €/h brut (≈ {brutToNet(h.rate, s.netRatio).toFixed(2)} €/h net)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Conversion brut → net */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:shadow-none">
            <h2 className="text-[15px] font-bold text-card-foreground">Conversion brut → net</h2>
            <p className="mt-1 text-sm text-muted-foreground">Actuellement : net ≈ {(s.netRatio * 100).toFixed(1).replace(".", ",")} % du brut.</p>
            <div className="mt-4">
              <NetRatioForm initialRatio={s.netRatio} />
            </div>
          </section>

          {/* Majorations */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:shadow-none">
            <h2 className="text-[15px] font-bold text-card-foreground">Majorations nuit / dimanche / férié</h2>
            <div className="mt-4">
              <PremiumsForm initial={{ nightMult: s.nightMult, sundayMult: s.sundayMult, holidayMult: s.holidayMult, nightStart: s.nightStart, nightEnd: s.nightEnd, overtimeMult: s.overtimeMult }} />
            </div>
          </section>

          {/* Rappels */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:p-6 dark:shadow-none">
            <h2 className="text-[15px] font-bold text-card-foreground">Rappels d&apos;oubli</h2>
            <div className="mt-4">
              <ReminderSettingsForm initial={{ enabled: s.reminderEnabled, threshold: s.reminderThreshold }} />
            </div>
            <div className="mt-6 border-t border-border pt-5">
              <PushReminderToggle />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
