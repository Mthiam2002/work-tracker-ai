import { requireAuth } from "@/lib/require-auth";
import Link from "next/link";
import { getMonthShifts } from "../dashboard/dashboard-queries";
import { getNetRatio } from "../settings/settings-actions";
import { brutToNet } from "@/lib/salary";
import { CalendarView } from "@/components/CalendarView";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const TZ = "UTC"; // heures murales : affichage identique partout
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
    <main className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      {/* Colonne centrale */}
      <div className="min-w-0">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-[#16294a] text-white shadow-[0_1px_2px_rgba(16,42,80,0.2)]">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgba(10,22,44,0.92) 25%, rgba(22,45,85,0.55) 55%, rgba(22,45,85,0.15) 80%), url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1600&auto=format&fit=crop') center/cover",
            }}
          />
          <div className="relative p-6 sm:p-7">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-[12.5px] font-medium text-white backdrop-blur transition hover:bg-black/50"
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
              <div className="flex items-center gap-5 rounded-2xl bg-black/35 px-5 py-3.5 backdrop-blur">
                <span className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6ea8ff" strokeWidth={1.8} className="h-6 w-6">
                    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
                  </svg>
                  <span>
                    <span className="block text-[14px] font-bold">{shifts.length} vacation{shifts.length > 1 ? "s" : ""}</span>
                    <span className="block text-[11px] text-white/60">ce mois-ci</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#6ea8ff] text-[11px] font-bold text-[#6ea8ff]">
                    €
                  </span>
                  <span>
                    <span className="block text-[14px] font-bold">{eur.format(monthPay)}</span>
                    <span className="block text-[11px] text-white/60">brut estimé</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6ea8ff" strokeWidth={1.8} className="h-6 w-6">
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="M12 7.5V12l3 2" strokeLinecap="round" />
                  </svg>
                  <span>
                    <span className="block text-[14px] font-bold">{hoursLabel(monthHours)}</span>
                    <span className="block text-[11px] text-white/60">total estimé</span>
                  </span>
                </span>
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
      </div>

      {/* Rail droit */}
      <div className="flex min-w-0 flex-col gap-5">
        <section className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(16,42,80,0.06)] dark:bg-zinc-950 dark:border dark:border-white/10 dark:shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-[#16233a] dark:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-[#1d6ff2]">
                <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                <path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
              </svg>
              Prochains jours
            </h2>
            <Link href="/dashboard" className="text-[11.5px] font-semibold text-[#1d6ff2]">
              Voir tout →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-3 rounded-xl bg-[#f3f6fb] p-4 text-center text-[12px] text-[#8a97ad] dark:bg-white/5">
              Aucune vacation à venir ce mois-ci.
            </p>
          ) : (
            <ul className="mt-1 divide-y divide-[#f1f4f9] dark:divide-white/5">
              {upcoming.map((s) => {
                const b = fmtDayBadge(s.startDate);
                return (
                  <li key={s.id}>
                    <div className="flex items-center gap-3 py-3">
                      <span className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-[#eef4ff] py-1.5 dark:bg-white/5">
                        <span className="text-[10px] font-medium capitalize text-[#5b6b82] dark:text-zinc-400">{b.wd}</span>
                        <span className="text-[19px] font-extrabold leading-none text-[#16233a] dark:text-white">{b.num}</span>
                        <span className="text-[10px] capitalize text-[#8a97ad]">{b.mon}.</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[12.5px] font-bold text-[#16233a] dark:text-white">
                            {hoursLabel(s.totalHours)} - {eur.format(s.estimatedPay)}
                          </span>
                          <span className="shrink-0 rounded-md bg-[#e8f0fd] px-2 py-0.5 text-[10.5px] font-bold text-[#1d5dbf]">
                            Vacation
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[11px] text-[#8a97ad]">
                          {fmtHM(s.startTime)} → {fmtHM(s.endTime)} • {hoursLabel(s.totalHours)}
                        </span>
                      </span>
                      <span className="text-[#9aa7bc]">›</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="relative min-h-[240px] overflow-hidden rounded-2xl text-white shadow-[0_1px_2px_rgba(16,42,80,0.2)]">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(20,35,90,0.55) 0%, rgba(20,35,90,0.15) 45%, rgba(10,20,45,0.55) 100%), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop') center/cover",
            }}
          />
          <div className="relative flex min-h-[240px] flex-col p-5">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-white/85">
              <span className="text-[15px]">🌴</span> Prochaine pause
            </p>
            <p className="mt-2 text-[21px] font-extrabold leading-tight">
              Profitez de vos
              <br />
              vacances !
            </p>
            <p className="mt-1 text-[11.5px] text-white/80">
              Vous avez {shifts.length} vacation{shifts.length > 1 ? "s" : ""} ce mois-ci.
            </p>
            <a
              href="#detail-mois"
              className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/50 px-4 py-2 text-[12px] font-semibold backdrop-blur transition hover:bg-white/15"
            >
              Voir le détail →
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
