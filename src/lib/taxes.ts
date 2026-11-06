// What really reaches your pocket: an estimate of the taxes taken out of a paycheck.
//
// United States, tax year 2026:
// - Federal: IRS Rev. Proc. 2025-32 (standard deduction $16,100 single / $32,200 married jointly)
// - Social Security 6.2% up to $184,500 a year; Medicare 1.45%
// - States: Tax Foundation, "State Individual Income Tax Rates and Brackets, 2026" (as of Jan 1, 2026)
// - New York City resident tax 3.078% – 3.876%; Maryland county tax (all counties) ~3%
//
// México, 2026:
// - ISR: tarifa mensual del Art. 96 LISR, Anexo 8 RMF 2026
// - Subsidio para el empleo 2026: 15.02% de la UMA mensual ($535.65) si ganas hasta $11,492.66 al mes
// - Salario mínimo 2026: $315.04 al día (general), $440.87 (frontera norte): no se retiene ISR,
//   y el patrón paga la cuota del IMSS del trabajador (Art. 36 LSS)
// - Cuota obrera del IMSS: 0.25% + 0.375% + 0.625% + 1.125% y 0.40% sobre lo que pase de 3 UMA
// - RESICO personas físicas: 1% a 2.5% de lo que cobras
//
// It's an estimate (one job, standard deduction, no credits). The paystub or recibo de nómina has the real number.

import type { Lang } from "./i18n";

export type TaxMode = "withheld" | "cash" | "net";
/** Old per-job place field, kept only so saved data still loads. */
export type TaxPlace = "nyc" | "ny" | "other";
export type WorkTax = { mode: TaxMode; place?: TaxPlace; married?: boolean };
export const DEFAULT_TAX: WorkTax = { mode: "withheld" };

/** Where the person lives: decides the taxes and the money. */
export type Region = { country: "us" | "mx"; state?: string; nyc?: boolean; married?: boolean };
export const DEFAULT_REGION: Region = { country: "us", state: "NY", nyc: true, married: false };

type Bracket = [from: number, rate: number]; // rate applies to income above `from`

function progressive(income: number, brackets: Bracket[]): number {
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const [from, rate] = brackets[i];
    const to = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    if (income <= from) break;
    tax += (Math.min(income, to) - from) * rate;
  }
  return tax;
}

// ---------- United States ----------

const FED_SINGLE: Bracket[] = [[0, 0.10], [12400, 0.12], [50400, 0.22], [105700, 0.24], [201775, 0.32], [256225, 0.35], [640600, 0.37]];
const FED_MARRIED: Bracket[] = [[0, 0.10], [24800, 0.12], [100800, 0.22], [211400, 0.24], [403550, 0.32], [512450, 0.35], [768700, 0.37]];
const FED_STD = { single: 16100, married: 32200 };
const SS_RATE = 0.062, SS_BASE = 184500, MEDICARE = 0.0145;

/** One state's 2026 income tax. `ex` = personal exemption (taken off income); `credit` = taken off the tax. */
type StateTax = {
  name: string;
  s?: Bracket[]; m?: Bracket[];            // single / married jointly (m missing = same as single)
  std?: [number, number]; ex?: [number, number]; credit?: [number, number];
  local?: number;                           // tax every county or city charges on top (Maryland)
};
const flat = (r: number, from = 0): Bracket[] => [[from, r]];
const pct = (rows: [number, number][]): Bracket[] => rows.map(([f, r]) => [f, r / 100]);

export const US_STATES: Record<string, StateTax> = {
  AL: { name: "Alabama", s: pct([[0, 2], [500, 4], [3000, 5]]), m: pct([[0, 2], [1000, 4], [6000, 5]]), std: [3000, 8500], ex: [1500, 3000] },
  AK: { name: "Alaska" },
  AZ: { name: "Arizona", s: flat(0.025), std: [8350, 16700] },
  AR: { name: "Arkansas", s: pct([[0, 2], [4600, 3.9]]), std: [2470, 4940], credit: [29, 58] },
  CA: { name: "California", s: pct([[0, 1], [11079, 2], [26264, 4], [41452, 6], [57542, 8], [72724, 9.3], [371479, 10.3], [445771, 11.3], [742953, 12.3], [1000000, 13.3]]), m: pct([[0, 1], [22158, 2], [52528, 4], [82904, 6], [115084, 8], [145448, 9.3], [742958, 10.3], [891542, 11.3], [1000000, 12.3], [1485906, 13.3]]), std: [5540, 11080], credit: [153, 306] },
  CO: { name: "Colorado", s: flat(0.044), std: [16100, 32200] },
  CT: { name: "Connecticut", s: pct([[0, 2], [10000, 4.5], [50000, 5.5], [100000, 6], [200000, 6.5], [250000, 6.9], [500000, 6.99]]), m: pct([[0, 2], [20000, 4.5], [100000, 5.5], [200000, 6], [400000, 6.5], [500000, 6.9], [1000000, 6.99]]), ex: [15000, 24000] },
  DE: { name: "Delaware", s: pct([[0, 0], [2000, 2.2], [5000, 3.9], [10000, 4.8], [20000, 5.2], [25000, 5.55], [60000, 6.6]]), std: [3250, 6500], credit: [110, 220] },
  DC: { name: "Washington D. C.", s: pct([[0, 4], [10000, 6], [40000, 6.5], [60000, 8.5], [250000, 9.25], [500000, 9.75], [1000000, 10.75]]), std: [16100, 32200] },
  FL: { name: "Florida" },
  GA: { name: "Georgia", s: flat(0.0519), std: [12000, 24000] },
  HI: { name: "Hawái", s: pct([[0, 1.4], [9600, 3.2], [14400, 5.5], [19200, 6.4], [24000, 6.8], [36000, 7.2], [48000, 7.6], [125000, 7.9], [175000, 8.25], [225000, 9], [275000, 10], [325000, 11]]), m: pct([[0, 1.4], [19200, 3.2], [28800, 5.5], [38400, 6.4], [48000, 6.8], [72000, 7.2], [96000, 7.6], [250000, 7.9], [350000, 8.25], [450000, 9], [550000, 10], [650000, 11]]), std: [4400, 8800], ex: [1144, 2288] },
  ID: { name: "Idaho", s: pct([[0, 0], [4811, 5.3]]), m: pct([[0, 0], [9622, 5.3]]), std: [16100, 32200] },
  IL: { name: "Illinois", s: flat(0.0495), ex: [2925, 5850] },
  IN: { name: "Indiana", s: flat(0.0295), ex: [1000, 2000] },
  IA: { name: "Iowa", s: flat(0.038), std: [16100, 32200], credit: [40, 80] },
  KS: { name: "Kansas", s: pct([[0, 5.2], [23000, 5.58]]), m: pct([[0, 5.2], [46000, 5.58]]), std: [3605, 8240], ex: [9160, 18320] },
  KY: { name: "Kentucky", s: flat(0.035), std: [3360, 3360] },
  LA: { name: "Luisiana", s: flat(0.03), std: [12875, 25750] },
  ME: { name: "Maine", s: pct([[0, 5.8], [27399, 6.75], [64849, 7.15]]), m: pct([[0, 5.8], [54849, 6.75], [129749, 7.15]]), std: [8350, 16700], ex: [5300, 10600] },
  MD: { name: "Maryland", s: pct([[0, 2], [1000, 3], [2000, 4], [3000, 4.75], [100000, 5], [125000, 5.25], [150000, 5.5], [250000, 5.75], [500000, 6.25], [1000000, 6.5]]), m: pct([[0, 2], [1000, 3], [2000, 4], [3000, 4.75], [150000, 5], [175000, 5.25], [225000, 5.5], [300000, 5.75], [600000, 6.25], [1200000, 6.5]]), std: [3350, 6700], ex: [3200, 6400], local: 0.03 },
  MA: { name: "Massachusetts", s: pct([[0, 5], [1083150, 9]]), ex: [4400, 8800] },
  MI: { name: "Michigan", s: flat(0.0425), ex: [5900, 11800] },
  MN: { name: "Minnesota", s: pct([[0, 5.35], [33310, 6.8], [109430, 7.85], [203150, 9.85]]), m: pct([[0, 5.35], [48700, 6.8], [193480, 7.85], [337930, 9.85]]), std: [15300, 30600] },
  MS: { name: "Misisipi", s: pct([[0, 0], [10000, 4]]), std: [2300, 4600], ex: [6000, 12000] },
  MO: { name: "Misuri", s: pct([[0, 0], [1348, 2], [2696, 2.5], [4044, 3], [5392, 3.5], [6740, 4], [8088, 4.5], [9436, 4.7]]), std: [16100, 32200] },
  MT: { name: "Montana", s: pct([[0, 4.7], [47500, 5.65]]), m: pct([[0, 4.7], [95000, 5.65]]), std: [16100, 32200] },
  NE: { name: "Nebraska", s: pct([[0, 2.46], [4130, 3.51], [24760, 4.55]]), m: pct([[0, 2.46], [8250, 3.51], [49530, 4.55]]), std: [8850, 17700], credit: [176, 352] },
  NV: { name: "Nevada" },
  NH: { name: "Nuevo Hampshire" },
  NJ: { name: "Nueva Jersey", s: pct([[0, 1.4], [20000, 1.75], [35000, 3.5], [40000, 5.53], [75000, 6.37], [500000, 8.97], [1000000, 10.75]]), m: pct([[0, 1.4], [20000, 1.75], [50000, 2.45], [70000, 3.5], [80000, 5.53], [150000, 6.37], [500000, 8.97], [1000000, 10.75]]), ex: [1000, 2000] },
  NM: { name: "Nuevo México", s: pct([[0, 1.5], [5500, 3.2], [16500, 4.3], [33500, 4.7], [66500, 4.9], [210000, 5.9]]), m: pct([[0, 1.5], [8000, 3.2], [25000, 4.3], [50000, 4.7], [100000, 4.9], [315000, 5.9]]), std: [16100, 32200] },
  NY: { name: "Nueva York", s: pct([[0, 3.9], [8500, 4.4], [11700, 5.15], [13900, 5.4], [80650, 5.9], [215400, 6.85], [1077550, 9.65], [5000000, 10.3], [25000000, 10.9]]), m: pct([[0, 3.9], [17150, 4.4], [23600, 5.15], [27900, 5.4], [161550, 5.9], [323200, 6.85], [2155350, 9.65], [5000000, 10.3], [25000000, 10.9]]), std: [8000, 16050] },
  NC: { name: "Carolina del Norte", s: flat(0.0399), std: [12750, 25500] },
  ND: { name: "Dakota del Norte", s: pct([[0, 0], [48475, 1.95], [244825, 2.5]]), m: pct([[0, 0], [80975, 1.95], [298075, 2.5]]), std: [16100, 32200] },
  OH: { name: "Ohio", s: pct([[0, 0], [26050, 2.75]]), ex: [2400, 4800] },
  OK: { name: "Oklahoma", s: pct([[0, 0], [3750, 2.5], [4900, 3.5], [7200, 4.5]]), m: pct([[0, 0], [7500, 2.5], [9800, 3.5], [14400, 4.5]]), std: [6350, 12700], ex: [1000, 2000] },
  OR: { name: "Oregón", s: pct([[0, 4.75], [4550, 6.75], [11400, 8.75], [125000, 9.9]]), m: pct([[0, 4.75], [9100, 6.75], [22800, 8.75], [250000, 9.9]]), std: [2910, 5820], credit: [256, 512] },
  PA: { name: "Pensilvania", s: flat(0.0307) },
  RI: { name: "Rhode Island", s: pct([[0, 3.75], [82050, 4.75], [186450, 5.99]]), std: [11200, 22400], ex: [5250, 10500] },
  SC: { name: "Carolina del Sur", s: pct([[0, 0], [3640, 3], [18230, 6]]), std: [8350, 16700] },
  SD: { name: "Dakota del Sur" },
  TN: { name: "Tennessee" },
  TX: { name: "Texas" },
  UT: { name: "Utah", s: flat(0.045), credit: [966, 1932] },
  VT: { name: "Vermont", s: pct([[0, 3.35], [49400, 6.6], [119700, 7.6], [249700, 8.75]]), m: pct([[0, 3.35], [82500, 6.6], [199450, 7.6], [304000, 8.75]]), std: [7650, 15300], ex: [5300, 10600] },
  VA: { name: "Virginia", s: pct([[0, 2], [3000, 3], [5000, 5], [17000, 5.75]]), std: [8750, 17500], ex: [930, 1860] },
  WA: { name: "Washington" },
  WV: { name: "Virginia Occidental", s: pct([[0, 2.22], [10000, 2.96], [25000, 3.33], [40000, 4.44], [60000, 4.82]]), ex: [2000, 4000] },
  WI: { name: "Wisconsin", s: pct([[0, 3.5], [15110, 4.4], [51950, 5.3], [332720, 7.65]]), m: pct([[0, 3.5], [20150, 4.4], [69260, 5.3], [443630, 7.65]]), std: [13960, 25840], ex: [700, 1400] },
  WY: { name: "Wyoming" },
};
/** States, sorted by name, with the ones where most of our people live first. */
export const STATES_FIRST = ["NY", "NJ", "CT", "PA", "CA", "TX", "IL", "FL"];
export const stateName = (code?: string) => (code && US_STATES[code]?.name) || "";
export const hasStateTax = (code?: string) => !!(code && US_STATES[code]?.s);

const NYC_SINGLE: Bracket[] = pct([[0, 3.078], [12000, 3.762], [25000, 3.819], [50000, 3.876]]);
const NYC_MARRIED: Bracket[] = pct([[0, 3.078], [21600, 3.762], [45000, 3.819], [90000, 3.876]]);

function stateTax(gross: number, code: string | undefined, married: boolean): number {
  const st = code ? US_STATES[code] : undefined;
  if (!st?.s) return 0;
  const i = married ? 1 : 0;
  let ex = st.ex?.[i] ?? 0;
  // Connecticut's personal exemption shrinks $1,000 for each $1,000 earned above $30,000 ($48,000 married)
  if (code === "CT") ex = Math.max(0, ex - Math.max(0, Math.ceil((gross - (married ? 48000 : 30000)) / 1000) * 1000));
  const taxable = Math.max(0, gross - (st.std?.[i] ?? 0) - ex);
  const tax = progressive(taxable, (married && st.m) || st.s) - (st.credit?.[i] ?? 0);
  return Math.max(0, tax) + (st.local ? taxable * st.local : 0);
}

// ---------- México ----------

const ISR_MENSUAL: [from: number, fixed: number, rate: number][] = [
  [0.01, 0, 0.0192], [844.6, 16.22, 0.064], [7168.52, 420.95, 0.1088], [12598.03, 1011.68, 0.16],
  [14644.65, 1339.14, 0.1792], [17533.65, 1856.84, 0.2136], [35362.84, 5665.16, 0.2352],
  [55736.69, 10457.09, 0.30], [106410.51, 25659.23, 0.32], [141880.67, 37009.69, 0.34], [425642, 133488.54, 0.35],
];
const SUBSIDIO_EMPLEO = 535.65, SUBSIDIO_TOPE = 11492.66;
const UMA_DIARIA = 117.31;
const SALARIO_MINIMO_DIARIO = 315.04;
const DAYS_PER_MONTH = 30.4;

function isrMensual(monthly: number): number {
  if (monthly <= 0) return 0;
  let row = ISR_MENSUAL[0];
  for (const r of ISR_MENSUAL) if (monthly >= r[0]) row = r;
  const isr = row[1] + (monthly - row[0]) * row[2];
  const subsidio = monthly <= SUBSIDIO_TOPE ? SUBSIDIO_EMPLEO : 0;
  return Math.max(0, isr - subsidio);
}

function imssObrero(monthly: number): number {
  const daily = monthly / DAYS_PER_MONTH;
  if (daily <= SALARIO_MINIMO_DIARIO + 0.01) return 0; // the employer pays it for minimum-wage workers
  const base = 0.0025 + 0.00375 + 0.00625 + 0.01125;
  const excess = Math.max(0, daily - 3 * UMA_DIARIA) * 0.004;
  return (daily * base + excess) * DAYS_PER_MONTH;
}

/** RESICO: what a self-employed person pays on what they charge each month. */
export function resicoRate(monthly: number): number {
  return monthly <= 25000 ? 0.01 : monthly <= 50000 ? 0.011 : monthly <= 83333.33 ? 0.015 : monthly <= 208333.33 ? 0.02 : 0.025;
}

// ---------- Shared ----------

export type TaxPart = { id: string; es: string; en: string; amount: number };
export type TaxBreakdown = { parts: TaxPart[]; total: number; net: number; rate: number };

function breakdown(gross: number, parts: TaxPart[]): TaxBreakdown {
  const kept = parts.filter((p) => p.amount > 0.005);
  const total = kept.reduce((a, p) => a + p.amount, 0);
  return { parts: kept, total, net: gross - total, rate: gross > 0 ? total / gross : 0 };
}

/** Yearly taxes taken from a paycheck for a given yearly gross pay. */
export function yearlyTaxes(gross: number, region: Region = DEFAULT_REGION): TaxBreakdown {
  if (region.country === "mx") {
    const m = gross / 12;
    // minimum-wage workers have no ISR withheld
    const isr = m / DAYS_PER_MONTH <= SALARIO_MINIMO_DIARIO + 0.01 ? 0 : isrMensual(m);
    return breakdown(gross, [
      { id: "isr", es: "ISR (impuesto sobre la renta)", en: "ISR (income tax)", amount: isr * 12 },
      { id: "imss", es: "IMSS (salud y retiro)", en: "IMSS (health and retirement)", amount: imssObrero(m) * 12 },
    ]);
  }
  const married = !!region.married;
  const k = married ? "married" : "single";
  const nyTaxable = Math.max(0, gross - US_STATES.NY.std![married ? 1 : 0]);
  return breakdown(gross, [
    { id: "federal", es: "Impuesto federal", en: "Federal tax", amount: progressive(Math.max(0, gross - FED_STD[k]), married ? FED_MARRIED : FED_SINGLE) },
    { id: "ss", es: "Seguro Social", en: "Social Security", amount: Math.min(gross, SS_BASE) * SS_RATE },
    { id: "medicare", es: "Medicare (salud)", en: "Medicare (health)", amount: gross * MEDICARE },
    { id: "state", es: `Estado de ${stateName(region.state)}`, en: `${stateName(region.state)} state`, amount: stateTax(gross, region.state, married) },
    { id: "city", es: "Ciudad de Nueva York", en: "New York City", amount: region.state === "NY" && region.nyc ? progressive(nyTaxable, married ? NYC_MARRIED : NYC_SINGLE) : 0 },
  ]);
}

/** Same thing per week, which is how people think about their pay. */
export function weeklyTaxes(weeklyGross: number, region: Region = DEFAULT_REGION): TaxBreakdown {
  const y = yearlyTaxes(weeklyGross * 52, region);
  return { parts: y.parts.map((p) => ({ ...p, amount: p.amount / 52 })), total: y.total / 52, net: y.net / 52, rate: y.rate };
}

/** For people paid in cash or without withholding: roughly what they may owe when filing, to set aside each week.
 *  US: income tax plus self-employment tax. México: RESICO on what they charge. */
export function cashSetAsideWeekly(weeklyGross: number, region: Region = DEFAULT_REGION): number {
  if (weeklyGross <= 0) return 0;
  if (region.country === "mx") return weeklyGross * resicoRate((weeklyGross * 52) / 12);
  const yearly = weeklyGross * 52;
  const se = yearly * 0.9235 * 0.153; // Social Security + Medicare for self-employed
  const income = yearlyTaxes(Math.max(0, yearly - se / 2), region);
  const incomeOnly = income.parts.filter((p) => p.id !== "ss" && p.id !== "medicare").reduce((a, p) => a + p.amount, 0);
  return (se + incomeOnly) / 52;
}

/** What actually reaches the person each week from this job. */
export function takeHomeWeekly(weeklyGross: number, tax: WorkTax | undefined, region: Region = DEFAULT_REGION): number {
  const mode = (tax ?? DEFAULT_TAX).mode;
  if (mode === "withheld") return weeklyTaxes(weeklyGross, region).net;
  return weeklyGross; // "net": already what arrives; "cash": nothing withheld (but see cashSetAsideWeekly)
}

/** Plain words for where the taxes are figured for. */
export function regionLabel(r: Region, lang: Lang): string {
  const en = lang === "en";
  if (r.country === "mx") return en ? "Mexico" : "México";
  if (r.state === "NY" && r.nyc) return en ? "New York City" : "la Ciudad de Nueva York";
  return stateName(r.state) || (en ? "the United States" : "Estados Unidos");
}

/** Free help with taxes where you live. */
export function taxHelp(r: Region, lang: Lang): string {
  const en = lang === "en";
  if (r.country === "mx") return en ? "Free help: MarcaSAT 55 627 22 728." : "Ayuda gratis: MarcaSAT 55 627 22 728.";
  if (r.state === "NY" && r.nyc) return en ? "Free tax help: call 311." : "Ayuda gratis con impuestos: llama al 311.";
  return en ? "Free tax help: call 211 or look for VITA near you." : "Ayuda gratis con impuestos: llama al 211 o busca VITA cerca de ti.";
}
