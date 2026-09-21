import { requireAuth } from "@/lib/require-auth";
import Link from "next/link";
import { getMonthShifts } from "../dashboard/dashboard-queries";
import { getNetRatio } from "../settings/settings-actions";
import { brutToNet } from "@/lib/salary";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const TZ = "UTC"; // heures murales : affichage identique partout
const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: TZ });

function hoursLabel(h: number) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
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
  const byDay = new Map<number, typeof shifts>();
  for (const s of shifts) {
    const day = s.startDate.getUTCDate();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(s);
  }

  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadBlanks = (first.getUTCDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array<null>(leadBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthHours = shifts.reduce((a, s) => a + s.totalHours, 0);
  const monthPay = shifts.reduce((a, s) => a + s.estimatedPay, 0);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour au tableau de bord
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight capitalize">{monthLabel.format(new Date(Date.UTC(year, month - 1, 1)))}</h1>
            <p className="mt-2 text-[15px] text-zinc-600 dark:text-zinc-400">
              {shifts.length} vacation{shifts.length > 1 ? "s" : ""} · {hoursLabel(monthHours)} · {eur.format(monthPay)} brut (≈ {eur.format(brutToNet(monthPay, netRatio))} net)
            </p>
          </div>
          <div className="flex gap-2.5">
            <Link
              href={`/calendar?year=${prev.year}&month=${prev.month}`}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
            >
              ← Mois précédent
            </Link>
            <Link
              href={`/calendar?year=${next.year}&month=${next.month}`}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-100 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
            >
              Mois suivant →
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-zinc-500 sm:gap-2 dark:text-zinc-400">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {cells.map((day, i) =>
              day === null ? (
                <div key={i} className="min-h-20 rounded-2xl sm:min-h-24" />
              ) : (
                <div
                  key={i}
                  className={`min-h-20 rounded-2xl border p-2 text-left sm:min-h-24 sm:p-2.5 ${
                    byDay.has(day)
                      ? "border-blue-500/40 bg-blue-50/60 dark:border-blue-500/30 dark:bg-blue-500/10"
                      : "border-zinc-100 bg-zinc-50/60 dark:border-white/5 dark:bg-white/[0.02]"
                  }`}
                >
                  <span className="text-xs font-semibold sm:text-sm">{day}</span>
                  {(byDay.get(day) ?? []).map((s) => (
                    <div key={s.id} className="mt-1 rounded-lg bg-blue-600 px-1.5 py-1 text-[10px] font-medium leading-tight text-white sm:text-[11px]">
                      {hoursLabel(s.totalHours)} · {eur.format(s.estimatedPay)}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-base font-semibold tracking-tight">Détail du mois</h2>
          {shifts.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Aucune vacation ce mois-ci.{" "}
              <Link href="/shifts/new" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                En pointer une →
              </Link>
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100 dark:divide-white/10">
              {shifts.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(s.startDate)}
                    </span>{" "}
                    <span className="text-zinc-500 dark:text-zinc-400">
                      · {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(s.startTime)} →{" "}
                      {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(s.endTime)}
                      {s.endDate.getTime() !== s.startDate.getTime() ? " (+1j)" : ""}
                    </span>
                  </p>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {hoursLabel(s.totalHours)} · {eur.format(s.estimatedPay)} brut (≈ {eur.format(brutToNet(s.estimatedPay, netRatio))} net)
                    </span>
                    <Link
                      href={`/shifts/${s.id}/edit`}
                      className="rounded-full px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                    >
                      Modifier
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
