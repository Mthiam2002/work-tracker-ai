import { requireAuth } from "@/lib/require-auth";
import Link from "next/link";
import { getMonthShifts } from "../dashboard/dashboard-queries";
import { getNetRatio } from "../settings/settings-actions";
import { brutToNet } from "@/lib/salary";
import { CalendarView } from "@/components/CalendarView";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const TZ = "UTC";
const monthLabelFmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: TZ });

function hoursLabel(h: number) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  await requireAuth("/calendar");
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const shifts = await getMonthShifts(year, month);
  const netRatio = await getNetRatio();

  const monthHours = shifts.reduce((a, s) => a + s.totalHours, 0);
  const monthPay = shifts.reduce((a, s) => a + s.estimatedPay, 0);
  const label = capitalize(monthLabelFmt.format(new Date(Date.UTC(year, month - 1, 1))));

  const serialized = shifts.map((s) => ({
    id: s.id,
    startDate: s.startDate.toISOString(),
    startTime: s.startTime.toISOString(),
    endDate: s.endDate.toISOString(),
    endTime: s.endTime.toISOString(),
    breakMinutes: s.breakMinutes,
    totalHours: s.totalHours,
    estimatedPay: s.estimatedPay,
  }));

  const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const upcoming = shifts.filter((s) => s.startDate >= startOfTodayUTC).slice(0, 4);

  const fmtDayBadge = (d: Date) => ({
    wd: new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: TZ }).format(d).replace(".", ""),
    num: d.getUTCDate(),
    mon: new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: TZ }).format(d).replace(".", ""),
  });
  const fmtHM = (d: Date) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(d);

  void brutToNet;

  return (
    <main className="mt-4">
      {/* Colonne centrale */}
      <div className="min-w-0">
        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-2xl text-white shadow-[0_1px_2px_rgba(16,42,80,0.12)] motion-safe:animate-[card-in_500ms_ease-out_both]"
          style={{ background: "linear-gradient(120deg, var(--hero-from) 0%, var(--hero-to) 100%)" }}
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-premium/20 blur-3xl" />
          <div className="relative p-6 sm:p-7">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12.5px] font-medium text-white backdrop-blur transition hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Retour au tableau de bord
            </Link>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-white/70">Calendrier</p>
                <h1 className="mt-1 flex items-center gap-2.5 text-[30px] font-extrabold leading-none tracking-tight sm:text-[34px]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-8 w-8">
                    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
                  </svg>
                  {label}
                </h1>
                <p className="mt-2 max-w-[420px] text-[12.5px] leading-snug text-white/75">
                  Suivez vos heures, vos revenus et vos prochaines vacations en un coup d&apos;œil.
                </p>
              </div>
              {/* KPI glass */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end hidden sm:flex">
                <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-right backdrop-blur-sm">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/65">Vacations ce mois</p>
                  <p className="tnum mt-1 text-[22px] font-extrabold leading-none">{shifts.length}</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-right backdrop-blur-sm">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/65">Brut estimé</p>
                  <p className="tnum mt-1 text-[22px] font-extrabold leading-none">{eur.format(monthPay)}</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-right backdrop-blur-sm">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/65">Heures totales</p>
                  <p className="tnum mt-1 text-[22px] font-extrabold leading-none">{hoursLabel(monthHours)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4">
          <CalendarView
            key={`${year}-${month}`}
            shifts={serialized}
            year={year}
            month={month}
            monthLabel={label}
            prevHref={`/calendar?year=${prev.year}&month=${prev.month}`}
            nextHref={`/calendar?year=${next.year}&month=${next.month}`}
            netRatio={netRatio}
          />
        </div>

        {/* Prochains jours */}
        <section className="motion-safe:animate-[card-in_500ms_ease-out_both] mt-4 rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(16,42,80,0.06)] dark:shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-card-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-accent">
                <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                <path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
              </svg>
              Prochains jours
            </h2>
            <Link href="/dashboard" className="text-[11.5px] font-semibold text-accent transition hover:underline">
              Voir tout →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-3 rounded-xl bg-muted p-4 text-center text-[12px] text-muted-foreground">
              Aucune vacation à venir ce mois-ci.
            </p>
          ) : (
            <ul className="mt-1 divide-y divide-border">
              {upcoming.map((s) => {
                const b = fmtDayBadge(s.startDate);
                return (
                  <li key={s.id} className="motion-safe:animate-[card-in_450ms_ease-out_both]">
                    <div className="flex items-center gap-3 py-3 transition hover:bg-muted/50 group">
                      <span className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-accent/12 py-1.5">
                        <span className="text-[10px] font-medium capitalize text-accent">{b.wd}</span>
                        <span className="text-[19px] font-extrabold leading-none text-card-foreground">{b.num}</span>
                        <span className="text-[10px] capitalize text-muted-foreground">{b.mon}.</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="tnum truncate text-[12.5px] font-bold text-card-foreground group-hover:text-accent">
                            {hoursLabel(s.totalHours)} - {eur.format(s.estimatedPay)}
                          </span>
                          <span className="shrink-0 rounded-md bg-accent/12 px-2 py-0.5 text-[10.5px] font-bold text-accent transition group-hover:bg-accent/20">
                            Vacation
                          </span>
                        </span>
                        <span className="mt-0.5 block tnum text-[11px] text-muted-foreground">
                          {fmtHM(s.startTime)} → {fmtHM(s.endTime)} • {hoursLabel(s.totalHours)}
                        </span>
                      </span>
                      <span className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent">›</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
