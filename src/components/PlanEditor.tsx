"use client";
// Choose how much to set apart for a goal and how often.
import { AmountInput, QuickAmounts, cx } from "./ui";
import { useT } from "@/lib/hooks";
import { useLang, type Plan } from "@/lib/store";
import type { TKey } from "@/lib/i18n";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/PlanEditor";

export type PlanDraft = { amount: string; every: Plan["every"] };

const EVERY: { id: Plan["every"]; key: TKey; perYear: number }[] = [
  { id: "week", key: "weekly", perYear: 52 },
  { id: "2weeks", key: "biweekly", perYear: 26 },
  { id: "month", key: "monthly", perYear: 12 },
];

/** How long until the goal is reached, in plain words. */
export function finishText(missing: number, amount: number, every: Plan["every"], lang: string): string | null {
  if (!amount || amount <= 0 || missing <= 0) return null;
  const periods = Math.ceil(missing / amount);
  const weeks = every === "week" ? periods : every === "2weeks" ? periods * 2 : Math.round(periods * 4.33);
  const months = Math.max(1, Math.round(weeks / 4.33));
  if (lang === "en") return weeks <= 8 ? `You finish in ${weeks} weeks` : `You finish in about ${months} months`;
  return weeks <= 8 ? `Terminas en ${weeks} semanas` : `Terminas en unos ${months} meses`;
}

export function suggestAmounts(missing: number, every: Plan["every"]): number[] {
  const per = EVERY.find((e) => e.id === every)!.perYear;
  const round = (n: number) => Math.max(5, Math.round(n / 5) * 5);
  // finish in about 2 years, 1 year, 6 months
  return Array.from(new Set([round(missing / (per * 2)), round(missing / per), round(missing / (per / 2))])).filter((n) => n < missing || n === round(missing));
}

/** What we'd suggest setting apart: half of what is left each week after
 *  expenses and other savings, never more than what's missing. */
export function recommendedAmount(freeWeekly: number | null | undefined, missing: number, every: Plan["every"]): number | null {
  if (freeWeekly == null || freeWeekly <= 0 || missing <= 0) return null;
  const perPeriod = every === "week" ? 1 : every === "2weeks" ? 2 : 52 / 12;
  const raw = freeWeekly * 0.5 * perPeriod;
  const rounded = Math.max(5, Math.floor(raw / 5) * 5);
  return Math.min(rounded, Math.ceil(missing));
}

export function PlanEditor({ value, onChange, missing, tight, freeWeekly }: { value: PlanDraft; onChange: (v: PlanDraft) => void; missing: number; tight?: boolean; freeWeekly?: number | null }) {
  const t = useT();
  const lang = useLang();
  const finish = finishText(missing, Number(value.amount), value.every, lang);
  const rec = recommendedAmount(freeWeekly, missing, value.every);
  const per = value.every === "week" ? (tx(lang, TXT.aLaSemana)) : value.every === "2weeks" ? (tx(lang, TXT.cadaQuincena)) : (tx(lang, TXT.alMes));
  return (
    <div className="space-y-4">
      {rec != null ? (
        <div className="rounded-2xl border-2 border-sun bg-sun-soft p-4">
          <p className="text-lg font-extrabold">💡 {txf(lang, TXT.teSugerimos, [rec.toLocaleString("es-MX"), per, rec ? "$" + rec.toLocaleString("en-US") : ""])}</p>
          <p className="mt-1 text-base">
            {txf(lang, TXT.despuesDeTusGastosTe, [Math.round(freeWeekly!).toLocaleString("es-MX"), Math.round(freeWeekly!).toLocaleString("en-US")])}
          </p>
          {Number(value.amount) !== rec && (
            <button onClick={() => onChange({ ...value, amount: String(rec) })} className="mt-2 inline-flex h-11 items-center rounded-xl bg-ink px-4 font-bold text-paper">{tx(lang, TXT.usarEstaCantidad)}</button>
          )}
        </div>
      ) : freeWeekly != null && freeWeekly <= 0 ? (
        <p className="rounded-2xl bg-sun-soft px-4 py-3 text-base">{tx(lang, TXT.ahoraTusGastosSeLlevan)}</p>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        {EVERY.map((e) => (
          <button key={e.id} onClick={() => onChange({ ...value, every: e.id })} className={cx("min-h-14 rounded-2xl border-2 px-2 text-base font-bold", value.every === e.id ? "border-clay bg-clay text-paper" : "border-sand bg-paper")}>
            {t(e.key)}
          </button>
        ))}
      </div>
      <div>
        <AmountInput value={value.amount} onChange={(a) => onChange({ ...value, amount: a })} />
        <QuickAmounts amounts={suggestAmounts(missing, value.every)} onPick={(n) => onChange({ ...value, amount: String(n) })} />
      </div>
      {finish && <p className="rounded-2xl bg-leaf-soft px-4 py-3 text-center text-lg font-bold">{finish}</p>}
      {tight && <p className="rounded-2xl bg-sun-soft px-4 py-3 text-base">⚠️ {t("planTight")}</p>}
    </div>
  );
}
