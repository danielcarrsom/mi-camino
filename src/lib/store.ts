"use client";
// Prototype data layer: everything lives in this browser (localStorage).
// Several people can share one device; each has their own phone + PIN.
// This will move to Supabase for the pilot.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "./i18n";
import type { Repeat } from "./catalog";
import { uid, toMonthly, toWeekly, isThisWeek } from "./money";

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

export type Deposit = { id: string; amount: number; date: string };

export type Goal = {
  id: string;
  preset: string;         // preset id or "propia"
  name: string;
  target: number;
  deposits: Deposit[];
  createdAt: string;
};

export type UserData = {
  profile: Profile;
  work: Work[];
  entries: Entry[];
  goals: Goal[];
};

type Account = { pinHash: string; data: UserData };

type State = {
  accounts: Record<string, Account>; // key = phone digits
  current: string | null;
  deviceLang: Lang;                   // chosen before signing in
  voiceOn: boolean;                   // read screens aloud automatically

  setDeviceLang: (l: Lang) => void;
  setVoiceOn: (v: boolean) => void;
  register: (phone: string, pin: string, profile: Profile) => Promise<void>;
  login: (phone: string, pin: string) => Promise<boolean>;
  logout: () => void;
  loadDemo: () => Promise<void>;

  updateProfile: (p: Partial<Profile>) => void;
  addWork: (w: Omit<Work, "id" | "createdAt">) => void;
  removeWork: (id: string) => void;
  addEntries: (e: Omit<Entry, "id">[]) => void;
  removeEntry: (id: string) => void;
  addGoal: (g: { preset: string; name: string; target: number }) => string;
  updateGoal: (id: string, g: Partial<Pick<Goal, "name" | "target">>) => void;
  removeGoal: (id: string) => void;
  deposit: (goalId: string, amount: number) => void;
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
  return { accounts: { ...state.accounts, [state.current]: { ...acc, data: fn(acc.data) } } };
}

export const DEMO_PHONE = "0000000000";
export const DEMO_PIN = "1234";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function demoData(lang: Lang): UserData {
  const now = new Date().toISOString();
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
        id: uid(), preset: "casa_mexico", name: "Mi casita en Puebla", target: 12000, createdAt: daysAgo(90),
        deposits: [
          { id: uid(), amount: 1500, date: daysAgo(80) },
          { id: uid(), amount: 1200, date: daysAgo(50) },
          { id: uid(), amount: 1300, date: daysAgo(20) },
          { id: uid(), amount: 800, date: daysAgo(9) },
          { id: uid(), amount: 120, date: daysAgo(1) },
        ],
      },
      {
        id: uid(), preset: "emergencias", name: "Dinero para emergencias", target: 1500, createdAt: daysAgo(40),
        deposits: [
          { id: uid(), amount: 300, date: daysAgo(30) },
          { id: uid(), amount: 250, date: daysAgo(12) },
        ],
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

      setDeviceLang: (l) =>
        set((s) => ({ deviceLang: l, ...mutateCurrent(s, (d) => ({ ...d, profile: { ...d.profile, lang: l } })) })),
      setVoiceOn: (v) => set({ voiceOn: v }),

      register: async (phone, pin, profile) => {
        const p = onlyDigits(phone);
        const pinHash = await hashPin(p, pin);
        set((s) => ({
          accounts: { ...s.accounts, [p]: { pinHash, data: { profile, work: [], entries: [], goals: [] } } },
          current: p,
          deviceLang: profile.lang,
        }));
      },
      login: async (phone, pin) => {
        const p = onlyDigits(phone);
        const acc = get().accounts[p];
        if (!acc) return false;
        if ((await hashPin(p, pin)) !== acc.pinHash) return false;
        set({ current: p, deviceLang: acc.data.profile.lang });
        return true;
      },
      logout: () => set({ current: null }),
      loadDemo: async () => {
        const pinHash = await hashPin(DEMO_PHONE, DEMO_PIN);
        const lang = get().deviceLang;
        set((s) => ({ accounts: { ...s.accounts, [DEMO_PHONE]: { pinHash, data: demoData(lang) } }, current: DEMO_PHONE }));
      },

      updateProfile: (p) => set((s) => mutateCurrent(s, (d) => ({ ...d, profile: { ...d.profile, ...p } }))),
      addWork: (w) =>
        set((s) => mutateCurrent(s, (d) => ({ ...d, work: [...d.work, { ...w, id: uid(), createdAt: new Date().toISOString() }] }))),
      removeWork: (id) => set((s) => mutateCurrent(s, (d) => ({ ...d, work: d.work.filter((w) => w.id !== id) }))),
      addEntries: (es) =>
        set((s) => mutateCurrent(s, (d) => ({ ...d, entries: [...es.map((e) => ({ ...e, id: uid() })), ...d.entries] }))),
      removeEntry: (id) => set((s) => mutateCurrent(s, (d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }))),
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

  const allDeposits = d.goals.flatMap((g) => g.deposits);
  const weekGoals = allDeposits.filter((x) => isThisWeek(x.date)).reduce((a, x) => a + x.amount, 0);
  const monthGoals = allDeposits
    .filter((x) => { const dt = new Date(x.date), n = new Date(); return dt.getMonth() === n.getMonth() && dt.getFullYear() === n.getFullYear(); })
    .reduce((a, x) => a + x.amount, 0);

  const monthIn = workMonthly + monthInRepeat + monthOnceIn;
  const monthOut = monthOutRepeat + monthOnceOut;
  const weekIn = workWeekly + weekInRepeat + weekInOnce;
  const weekOut = weekOutRepeat + weekOutOnce;

  return {
    monthIn, monthOut, monthGoals, monthKeep: monthIn - monthOut - monthGoals,
    weekIn, weekOut, weekGoals, weekLeft: weekIn - weekOut - weekGoals,
    perHour: hours > 0 ? workWeekly / hours : null,
    perDay: days > 0 ? workWeekly / days : null,
    byGroup,
  };
}
