"use client";
// Prototype data layer: everything lives in this browser (localStorage).
// Several people can share one device; each has their own phone + PIN.
// This will move to Supabase for the pilot.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "./i18n";
import type { Repeat } from "./catalog";
import { uid, toMonthly, toWeekly, isThisWeek } from "./money";
import { cloudLoad, cloudRegister, cloudSave, cloudSignIn, cloudSignOut, cloudSignedInAs } from "./cloud";

export type Profile = {
  name: string;
  lang: Lang;
  casita: boolean;
  negocio: boolean;
  createdAt: string;
};

export type Work = {
  id: string;
  name: string;           // e.g. "Restaurante" (optional)
  pay: number;            // amount per pay period
  every: Repeat;          // week | 2weeks | month
  hoursPerWeek: number;
  daysPerWeek: number;
  source: Source;
  createdAt: string;
};

export type Source = "voz" | "texto" | "foto" | "manual";

export type Entry = {
  id: string;
  kind: "in" | "out";
  category: string;       // category id from catalog
  amount: number;
  repeat: Repeat;         // once = only counts the week it happened
  note: string;
  date: string;
  source: Source;
};

/** auto = added by a savings plan; from "tanda" = the tanda pot, which never came out of your pay. */
export type Deposit = { id: string; amount: number; date: string; auto?: boolean; from?: "tanda" };

/** A savings plan: set apart `amount` every `every`. It is counted as money
 *  leaving the budget each period, and a brick is added automatically. */
export type Plan = { amount: number; every: "week" | "2weeks" | "month"; lastApplied: string };

export type Goal = {
  id: string;
  preset: string;         // preset id or "propia"
  name: string;
  target: number;
  deposits: Deposit[];
  plan?: Plan | null;
  createdAt: string;
};

/** A tanda (rotating savings group): everyone puts `amount` every period and
 *  each round one person takes the whole pot. */
export type Tanda = {
  id: string;
  name: string;
  amount: number;             // what each person puts per round
  every: "week" | "2weeks" | "month";
  people: number;
  names: string[];            // optional names per turn (index 0 = turn 1)
  myTurn: number;             // 1-based
  start: string;              // date of round 1
  paid: number[];             // rounds (0-based) I already paid
  received: boolean;
  goalId: string | null;      // where the pot goes when I receive it
  createdAt: string;
};

export type UserData = {
  profile: Profile;
  work: Work[];
  entries: Entry[];
  goals: Goal[];
  tandas?: Tanda[];
  updatedAt?: string;          // last change on this device or in the cloud
};

export type CloudStatus = "off" | "syncing" | "saved" | "local";

type Account = { pinHash: string; data: UserData };

type State = {
  accounts: Record<string, Account>; // key = phone digits
  current: string | null;
  deviceLang: Lang;                   // chosen before signing in
  voiceOn: boolean;                   // read screens aloud automatically
  cloud: CloudStatus;                 // is this person's data saved online?
  needsNewPin: boolean;               // signed in with an old 4-digit PIN

  setDeviceLang: (l: Lang) => void;
  setVoiceOn: (v: boolean) => void;
  syncUp: () => Promise<void>;
  changePin: (newPin: string) => Promise<void>;
  syncDown: () => Promise<void>;
  register: (phone: string, pin: string, profile: Profile) => Promise<void>;
  login: (phone: string, pin: string) => Promise<boolean>;
  logout: () => void;
  loadDemo: () => Promise<void>;

  updateProfile: (p: Partial<Profile>) => void;
  addWork: (w: Omit<Work, "id" | "createdAt">) => void;
  removeWork: (id: string) => void;
  updateWork: (id: string, w: Partial<Omit<Work, "id" | "createdAt">>) => void;
  addEntries: (e: Omit<Entry, "id">[]) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, e: Partial<Omit<Entry, "id">>) => void;
  addGoal: (g: { preset: string; name: string; target: number }) => string;
  updateGoal: (id: string, g: Partial<Pick<Goal, "name" | "target">>) => void;
  removeGoal: (id: string) => void;
  deposit: (goalId: string, amount: number) => void;
  setPlan: (goalId: string, plan: { amount: number; every: Plan["every"] } | null) => void;
  applyPlans: () => void;
  addTanda: (t: Omit<Tanda, "id" | "createdAt" | "paid" | "received">) => string;
  updateTanda: (id: string, t: Partial<Omit<Tanda, "id" | "createdAt">>) => void;
  removeTanda: (id: string) => void;
  toggleTandaPaid: (id: string, round: number) => void;
  receiveTanda: (id: string) => void;
};

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

async function hashPin(phone: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`mi-camino:${phone}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function mutateCurrent(state: State, fn: (d: UserData) => UserData): Partial<State> {
  if (!state.current) return {};
  const acc = state.accounts[state.current];
  if (!acc) return {};
  const next = fn(acc.data);
  if (next === acc.data) return {};
  return { accounts: { ...state.accounts, [state.current]: { ...acc, data: { ...next, updatedAt: new Date().toISOString() } } } };
}

export const DEMO_PHONE = "0000000000";
export const DEMO_PIN = "123456";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function demoData(lang: Lang): UserData {
  const now = new Date().toISOString();
  const casaId = uid();
  return {
    profile: { name: "María", lang, casita: true, negocio: true, createdAt: now },
    work: [
      { id: uid(), name: "Restaurante", pay: 680, every: "week", hoursPerWeek: 48, daysPerWeek: 6, source: "foto", createdAt: now },
    ],
    entries: [
      { id: uid(), kind: "out", category: "renta", amount: 1100, repeat: "month", note: "Cuarto en Corona", date: daysAgo(20), source: "voz" },
      { id: uid(), kind: "out", category: "luz", amount: 45, repeat: "month", note: "", date: daysAgo(12), source: "foto" },
      { id: uid(), kind: "out", category: "telefono", amount: 40, repeat: "month", note: "", date: daysAgo(10), source: "texto" },
      { id: uid(), kind: "out", category: "metro", amount: 34, repeat: "week", note: "", date: daysAgo(6), source: "voz" },
      { id: uid(), kind: "out", category: "super", amount: 90, repeat: "week", note: "", date: daysAgo(4), source: "foto" },
      { id: uid(), kind: "out", category: "envio", amount: 300, repeat: "month", note: "A mi mamá en Puebla", date: daysAgo(3), source: "voz" },
      { id: uid(), kind: "out", category: "comida_fuera", amount: 18, repeat: "once", note: "", date: daysAgo(1), source: "texto" },
      { id: uid(), kind: "in", category: "propinas", amount: 60, repeat: "once", note: "", date: daysAgo(1), source: "voz" },
    ],
    goals: [
      {
        id: casaId, preset: "casa_mexico", name: "Mi casita en Puebla", target: 12000, createdAt: daysAgo(90),
        deposits: [
          { id: uid(), amount: 1500, date: daysAgo(80) },
          { id: uid(), amount: 1200, date: daysAgo(50) },
          { id: uid(), amount: 1300, date: daysAgo(20) },
          { id: uid(), amount: 800, date: daysAgo(9) },
          { id: uid(), amount: 120, date: daysAgo(1), auto: true },
        ],
        plan: { amount: 120, every: "week", lastApplied: daysAgo(1) },
      },
      {
        id: uid(), preset: "emergencias", name: "Dinero para emergencias", target: 1500, createdAt: daysAgo(40),
        deposits: [
          { id: uid(), amount: 300, date: daysAgo(30) },
          { id: uid(), amount: 250, date: daysAgo(12) },
        ],
      },
    ],
    tandas: [
      {
        id: uid(), name: "Tanda de las compañeras", amount: 100, every: "week", people: 10,
        names: ["Lupe", "Rosa", "Carmen", "Juana", "Elena", "", "Paty", "Sofía", "Inés", "Marta"],
        myTurn: 6, start: daysAgo(21), paid: [0, 1, 2], received: false, goalId: casaId, createdAt: daysAgo(25),
      },
    ],
  };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      accounts: {},
      current: null,
      deviceLang: "es",
      voiceOn: false,
      cloud: "off",
      needsNewPin: false,

      setDeviceLang: (l) =>
        set((s) => ({ deviceLang: l, ...mutateCurrent(s, (d) => ({ ...d, profile: { ...d.profile, lang: l } })) })),
      setVoiceOn: (v) => set({ voiceOn: v }),

      // ---------- online saving ----------
      syncUp: async () => {
        const { current, accounts } = get();
        if (!current || current === DEMO_PHONE) return;
        const acc = accounts[current];
        if (!acc || !(await cloudSignedInAs(current))) { set({ cloud: "local" }); return; }
        set({ cloud: "syncing" });
        const ok = await cloudSave(acc.data);
        if (get().current === current) set({ cloud: ok ? "saved" : "local" });
      },
      syncDown: async () => {
        const { current } = get();
        if (!current || current === DEMO_PHONE) return;
        if (!(await cloudSignedInAs(current))) { set({ cloud: "local" }); return; }
        const remote = await cloudLoad();
        if (!remote) { set({ cloud: "local" }); return; }
        const acc = get().accounts[current];
        if (!acc) return;
        const localAt = acc.data.updatedAt ?? "";
        const remoteAt = remote.data?.updatedAt ?? remote.updatedAt ?? "";
        if (remote.data && remoteAt > localAt) {
          // newer on another device: take it
          set((s) => ({ accounts: { ...s.accounts, [current]: { ...acc, data: remote.data! } }, cloud: "saved" }));
        } else {
          await get().syncUp();
        }
      },

      register: async (phone, pin, profile) => {
        const p = onlyDigits(phone);
        const pinHash = await hashPin(p, pin);
        set((s) => ({
          accounts: { ...s.accounts, [p]: { pinHash, data: { profile, work: [], entries: [], goals: [], updatedAt: new Date().toISOString() } } },
          current: p,
          deviceLang: profile.lang,
          cloud: "syncing",
        }));
        // create the online account in the background; the app never waits on it
        void (async () => {
          let r = await cloudRegister(p, pin, profile);
          if (r === "exists") r = await cloudSignIn(p, pin); // same phone + PIN used before
          if (r === "ok") await get().syncDown();
          else if (get().current === p) set({ cloud: "local" });
        })();
      },
      login: async (phone, pin) => {
        const p = onlyDigits(phone);
        const acc = get().accounts[p];
        if (acc) {
          if ((await hashPin(p, pin)) !== acc.pinHash) return false;
          if (pin.length < 6) {
            // Account made with the old 4-digit PIN: let them in, then ask for a 6-digit one
            set({ current: p, deviceLang: acc.data.profile.lang, cloud: "local", needsNewPin: true });
            return true;
          }
          set({ current: p, deviceLang: acc.data.profile.lang, cloud: "syncing" });
          if (p === DEMO_PHONE) { set({ cloud: "off" }); return true; }
          // connect online in the background; accounts made before online saving get created now
          void (async () => {
            let r = await cloudSignIn(p, pin);
            if (r === "wrong") r = await cloudRegister(p, pin, acc.data.profile);
            if (r === "ok") await get().syncDown();
            else if (get().current === p) set({ cloud: "local" });
          })();
          return true;
        }
        // Not on this device: try the online account (e.g. a new phone or computer)
        const r = await cloudSignIn(p, pin);
        if (r !== "ok") return false;
        const remote = await cloudLoad();
        const data: UserData = remote?.data ?? {
          profile: { name: "", lang: get().deviceLang, casita: true, negocio: false, createdAt: new Date().toISOString() },
          work: [], entries: [], goals: [],
        };
        const h = await hashPin(p, pin);
        set((s) => ({ accounts: { ...s.accounts, [p]: { pinHash: h, data } }, current: p, deviceLang: data.profile.lang, cloud: "saved" }));
        return true;
      },
      logout: () => { void cloudSignOut(); set({ current: null, cloud: "off", needsNewPin: false }); },
      changePin: async (newPin) => {
        const { current, accounts } = get();
        if (!current || !accounts[current]) return;
        const h = await hashPin(current, newPin);
        set((s) => ({ accounts: { ...s.accounts, [current]: { ...s.accounts[current], pinHash: h } }, needsNewPin: false, cloud: "syncing" }));
        const profile = get().accounts[current].data.profile;
        void (async () => {
          let r = await cloudRegister(current, newPin, profile);
          if (r === "exists") r = await cloudSignIn(current, newPin);
          if (r === "ok") await get().syncDown();
          else if (get().current === current) set({ cloud: "local" });
        })();
      },
      loadDemo: async () => {
        const pinHash = await hashPin(DEMO_PHONE, DEMO_PIN);
        const lang = get().deviceLang;
        set((s) => ({ accounts: { ...s.accounts, [DEMO_PHONE]: { pinHash, data: demoData(lang) } }, current: DEMO_PHONE }));
      },

      updateProfile: (p) => set((s) => mutateCurrent(s, (d) => ({ ...d, profile: { ...d.profile, ...p } }))),
      addWork: (w) =>
        set((s) => mutateCurrent(s, (d) => ({ ...d, work: [...d.work, { ...w, id: uid(), createdAt: new Date().toISOString() }] }))),
      removeWork: (id) => set((s) => mutateCurrent(s, (d) => ({ ...d, work: d.work.filter((w) => w.id !== id) }))),
      updateWork: (id, w) => set((s) => mutateCurrent(s, (d) => ({ ...d, work: d.work.map((x) => (x.id === id ? { ...x, ...w } : x)) }))),
      addEntries: (es) =>
        set((s) => mutateCurrent(s, (d) => ({ ...d, entries: [...es.map((e) => ({ ...e, id: uid() })), ...d.entries] }))),
      removeEntry: (id) => set((s) => mutateCurrent(s, (d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }))),
      updateEntry: (id, e) => set((s) => mutateCurrent(s, (d) => ({ ...d, entries: d.entries.map((x) => (x.id === id ? { ...x, ...e } : x)) }))),
      addGoal: ({ preset, name, target }) => {
        const id = uid();
        set((s) =>
          mutateCurrent(s, (d) => ({
            ...d,
            goals: [...d.goals, { id, preset, name, target, deposits: [], createdAt: new Date().toISOString() }],
          })),
        );
        return id;
      },
      updateGoal: (id, g) =>
        set((s) => mutateCurrent(s, (d) => ({ ...d, goals: d.goals.map((x) => (x.id === id ? { ...x, ...g } : x)) }))),
      removeGoal: (id) => set((s) => mutateCurrent(s, (d) => ({ ...d, goals: d.goals.filter((x) => x.id !== id) }))),
      setPlan: (goalId, plan) =>
        set((s) =>
          mutateCurrent(s, (d) => ({
            ...d,
            goals: d.goals.map((g) => {
              if (g.id !== goalId) return g;
              if (!plan) return { ...g, plan: null };
              const now = new Date().toISOString();
              // Starting a plan sets apart the first amount right away (this week).
              const left = Math.max(0, g.target - goalSaved(g));
              const first = Math.min(plan.amount, left);
              const startingNew = !g.plan;
              return {
                ...g,
                plan: { ...plan, lastApplied: startingNew ? now : g.plan!.lastApplied },
                deposits: startingNew && first > 0 ? [...g.deposits, { id: uid(), amount: first, date: now, auto: true }] : g.deposits,
              };
            }),
          })),
        ),
      applyPlans: () =>
        set((s) =>
          mutateCurrent(s, (d) => {
            let changed = false;
            const goals = d.goals.map((g) => {
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
            // Older tanda payouts were saved as a normal deposit of amount × people:
            // mark them as coming from the tanda and fix the amount.
            let fixedGoals = goals;
            for (const t of d.tandas ?? []) {
              if (!t.received || !t.goalId) continue;
              fixedGoals = fixedGoals.map((g) => {
                if (g.id !== t.goalId) return g;
                const i = g.deposits.findIndex((x) => !x.auto && !x.from && x.amount === t.amount * t.people);
                if (i < 0) return g;
                changed = true;
                const deps = [...g.deposits];
                deps[i] = { ...deps[i], amount: tandaPot(t), from: "tanda" };
                return { ...g, deposits: deps };
              });
            }
            return changed ? { ...d, goals: fixedGoals } : d;
          }),
        ),
      addTanda: (t) => {
        const id = uid();
        set((s) => mutateCurrent(s, (d) => ({ ...d, tandas: [...(d.tandas ?? []), { ...t, id, paid: [], received: false, createdAt: new Date().toISOString() }] })));
        return id;
      },
      updateTanda: (id, t) =>
        set((s) => mutateCurrent(s, (d) => ({ ...d, tandas: (d.tandas ?? []).map((x) => (x.id === id ? { ...x, ...t } : x)) }))),
      removeTanda: (id) => set((s) => mutateCurrent(s, (d) => ({ ...d, tandas: (d.tandas ?? []).filter((x) => x.id !== id) }))),
      toggleTandaPaid: (id, round) =>
        set((s) =>
          mutateCurrent(s, (d) => ({
            ...d,
            tandas: (d.tandas ?? []).map((x) =>
              x.id !== id ? x : { ...x, paid: x.paid.includes(round) ? x.paid.filter((r) => r !== round) : [...x.paid, round] },
            ),
          })),
        ),
      receiveTanda: (id) =>
        set((s) =>
          mutateCurrent(s, (d) => {
            const t = (d.tandas ?? []).find((x) => x.id === id);
            if (!t || t.received) return d;
            const pot = tandaPot(t);
            const now = new Date().toISOString();
            return {
              ...d,
              tandas: (d.tandas ?? []).map((x) => (x.id === id ? { ...x, received: true } : x)),
              // the pot goes straight into the chosen goal
              goals: t.goalId ? d.goals.map((g) => (g.id === t.goalId ? { ...g, deposits: [...g.deposits, { id: uid(), amount: pot, date: now, from: "tanda" as const }] } : g)) : d.goals,
            };
          }),
        ),
      deposit: (goalId, amount) =>
        set((s) =>
          mutateCurrent(s, (d) => ({
            ...d,
            goals: d.goals.map((g) =>
              g.id === goalId ? { ...g, deposits: [...g.deposits, { id: uid(), amount, date: new Date().toISOString() }] } : g,
            ),
          })),
        ),
    }),
    { name: "mi-camino-v1" },
  ),
);

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

/** The signed-in person's data, or null. */
export function useMe(): UserData | null {
  return useStore((s) => (s.current ? s.accounts[s.current]?.data ?? null : null));
}

/** Current language: the profile's if signed in, else the device choice. */
export function useLang(): Lang {
  return useStore((s) => (s.current ? s.accounts[s.current]?.data.profile.lang : undefined) ?? s.deviceLang);
}

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
};

export function summarize(d: UserData, groupOf: (catId: string) => string): Summary {
  const workMonthly = d.work.reduce((a, w) => a + toMonthly(w.pay, w.every), 0);
  const workWeekly = d.work.reduce((a, w) => a + toWeekly(w.pay, w.every), 0);
  const hours = d.work.reduce((a, w) => a + (w.hoursPerWeek || 0), 0);
  const days = d.work.length ? Math.max(...d.work.map((w) => w.daysPerWeek || 0)) : 0;

  let monthInRepeat = 0, monthOutRepeat = 0, weekInRepeat = 0, weekOutRepeat = 0;
  let weekInOnce = 0, weekOutOnce = 0;
  const byGroup: Record<string, number> = {};

  for (const e of d.entries) {
    if (e.repeat === "once") {
      if (isThisWeek(e.date)) e.kind === "in" ? (weekInOnce += e.amount) : (weekOutOnce += e.amount);
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
    perHour: hours > 0 ? workWeekly / hours : null,
    perDay: days > 0 ? workWeekly / days : null,
    byGroup,
  };
}
