// Turning what someone said or typed into money entries.
// Shared shape used by the AI route and by this offline fallback.
import { CATEGORIES, INCOME_CATEGORIES, type Repeat } from "./catalog";

export type ParsedEntry = { kind: "in" | "out"; category: string; amount: number; repeat: Repeat; note: string };
export type ParsedWork = { name: string; pay: number; every: Repeat; hoursPerWeek: number; daysPerWeek: number; perHour?: boolean };
export type Parsed = { entries: ParsedEntry[]; work: ParsedWork | null; heard: string };

const strip = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const SMALL: Record<string, number> = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900, mil: 1000,
};

function numbersIn(s: string): number[] {
  const out: number[] = [];
  const re = /\$?\s?(\d{1,3}(?:[,\s]\d{3})+|\d+)(?:\.(\d{1,2}))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const n = parseFloat(m[1].replace(/[,\s]/g, "") + (m[2] ? "." + m[2] : ""));
    if (!isNaN(n)) out.push(n);
  }
  if (out.length) return out;
  // simple number words: "mil doscientos", "quinientos"
  const words = strip(s).split(/\s+/);
  let total = 0, cur = 0, seen = false;
  for (const w of words) {
    if (w === "mil") { cur = (cur || 1) * 1000; total += cur; cur = 0; seen = true; }
    else if (w in SMALL) { cur += SMALL[w]; seen = true; }
    else if (w === "y") continue;
    else if (seen && cur + total > 0) break;
  }
  if (seen && total + cur > 0) out.push(total + cur);
  return out;
}

function repeatIn(s: string): Repeat | null {
  const t = strip(s);
  if (/cada (dos|2) semanas|cada quince|quincena|biweekly|every (two|2) weeks/.test(t)) return "2weeks";
  if (/cada semana|a la semana|por semana|semanal|weekly|every week|per week|la semana/.test(t)) return "week";
  if (/cada mes|al mes|por mes|mensual|monthly|every month|per month|el mes/.test(t)) return "month";
  if (/una vez|solo hoy|hoy|ayer|today|yesterday/.test(t)) return "once";
  return null;
}

function matchCategory(s: string, kind: "in" | "out") {
  const t = strip(s);
  const list = kind === "in" ? INCOME_CATEGORIES : CATEGORIES;
  let best: { id: string; score: number; repeat: Repeat } | null = null;
  for (const c of list) {
    for (const k of c.keywords) {
      const kk = strip(k);
      if (t.includes(kk) && (!best || kk.length > best.score)) best = { id: c.id, score: kk.length, repeat: c.defaultRepeat };
    }
  }
  if (best) return best;
  // tolerate small spelling mistakes: "lus" → luz, "agu" → agua
  const words = t.split(/[^a-zñ]+/).filter((w) => w.length >= 3);
  for (const c of list) {
    for (const k of c.keywords) {
      const kk = strip(k);
      if (kk.includes(" ") || kk.length < 3) continue;
      if (words.some((w) => near(w, kk))) return { id: c.id, score: kk.length, repeat: c.defaultRepeat };
    }
  }
  return null;
}

/** True if a and b differ by at most one letter (or two for long words). */
function near(a: string, b: string): boolean {
  const max = b.length >= 7 ? 2 : 1;
  if (Math.abs(a.length - b.length) > max) return false;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length] <= max;
}

export function understandLocally(text: string, kind: "in" | "out"): Parsed {
  const heard = text.trim();
  const t = strip(heard);

  // Work pay: "me pagaron 650 por la semana, trabaje 45 horas 6 dias"
  if (kind === "in") {
    // A rate: "33 dolares la hora", "$18/hr", "150 al dia"
    const UNIT = String.raw`\$?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:dolares|dlls?|usd|bucks|dollars|\$)?\s*`;
    const hourRate = t.match(new RegExp(UNIT + String.raw`(?:la hora|por hora|a la hora|cada hora|an hour|per hour|\/\s*(?:hr|hora|h)\b|hourly)`));
    const dayRate = t.match(new RegExp(UNIT + String.raw`(?:al dia|por dia|el dia|diarios|a day|per day|\/\s*dia)`));
    let rest = t;
    if (hourRate) rest = rest.replace(hourRate[0], " ");
    if (dayRate) rest = rest.replace(dayRate[0], " ");
    const hours = rest.match(/(\d+)\s*(horas|hrs|hours|h\b)/);
    const days = rest.match(/(\d)\s*(dias|days)/);
    const hoursPerWeek = hours ? parseInt(hours[1]) : 40;
    const daysPerWeek = days ? parseInt(days[1]) : 5;
    if (hourRate) {
      return { heard, entries: [], work: { name: "", pay: parseFloat(hourRate[1].replace(",", ".")), every: "week", hoursPerWeek, daysPerWeek, perHour: true } };
    }
    if (dayRate) {
      const perDay = parseFloat(dayRate[1].replace(",", "."));
      return { heard, entries: [], work: { name: "", pay: Math.round(perDay * daysPerWeek * 100) / 100, every: "week", hoursPerWeek, daysPerWeek } };
    }
    const isPay = /pagaron|pago|cheque|sueldo|salario|paycheck|paystub|gane|trabaj/.test(t);
    if (isPay && (hours || days)) {
      const nums = numbersIn(t.replace(hours?.[0] ?? "", "").replace(days?.[0] ?? "", ""));
      const pay = nums.length ? Math.max(...nums) : 0;
      if (pay > 0) {
        return {
          heard,
          entries: [],
          work: {
            name: "",
            pay,
            every: repeatIn(t) && repeatIn(t) !== "once" ? (repeatIn(t) as Repeat) : "week",
            hoursPerWeek: hours ? parseInt(hours[1]) : 40,
            daysPerWeek: days ? parseInt(days[1]) : 5,
          },
        };
      }
    }
  }

  // Split "1400 de renta y 85 de luz" into pieces (not inside numbers like 1,400)
  const pieces = heard.split(/\s+y\s+|\s+and\s+|;|\n|,(?!\d{3})|\.\s/i).map((p) => p.trim()).filter(Boolean);
  const entries: ParsedEntry[] = [];
  for (const p of pieces) {
    const nums = numbersIn(p);
    if (!nums.length) continue;
    const cat = matchCategory(p, kind) ?? (pieces.length === 1 ? matchCategory(heard, kind) : null);
    const rep = repeatIn(p) ?? (pieces.length === 1 ? repeatIn(heard) : null);
    entries.push({
      kind,
      category: cat?.id ?? (kind === "in" ? "otro_ingreso" : "otro"),
      amount: nums[0],
      repeat: rep ?? cat?.repeat ?? "once",
      note: "",
    });
  }
  return { heard, entries, work: null };
}
