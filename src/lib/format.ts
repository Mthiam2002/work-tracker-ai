// Formatage partagé (pur, utilisé côté serveur ET client).
const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function hoursLabel(h: number) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
}

export function eurLabel(n: number) {
  return eur.format(n);
}

export type NumberFormat = "hours" | "currency" | "raw";

export function formatNumber(value: number, kind: NumberFormat): string {
  if (kind === "hours") return hoursLabel(value);
  if (kind === "currency") return eurLabel(value);
  return String(Math.round(value));
}
