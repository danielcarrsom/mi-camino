// What really reaches your pocket: an estimate of the taxes taken out of a paycheck.
// Tax year 2026 figures:
// - Federal: IRS Rev. Proc. 2025-32 (standard deduction $16,100 single / $32,200 married jointly)
// - Social Security 6.2% up to $184,500 a year; Medicare 1.45%
// - New York State: 2026 rate schedule (Form IT-2105-I); standard deduction $8,000 single / $16,050 married
// - New York City resident tax: 3.078% – 3.876%
// It's an estimate (one job, standard deduction, no credits). The paystub has the real number.

export type TaxMode = "withheld" | "cash" | "net";
export type TaxPlace = "nyc" | "ny" | "other";
export type WorkTax = { mode: TaxMode; place: TaxPlace; married?: boolean };
export const DEFAULT_TAX: WorkTax = { mode: "withheld", place: "nyc", married: false };

type Bracket = [upTo: number, rate: number];

const FED_SINGLE: Bracket[] = [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]];
const FED_MARRIED: Bracket[] = [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]];
const FED_STD = { single: 16100, married: 32200 };

const NY_SINGLE: Bracket[] = [[8500, 0.039], [11700, 0.044], [13900, 0.0515], [80650, 0.054], [215400, 0.059], [1077550, 0.0685], [5000000, 0.0965], [25000000, 0.103], [Infinity, 0.109]];
// Married-joint thresholds are close to double the single ones; good enough for an estimate.
const NY_MARRIED: Bracket[] = NY_SINGLE.map(([u, r]) => [u === Infinity ? Infinity : u * 2, r]);
const NY_STD = { single: 8000, married: 16050 };

const NYC_SINGLE: Bracket[] = [[12000, 0.03078], [25000, 0.03762], [50000, 0.03819], [Infinity, 0.03876]];
const NYC_MARRIED: Bracket[] = [[21600, 0.03078], [45000, 0.03762], [90000, 0.03819], [Infinity, 0.03876]];

const SS_RATE = 0.062, SS_BASE = 184500, MEDICARE = 0.0145;

function progressive(income: number, brackets: Bracket[]): number {
  let tax = 0, last = 0;
  for (const [upTo, rate] of brackets) {
    if (income <= last) break;
    tax += (Math.min(income, upTo) - last) * rate;
    last = upTo;
  }
  return tax;
}

export type TaxBreakdown = { federal: number; socialSecurity: number; medicare: number; state: number; city: number; total: number; net: number; rate: number };

/** Yearly taxes taken from a paycheck for a given yearly gross pay. */
export function yearlyTaxes(gross: number, place: TaxPlace, married = false): TaxBreakdown {
  const k = married ? "married" : "single";
  const federal = progressive(Math.max(0, gross - FED_STD[k]), married ? FED_MARRIED : FED_SINGLE);
  const socialSecurity = Math.min(gross, SS_BASE) * SS_RATE;
  const medicare = gross * MEDICARE;
  const nyTaxable = Math.max(0, gross - NY_STD[k]);
  const state = place === "other" ? 0 : progressive(nyTaxable, married ? NY_MARRIED : NY_SINGLE);
  const city = place === "nyc" ? progressive(nyTaxable, married ? NYC_MARRIED : NYC_SINGLE) : 0;
  const total = federal + socialSecurity + medicare + state + city;
  return { federal, socialSecurity, medicare, state, city, total, net: gross - total, rate: gross > 0 ? total / gross : 0 };
}

/** Same thing per week, which is how people think about their pay. */
export function weeklyTaxes(weeklyGross: number, tax: WorkTax = DEFAULT_TAX): TaxBreakdown {
  const y = yearlyTaxes(weeklyGross * 52, tax.place, tax.married);
  const w = (n: number) => n / 52;
  return { federal: w(y.federal), socialSecurity: w(y.socialSecurity), medicare: w(y.medicare), state: w(y.state), city: w(y.city), total: w(y.total), net: w(y.net), rate: y.rate };
}

/** For people paid in cash or without withholding: roughly what they may owe when filing
 *  (income tax plus self-employment tax), to set aside each week. */
export function cashSetAsideWeekly(weeklyGross: number, tax: WorkTax = DEFAULT_TAX): number {
  const yearly = weeklyGross * 52;
  const se = yearly * 0.9235 * 0.153;              // Social Security + Medicare for self-employed
  const income = yearlyTaxes(Math.max(0, yearly - se / 2), tax.place, tax.married);
  const incomeOnly = income.federal + income.state + income.city;
  return (se + incomeOnly) / 52;
}

/** What actually reaches the person each week from this job. */
export function takeHomeWeekly(weeklyGross: number, tax: WorkTax | undefined): number {
  const t = tax ?? DEFAULT_TAX;
  if (t.mode === "withheld") return weeklyTaxes(weeklyGross, t).net;
  return weeklyGross; // "net": already what arrives; "cash": nothing withheld (but see cashSetAsideWeekly)
}
