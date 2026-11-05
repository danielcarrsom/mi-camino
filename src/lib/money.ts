import type { Repeat } from "./catalog";
import type { Lang } from "./i18n";

const WEEKS_PER_MONTH = 52 / 12;

/** How much an amount that repeats every `repeat` adds up to in one month. */
export function toMonthly(amount: number, repeat: Repeat): number {
  switch (repeat) {
    case "week":
      return amount * WEEKS_PER_MONTH;
    case "2weeks":
      return (amount * 26) / 12;
    case "month":
      return amount;
    default:
      return 0; // one-time amounts are counted in the week they happen
  }
}

export function toWeekly(amount: number, repeat: Repeat): number {
  return toMonthly(amount, repeat) / WEEKS_PER_MONTH;
}

export function money(n: number, lang: Lang = "es", cents = false): string {
  const locale = lang === "en" ? "en-US" : "es-MX";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(Math.round(n * (cents ? 100 : 1)) / (cents ? 100 : 1));
}

/** Words for reading a dollar amount aloud. */
export function moneySpoken(n: number, lang: Lang = "es"): string {
  const whole = Math.round(n);
  return lang === "en" ? `${whole} dollars` : `${whole} dólares`;
}

export function startOfWeek(d = new Date()): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

export function isThisWeek(iso: string): boolean {
  const t = new Date(iso).getTime();
  const s = startOfWeek().getTime();
  return t >= s && t < s + 7 * 86400000;
}

export function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function shortDate(iso: string, lang: Lang = "es"): string {
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { day: "numeric", month: "short" });
}
