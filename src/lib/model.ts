// Plain calculations on a person's data: no React, no storage. Everything
// here can be tested on its own (see src/lib/model.test.ts).
import { uid, toMonthly, toWeekly, isThisWeek, startOfWeek } from "./money";
import { cashSetAsideWeekly, takeHomeWeekly, weeklyTaxes, DEFAULT_TAX, DEFAULT_REGION, type Region } from "./taxes";
import type { Deposit, Entry, Goal, Plan, Profile, Tanda, UserData } from "./types";

/** Where this person lives, for taxes and money. Older accounts were all New York City. */
export function regionOf(p: Profile | undefined): Region {
  if (!p?.country) return DEFAULT_REGION;
  if (p.country === "mx") return { country: "mx", married: !!p.married };
  return { country: "us", state: p.usState || "NY", nyc: p.usState === "NY" || !p.usState ? p.nyc !== false : false, married: !!p.married };
}

/** Adds the automatic bricks a savings plan owes since it was last applied. */
export function applyGoalPlans(goals: Goal[]): Goal[] | null {
  let changed = false;
  const out = goals.map((g) => {
    if (!g.plan) return g;
    let last = new Date(g.plan.lastApplied);
    let saved = goalSaved(g);
    const added: Deposit[] = [];
    for (let next = nextPeriod(last, g.plan.every); next.getTime() <= Date.now() && saved < g.target && added.length < 60; next = nextPeriod(next, g.plan.every)) {
      const amt = Math.min(g.plan.amount, g.target - saved);
      added.push({ id: uid(), amount: amt, date: next.toISOString(), auto: true });
      saved += amt;
      last = next;
    }
    if (!added.length) return g;
    changed = true;
    return { ...g, deposits: [...g.deposits, ...added], plan: { ...g.plan, lastApplied: last.toISOString() } };
  });
  return changed ? out : null;
}

/** Starting a plan sets apart the first amount right away (this week). */
export function withPlan(g: Goal, plan: { amount: number; every: Plan["every"] } | null): Goal {
  if (!plan) return { ...g, plan: null };
  const now = new Date().toISOString();
  const first = Math.min(plan.amount, Math.max(0, g.target - goalSaved(g)));
  const startingNew = !g.plan;
  return {
    ...g,
    plan: { ...plan, lastApplied: startingNew ? now : g.plan!.lastApplied },
    deposits: startingNew && first > 0 ? [...g.deposits, { id: uid(), amount: first, date: now, auto: true }] : g.deposits,
  };
}

function nextPeriod(from: Date, every: Plan["every"]): Date {
  const d = new Date(from);
  if (every === "month") d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + (every === "2weeks" ? 14 : 7));
  return d;
}

// ---------- tanda helpers ----------
export function tandaRoundDate(t: Tanda, round: number): Date {
  const d = new Date(t.start);
  if (t.every === "month") d.setMonth(d.getMonth() + round);
  else d.setDate(d.getDate() + round * (t.every === "2weeks" ? 14 : 7));
  return d;
}
/** 0-based round happening now (the last one that already started), or -1 before it starts. */
export function tandaCurrentRound(t: Tanda, now = new Date()): number {
  let r = -1;
  for (let i = 0; i < t.people; i++) if (tandaRoundDate(t, i).getTime() <= now.getTime()) r = i;
  return r;
}
export function tandaEnded(t: Tanda, now = new Date()): boolean {
  return tandaRoundDate(t, t.people).getTime() <= now.getTime();
}
/** The person whose turn it is doesn't pay that round, so the pot is
 *  everyone else's payment. */
export const tandaPot = (t: Tanda) => t.amount * (t.people - 1);
export const tandaPayoutDate = (t: Tanda) => tandaRoundDate(t, t.myTurn - 1);

/** A plan only counts while the goal still needs money. */
export const planActive = (g: Goal) => Boolean(g.plan && goalSaved(g) < g.target);

// ---------- plain-language summaries ----------

export const goalSaved = (g: Goal) => g.deposits.reduce((a, d) => a + d.amount, 0);

export type Summary = {
  monthIn: number;
  monthOut: number;
  monthGoals: number;
  monthKeep: number;
  weekIn: number;
  weekOut: number;
  weekGoals: number;
  weekLeft: number;
  perHour: number | null;
  perDay: number | null;
  byGroup: Record<string, number>; // monthly spend by group id
  workGrossWeekly: number;         // pay before taxes
  taxWeekly: number;               // estimated taxes taken out of paychecks
  cashTaxWeekly: number;           // paid without withholding: what to set aside for taxes
};

/** Which pay period we're in for a fixed payment: this month, this week, or this two-week stretch. */
export function periodKey(e: Pick<Entry, "repeat" | "date">, at = new Date()): string {
  if (e.repeat === "month") return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
  const wk = startOfWeek(at);
  if (e.repeat === "2weeks") {
    const first = startOfWeek(new Date(e.date)).getTime();
    return `q${Math.floor((wk.getTime() - first) / (14 * 86400000))}`;
  }
  return `w${wk.getFullYear()}-${String(wk.getMonth() + 1).padStart(2, "0")}-${String(wk.getDate()).padStart(2, "0")}`;
}
export const isPaidNow = (e: Entry) => e.repeat !== "once" && (e.paid ?? []).includes(periodKey(e));

export function summarize(d: UserData, groupOf: (catId: string) => string): Summary {
  // Pay that actually reaches you: estimated taxes come out of paychecks first
  const workGrossWeekly = d.work.reduce((a, w) => a + toWeekly(w.pay, w.every), 0);
  const region = regionOf(d.profile);
  const workWeekly = d.work.reduce((a, w) => a + takeHomeWeekly(toWeekly(w.pay, w.every), w.tax, region), 0);
  const workMonthly = (workWeekly * 52) / 12;
  const taxWeekly = d.work.reduce((a, w) => a + ((w.tax ?? DEFAULT_TAX).mode === "withheld" ? weeklyTaxes(toWeekly(w.pay, w.every), region).total : 0), 0);
  const cashTaxWeekly = d.work.reduce((a, w) => a + (w.tax?.mode === "cash" ? cashSetAsideWeekly(toWeekly(w.pay, w.every), region) : 0), 0);
  const hours = d.work.reduce((a, w) => a + (w.hoursPerWeek || 0), 0);
  const days = d.work.length ? Math.max(...d.work.map((w) => w.daysPerWeek || 0)) : 0;

  let monthInRepeat = 0, monthOutRepeat = 0, weekInRepeat = 0, weekOutRepeat = 0;
  let weekInOnce = 0, weekOutOnce = 0;
  const byGroup: Record<string, number> = {};

  for (const e of d.entries) {
    if (e.repeat === "once") {
      if (isThisWeek(e.date)) {
        if (e.kind === "in") weekInOnce += e.amount;
        else weekOutOnce += e.amount;
      }
      if (e.kind === "out") {
        // one-time costs this month still count toward "where your money goes"
        const dt = new Date(e.date), n = new Date();
        if (dt.getMonth() === n.getMonth() && dt.getFullYear() === n.getFullYear()) {
          const g = groupOf(e.category);
          byGroup[g] = (byGroup[g] ?? 0) + e.amount;
        }
      }
    } else {
      const m = toMonthly(e.amount, e.repeat), w = toWeekly(e.amount, e.repeat);
      if (e.kind === "in") { monthInRepeat += m; weekInRepeat += w; }
      else {
        monthOutRepeat += m; weekOutRepeat += w;
        const g = groupOf(e.category);
        byGroup[g] = (byGroup[g] ?? 0) + m;
      }
    }
  }

  const monthOnceOut = d.entries
    .filter((e) => e.repeat === "once" && e.kind === "out")
    .filter((e) => { const dt = new Date(e.date), n = new Date(); return dt.getMonth() === n.getMonth() && dt.getFullYear() === n.getFullYear(); })
    .reduce((a, e) => a + e.amount, 0);
  const monthOnceIn = d.entries
    .filter((e) => e.repeat === "once" && e.kind === "in")
    .filter((e) => { const dt = new Date(e.date), n = new Date(); return dt.getMonth() === n.getMonth() && dt.getFullYear() === n.getFullYear(); })
    .reduce((a, e) => a + e.amount, 0);

  // Savings plans are fixed money leaving the budget every period; money
  // set apart by hand is added on top in the week/month it happened.
  const plans = d.goals.filter(planActive).map((g) => g.plan!);
  const planWeekly = plans.reduce((a, p) => a + toWeekly(p.amount, p.every), 0);
  const planMonthly = plans.reduce((a, p) => a + toMonthly(p.amount, p.every), 0);
  // The tanda pot goes straight to a goal: it never came out of your pay.
  const manual = d.goals.flatMap((g) => g.deposits).filter((x) => !x.auto && x.from !== "tanda");
  const weekGoals = planWeekly + manual.filter((x) => isThisWeek(x.date)).reduce((a, x) => a + x.amount, 0);
  const monthGoals = planMonthly + manual
    .filter((x) => { const dt = new Date(x.date), n = new Date(); return dt.getMonth() === n.getMonth() && dt.getFullYear() === n.getFullYear(); })
    .reduce((a, x) => a + x.amount, 0);

  // Tandas: the payment is a fixed expense while the tanda runs; the pot is
  // money in the week/month it's my turn.
  let tandaWeekOut = 0, tandaMonthOut = 0, tandaWeekIn = 0, tandaMonthIn = 0;
  for (const t of d.tandas ?? []) {
    if (tandaCurrentRound(t) < 0 && tandaRoundDate(t, 0).getTime() - Date.now() > 7 * 864e5) continue; // not started yet
    if (tandaEnded(t)) continue;
    const payout = tandaPayoutDate(t).toISOString();
    const pd = new Date(payout), n = new Date();
    const payoutThisWeek = isThisWeek(payout);
    const payoutThisMonth = pd.getMonth() === n.getMonth() && pd.getFullYear() === n.getFullYear();
    // You don't pay in the round when it's your turn.
    tandaWeekOut += payoutThisWeek ? 0 : toWeekly(t.amount, t.every);
    tandaMonthOut += Math.max(0, toMonthly(t.amount, t.every) - (payoutThisMonth ? t.amount : 0));
    // If the pot goes to a goal it never passes through your budget.
    if (!t.goalId) {
      if (payoutThisWeek) tandaWeekIn += tandaPot(t);
      if (payoutThisMonth) tandaMonthIn += tandaPot(t);
    }
  }

  const monthIn = workMonthly + monthInRepeat + monthOnceIn + tandaMonthIn;
  const monthOut = monthOutRepeat + monthOnceOut + tandaMonthOut;
  const weekIn = workWeekly + weekInRepeat + weekInOnce + tandaWeekIn;
  const weekOut = weekOutRepeat + weekOutOnce + tandaWeekOut;

  return {
    monthIn, monthOut, monthGoals, monthKeep: monthIn - monthOut - monthGoals,
    weekIn, weekOut, weekGoals, weekLeft: weekIn - weekOut - weekGoals,
    perHour: hours > 0 ? workGrossWeekly / hours : null,
    perDay: days > 0 ? workGrossWeekly / days : null,
    byGroup,
    workGrossWeekly, taxWeekly, cashTaxWeekly,
  };
}
