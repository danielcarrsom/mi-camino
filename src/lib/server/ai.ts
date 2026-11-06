import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES, INCOME_CATEGORIES } from "../catalog";
import type { Parsed, ParsedEntry, ParsedWork } from "../understand";

// The Anthropic key can be saved in Vercel as ANTHROPIC_API_KEY or MI_CAMINO_AI_KEY.
const aiKey = () => process.env.ANTHROPIC_API_KEY || process.env.MI_CAMINO_AI_KEY || "";
export const hasAI = () => Boolean(aiKey());
export const hasVoice = () => Boolean(process.env.ELEVENLABS_API_KEY);

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";

let client: Anthropic | null = null;
export function ai(): Anthropic {
  client ??= new Anthropic({ apiKey: aiKey() });
  return client;
}
export const model = () => MODEL;

const REPEATS = ["once", "week", "2weeks", "month"];

export const MONEY_SYSTEM = `You help Latino families (in the United States or in Mexico) record their money in a simple budgeting platform.
People may speak or type in Spanish, English, Spanglish or with many spelling mistakes ("pague 1400 de rrenta", "lus 85"). Understand what they mean.
Never ask for or repeat immigration status, Social Security numbers, account numbers, names of employers' owners, or addresses.

Return ONLY JSON with this shape:
{"entries":[{"kind":"in"|"out","category":"<id>","amount":number,"repeat":"once"|"week"|"2weeks"|"month","note":"<short note in the user's language or empty>"}],
 "work": null | {"name":"<workplace type, e.g. Restaurante, or empty>","pay":number,"every":"hour"|"week"|"2weeks"|"month","hoursPerWeek":number,"daysPerWeek":number,"taxMode":"withheld"|"cash"|"net"}}

Rules:
- Spending categories (kind "out"): ${CATEGORIES.map((c) => `${c.id} (${c.label.es})`).join(", ")}.
- Income categories (kind "in"): ${INCOME_CATEGORIES.map((c) => `${c.id} (${c.label.es})`).join(", ")}.
- Use "work" for a regular job: a paycheck/paystub, or a pay RATE. Then "entries" may be empty.
- If they say a rate per HOUR ("me pagan 33 dólares la hora", "$18/hr"), set "every":"hour" and "pay" to the hourly rate (33), NOT the weekly total.
- If they say a rate per DAY ("150 al día"), set "every":"week" and "pay" = daily rate × days per week.
- If hours per week or days per week are not stated, estimate from the paystub if possible (hours worked in the period), else use 40 and 5.
- If a pay period is two weeks, convert hours to per week.
- "taxMode": for a PAYSTUB that shows tax deductions, use the GROSS pay (before taxes) as "pay" and "taxMode":"withheld". If the person says the amount is what reaches them after taxes ("me llegan", "neto", "take home"), use that amount and "taxMode":"net". If they say they're paid in cash or nothing is taken out, "taxMode":"cash". If unclear, "withheld".
- "repeat": rent, utilities, phone are usually "month"; groceries, subway usually "week"; a single purchase is "once". Use what the person says if they say it.
- Amounts are in the person's own money (stated in the message: US dollars unless it says they live in Mexico, then Mexican pesos). Never convert unless they clearly use the other currency; then convert roughly at 18 pesos per dollar and say so in "note".
- If nothing about money is understandable, return {"entries":[],"work":null}.`;

function clampEntry(e: Partial<ParsedEntry>): ParsedEntry | null {
  const amount = Number(e.amount);
  if (!amount || amount <= 0 || amount > 1_000_000) return null;
  const kind = e.kind === "in" ? "in" : "out";
  const ids = (kind === "in" ? INCOME_CATEGORIES : CATEGORIES).map((c) => c.id);
  return {
    kind,
    category: ids.includes(String(e.category)) ? String(e.category) : kind === "in" ? "otro_ingreso" : "otro",
    amount: Math.round(amount * 100) / 100,
    repeat: (REPEATS.includes(String(e.repeat)) ? e.repeat : "once") as ParsedEntry["repeat"],
    note: typeof e.note === "string" ? e.note.slice(0, 80) : "",
  };
}

function clampWork(w: Partial<ParsedWork> | null | undefined): ParsedWork | null {
  if (!w) return null;
  const pay = Number(w.pay);
  if (!pay || pay <= 0) return null;
  const raw = String((w as { every?: string }).every);
  const perHour = raw === "hour";
  const every = ["week", "2weeks", "month"].includes(raw) ? (raw as ParsedWork["every"]) : "week";
  return {
    name: typeof w.name === "string" ? w.name.slice(0, 40) : "",
    pay: Math.round(pay * 100) / 100,
    every,
    perHour,
    hoursPerWeek: Math.min(100, Math.max(1, Number(w.hoursPerWeek) || 40)),
    daysPerWeek: Math.min(7, Math.max(1, Number(w.daysPerWeek) || 5)),
    tax: { mode: (["withheld", "cash", "net"] as const).find((m) => m === (w as { taxMode?: string }).taxMode) ?? "withheld", place: "nyc" },
  };
}

export function parseModelJson(raw: string, heard: string): Parsed | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    const j = JSON.parse(raw.slice(start, end + 1));
    const entries = (Array.isArray(j.entries) ? j.entries : []).map(clampEntry).filter(Boolean) as ParsedEntry[];
    return { entries, work: clampWork(j.work), heard };
  } catch {
    return null;
  }
}

export function textOf(msg: Anthropic.Message): string {
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

/** One line telling the model which money the person uses. */
export function currencyLine(currency: unknown): string {
  return currency === "MXN"
    ? "The person lives in MEXICO: amounts are Mexican pesos (MXN). A payslip is a \"recibo de nómina\" (ISR and IMSS are the deductions)."
    : "The person lives in the United States: amounts are US dollars.";
}
