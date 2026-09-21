// Calcul paie v2 : base + majorations nuit / dimanche / férié (cumulables).
// Tranche de 15 min pour répartir les heures à cheval (ex: nuit + dimanche).

export type PremiumConfig = {
  nightMult: number;
  sundayMult: number;
  holidayMult: number;
  nightStart: number; // heure locale 0-23
  nightEnd: number;
};

export const DEFAULT_PREMIUMS: PremiumConfig = {
  nightMult: 0.2,
  sundayMult: 0.2,
  holidayMult: 1.0,
  nightStart: 21,
  nightEnd: 6,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dayKey(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// Pâques (algorithme de Meeus) -> lundi de Pâques, Ascension, lundi de Pentecôte
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 ou 4
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

export function getFrenchHolidays(year: number): Set<string> {
  const keys = new Set<string>();
  const fixed = [
    `${year}-01-01`,
    `${year}-05-01`,
    `${year}-05-08`,
    `${year}-07-14`,
    `${year}-08-15`,
    `${year}-11-01`,
    `${year}-11-11`,
    `${year}-12-25`,
  ];
  fixed.forEach((k) => keys.add(k));

  const easter = easterSunday(year);
  const add = (base: Date, days: number) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + days);
    keys.add(dayKey(d));
  };
  add(easter, 1); // lundi de Pâques
  add(easter, 39); // Ascension
  add(easter, 50); // lundi de Pentecôte
  return keys;
}

function isNightHour(hour: number, start: number, end: number) {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end; // fenêtre à cheval (ex 21h-6h)
}

export function computePay(
  start: Date,
  end: Date,
  rate: number,
  cfg: PremiumConfig = DEFAULT_PREMIUMS
) {
  const totalHours = (end.getTime() - start.getTime()) / 3600000;
  if (totalHours <= 0) {
    return { totalHours: 0, nightHours: 0, sundayHours: 0, holidayHours: 0, premiumPay: 0, estimatedPay: 0 };
  }

  // Cache jours fériés par année traversée
  const years = new Set([start.getUTCFullYear(), end.getUTCFullYear()]);
  const holidays = new Set<string>();
  years.forEach((y) => getFrenchHolidays(y).forEach((k) => holidays.add(k)));

  const STEP_MIN = 15;
  let night = 0;
  let sunday = 0;
  let holiday = 0;

  for (let t = start.getTime(); t < end.getTime(); t += STEP_MIN * 60000) {
    const sliceEnd = Math.min(t + STEP_MIN * 60000, end.getTime());
    const h = (sliceEnd - t) / 3600000;
    const d = new Date(t);
    if (isNightHour(d.getUTCHours(), cfg.nightStart, cfg.nightEnd)) night += h;
    if (d.getUTCDay() === 0) sunday += h;
    if (holidays.has(dayKey(d))) holiday += h;
  }

  const premiumPay =
    night * rate * cfg.nightMult +
    sunday * rate * cfg.sundayMult +
    holiday * rate * cfg.holidayMult;

  return {
    totalHours,
    nightHours: night,
    sundayHours: sunday,
    holidayHours: holiday,
    premiumPay,
    estimatedPay: totalHours * rate + premiumPay,
  };
}
