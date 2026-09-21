import type { MonthPoint } from "@/app/(protected)/dashboard/dashboard-queries";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function hoursLabel(h: number) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
}

export function MonthlyChart({ points }: { points: MonthPoint[] }) {
  const maxPay = Math.max(1, ...points.map((p) => p.pay));

  return (
    <section className="mt-4 rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold tracking-tight">Évolution — 6 derniers mois</h2>
        <span className="text-xs text-zinc-500">Salaire estimé / mois</span>
      </div>
      {points.every((p) => p.count === 0) ? (
        <p className="mt-4 text-sm text-zinc-500">
          Pas encore de données. Pointe des vacations pour voir ta courbe ici.
        </p>
      ) : (
        <div className="mt-6 flex items-end gap-2 sm:gap-3" role="img" aria-label="Évolution du salaire estimé par mois">
          {points.map((p, i) => {
            const height = p.pay > 0 ? Math.max(6, Math.round((p.pay / maxPay) * 160)) : 4;
            const isCurrent = i === points.length - 1;
            return (
              <div key={p.key} className="flex flex-1 flex-col items-center gap-2" title={`${p.label} : ${hoursLabel(p.hours)} · ${eur.format(p.pay)}`}>
                <span className="text-[11px] font-medium text-zinc-500 sm:text-xs">
                  {p.pay > 0 ? eur.format(p.pay) : "—"}
                </span>
                <div
                  style={{ height }}
                  className={`w-full rounded-t-xl transition ${
                    isCurrent ? "bg-blue-600" : "bg-blue-600/35"
                  }`}
                />
                <span className={`text-[11px] capitalize sm:text-xs ${isCurrent ? "font-semibold" : "text-zinc-500"}`}>
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
