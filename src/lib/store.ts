"use client";
// The app's state: the people who use this device (each with their phone + PIN),
// who is signed in, and every change they make. Saved in this browser
// (localStorage) and, when signed in, copied to Supabase (see cloud.ts).
// Several people can share one device.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "./i18n";
import { uid, setCurrency } from "./money";
import { altPhoneKey } from "./phone";
import type { Region } from "./taxes";
import type { BizEntry, Product, BizType, StockItem, MyPay } from "./business";
import { cloudChangePin, cloudDeleteAccount, cloudLoad, cloudRegister, cloudSave, cloudSignIn, cloudSignOut, cloudSignedInAs, recoverySet } from "./cloud";
import { applyGoalPlans, goalSaved, periodKey, regionOf, tandaPot, withPlan } from "./model";
import { DEMO_PHONE, DEMO_PIN, demoData } from "./demo";
import type { Business, CloudStatus, Entry, Goal, Plan, Profile, Tanda, UserData, Work } from "./types";

// The rest of the app imports data shapes and calculations from here.
export * from "./types";
export * from "./model";
export { DEMO_PHONE, DEMO_PIN } from "./demo";

type Account = { pinHash: string; data: UserData };

type State = {
  accounts: Record<string, Account>; // key = phone digits
  current: string | null;
  deviceLang: Lang;                   // chosen before signing in
  voiceOn: boolean;                   // read screens aloud automatically
  textBig: boolean;                   // bigger letters on this device
  touring: boolean;                   // the guided tour is on screen
  cloud: CloudStatus;                 // is this person's data saved online?
  needsNewPin: boolean;               // signed in with an old 4-digit PIN
  loginProblem: "wrong" | "locked" | null; // why the last sign-in failed

  setDeviceLang: (l: Lang) => void;
  setVoiceOn: (v: boolean) => void;
  setTextBig: (v: boolean) => void;
  setTouring: (v: boolean) => void;
  syncUp: () => Promise<void>;
  changePin: (newPin: string) => Promise<void>;
  syncDown: () => Promise<void>;
  register: (phone: string, pin: string, profile: Profile, recovery?: { question: string; answer: string } | null) => Promise<void>;
  setRecovery: (question: string, answer: string) => Promise<boolean>;
  resetLocalPin: (phone: string, pin: string) => Promise<void>;
  login: (phone: string, pin: string) => Promise<boolean>;
  logout: () => void;
  /** Erase this person's account on this device and online. Asks for the PIN again. */
  deleteAccount: (pin: string) => Promise<"ok" | "wrong" | "offline">;
  loadDemo: () => Promise<void>;

  updateProfile: (p: Partial<Profile>) => void;
  addWork: (w: Omit<Work, "id" | "createdAt">) => void;
  removeWork: (id: string) => void;
  updateWork: (id: string, w: Partial<Omit<Work, "id" | "createdAt">>) => void;
  addEntries: (e: Omit<Entry, "id">[]) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, e: Partial<Omit<Entry, "id">>) => void;
  togglePaid: (id: string) => void;
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
  setGameStars: (game: string, stars: number) => void;
  markLessonRead: (lesson: string) => void;

  setupBusiness: (b: { name: string; type: BizType }) => void;
  updateBusiness: (b: Partial<Pick<Business, "name" | "type">>) => void;
  addBizEntries: (e: Omit<BizEntry, "id">[]) => void;
  updateBizEntry: (id: string, e: Partial<Omit<BizEntry, "id">>) => void;
  removeBizEntry: (id: string) => void;
  addProduct: (p: Omit<Product, "id" | "createdAt">) => void;
  updateProduct: (id: string, p: Partial<Omit<Product, "id" | "createdAt">>) => void;
  removeProduct: (id: string) => void;
  addBizGoal: (g: { preset: string; name: string; target: number }) => string;
  updateBizGoal: (id: string, g: Partial<Pick<Goal, "name" | "target">>) => void;
  removeBizGoal: (id: string) => void;
  bizDeposit: (goalId: string, amount: number) => void;
  setBizPlan: (goalId: string, plan: { amount: number; every: Plan["every"] } | null) => void;
  payMyself: (amount: number) => void;
  setMyPay: (p: { amount: number; every: MyPay["every"] } | null, payNow?: boolean) => void;
  confirmMyPay: () => void;
  addStock: (i: Omit<StockItem, "id" | "updatedAt">) => void;
  updateStock: (id: string, i: Partial<Omit<StockItem, "id">>) => void;
  removeStock: (id: string) => void;
};

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

async function hashPin(phone: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`mi-camino:${phone}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function withBiz(d: UserData, fn: (b: Business) => Business): UserData {
  if (!d.business) return d;
  const next = fn(d.business);
  return next === d.business ? d : { ...d, business: next };
}

function mutateCurrent(state: State, fn: (d: UserData) => UserData): Partial<State> {
  if (!state.current) return {};
  const acc = state.accounts[state.current];
  if (!acc) return {};
  const next = fn(acc.data);
  if (next === acc.data) return {};
  return { accounts: { ...state.accounts, [state.current]: { ...acc, data: { ...next, updatedAt: new Date().toISOString() } } } };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      accounts: {},
      current: null,
      deviceLang: "es",
      voiceOn: false,
      textBig: false,
      touring: false,
      cloud: "off",
      needsNewPin: false,
      loginProblem: null,

      setDeviceLang: (l) =>
        set((s) => ({ deviceLang: l, ...mutateCurrent(s, (d) => ({ ...d, profile: { ...d.profile, lang: l } })) })),
      setVoiceOn: (v) => set({ voiceOn: v }),
      setTextBig: (v) => set({ textBig: v }),
      setTouring: (v) => set({ touring: v }),

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

      register: async (phone, pin, profile, recovery) => {
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
          if (r === "ok") {
            await get().syncDown();
            if (recovery && (await recoverySet(recovery.question, recovery.answer))) get().updateProfile({ recoveryQ: recovery.question });
          } else if (get().current === p) set({ cloud: "local" });
        })();
      },
      setRecovery: async (question, answer) => {
        const ok = await recoverySet(question, answer);
        if (ok) get().updateProfile({ recoveryQ: question });
        return ok;
      },
      resetLocalPin: async (phone, pin) => {
        const p = onlyDigits(phone);
        const acc = get().accounts[p];
        if (!acc) return;
        const pinHash = await hashPin(p, pin);
        set((s) => ({ accounts: { ...s.accounts, [p]: { ...acc, pinHash } } }));
      },
      login: async (phone, pin) => {
        const first = onlyDigits(phone);
        let locked = false;
        const tryOnline = async (p: string) => {
          const r = await cloudSignIn(p, pin);
          if (r === "locked") locked = true;
          return r;
        };
        // Try the number as typed, then the same digits as the other country (US ↔ Mexico)
        for (const p of [first, altPhoneKey(first)].filter((x): x is string => !!x)) {
          const ok = await (async (): Promise<boolean> => {
            const acc = get().accounts[p];
            if (acc && (await hashPin(p, pin)) !== acc.pinHash) {
              // The PIN may have been changed on another device or recovered online
              if (pin.length < 6 || p === DEMO_PHONE || (await tryOnline(p)) !== "ok") return false;
              const pinHash = await hashPin(p, pin);
              set((s) => ({ accounts: { ...s.accounts, [p]: { ...acc, pinHash } }, current: p, deviceLang: acc.data.profile.lang, cloud: "syncing" }));
              void get().syncDown();
              return true;
            }
            if (acc) {
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
            const r = await tryOnline(p);
            if (r !== "ok") return false;
            const remote = await cloudLoad();
            const data: UserData = remote?.data ?? {
              profile: { name: "", lang: get().deviceLang, casita: true, negocio: false, createdAt: new Date().toISOString() },
              work: [], entries: [], goals: [],
            };
            const h = await hashPin(p, pin);
            set((s) => ({ accounts: { ...s.accounts, [p]: { pinHash: h, data } }, current: p, deviceLang: data.profile.lang, cloud: "saved" }));
            return true;
          })();
          if (ok) { set({ loginProblem: null }); return true; }
        }
        set({ loginProblem: locked ? "locked" : "wrong" });
        return false;
      },
      logout: () => { void cloudSignOut(); set({ current: null, cloud: "off", needsNewPin: false }); },
      deleteAccount: async (pin) => {
        const { current, accounts } = get();
        if (!current || !accounts[current]) return "wrong";
        if ((await hashPin(current, pin)) !== accounts[current].pinHash) return "wrong";
        if (current !== DEMO_PHONE) {
          // Make sure we're signed in online as this person, then erase the online copy.
          let online = await cloudSignedInAs(current);
          if (!online) {
            const r = await cloudSignIn(current, pin);
            if (r === "offline" || r === "locked") return "offline";
            online = r === "ok"; // "wrong" here means this account was never saved online
          }
          if (online && !(await cloudDeleteAccount())) return "offline";
        }
        set((s) => {
          const rest = { ...s.accounts };
          delete rest[current];
          return { accounts: rest, current: null, cloud: "off", needsNewPin: false };
        });
        return "ok";
      },
      changePin: async (newPin) => {
        const { current, accounts } = get();
        if (!current || !accounts[current]) return;
        const h = await hashPin(current, newPin);
        set((s) => ({ accounts: { ...s.accounts, [current]: { ...s.accounts[current], pinHash: h } }, needsNewPin: false, cloud: "syncing" }));
        const profile = get().accounts[current].data.profile;
        void (async () => {
          // Signed in already: just change the online PIN too.
          if (await cloudSignedInAs(current)) {
            if (await cloudChangePin(current, newPin)) { await get().syncDown(); return; }
          }
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
      togglePaid: (id) =>
        set((s) =>
          mutateCurrent(s, (d) => ({
            ...d,
            entries: d.entries.map((x) => {
              if (x.id !== id || x.repeat === "once") return x;
              const k = periodKey(x);
              const paid = x.paid ?? [];
              return { ...x, paid: paid.includes(k) ? paid.filter((p) => p !== k) : [...paid.slice(-23), k] };
            }),
          })),
        ),
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
            const planned = applyGoalPlans(d.goals);
            let changed = !!planned;
            const goals = planned ?? d.goals;
            const bizPlanned = d.business ? applyGoalPlans(d.business.goals) : null;
            if (bizPlanned) changed = true;
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
            if (!changed) return d;
            return { ...d, goals: fixedGoals, business: d.business && bizPlanned ? { ...d.business, goals: bizPlanned } : d.business };
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
      setupBusiness: ({ name, type }) =>
        set((s) =>
          mutateCurrent(s, (d) => ({
            ...d,
            profile: { ...d.profile, negocio: true },
            business: d.business ? { ...d.business, name, type } : { name, type, entries: [], products: [], goals: [], createdAt: new Date().toISOString() },
          })),
        ),
      updateBusiness: (b) => set((s) => mutateCurrent(s, (d) => withBiz(d, (x) => ({ ...x, ...b })))),
      addBizEntries: (es) =>
        set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, entries: [...es.map((e) => ({ ...e, id: uid() })), ...b.entries] })))),
      updateBizEntry: (id, e) =>
        set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, entries: b.entries.map((x) => (x.id === id ? { ...x, ...e } : x)) })))),
      removeBizEntry: (id) => set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, entries: b.entries.filter((x) => x.id !== id) })))),
      addProduct: (p) =>
        set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, products: [...b.products, { ...p, id: uid(), createdAt: new Date().toISOString() }] })))),
      updateProduct: (id, p) =>
        set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, products: b.products.map((x) => (x.id === id ? { ...x, ...p } : x)) })))),
      removeProduct: (id) => set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, products: b.products.filter((x) => x.id !== id) })))),
      addBizGoal: ({ preset, name, target }) => {
        const id = uid();
        set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, goals: [...b.goals, { id, preset, name, target, deposits: [], createdAt: new Date().toISOString() }] }))));
        return id;
      },
      updateBizGoal: (id, g) =>
        set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, goals: b.goals.map((x) => (x.id === id ? { ...x, ...g } : x)) })))),
      removeBizGoal: (id) => set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, goals: b.goals.filter((x) => x.id !== id) })))),
      bizDeposit: (goalId, amount) =>
        set((s) =>
          mutateCurrent(s, (d) =>
            withBiz(d, (b) => ({ ...b, goals: b.goals.map((g) => (g.id === goalId ? { ...g, deposits: [...g.deposits, { id: uid(), amount, date: new Date().toISOString() }] } : g)) })),
          ),
        ),
      setBizPlan: (goalId, plan) =>
        set((s) =>
          mutateCurrent(s, (d) =>
            withBiz(d, (b) => ({ ...b, goals: b.goals.map((g) => (g.id === goalId ? withPlan(g, plan) : g)) })),
          ),
        ),
      payMyself: (amount) =>
        set((s) =>
          mutateCurrent(s, (d) => {
            if (!d.business || amount <= 0) return d;
            const date = new Date().toISOString();
            return {
              ...d,
              entries: [{ id: uid(), kind: "in", category: "mi_negocio", amount, repeat: "once", note: d.business.name, date, source: "manual" }, ...d.entries],
              business: { ...d.business, entries: [{ id: uid(), kind: "out", category: "mi_sueldo", amount, repeat: "once", note: "", date, source: "manual" }, ...d.business.entries] },
            };
          }),
        ),
      setMyPay: (p, payNow) => {
        set((s) =>
          mutateCurrent(s, (d) =>
            withBiz(d, (b) => ({ ...b, pay: p ? { amount: p.amount, every: p.every, since: b.pay?.since ?? new Date().toISOString(), paid: b.pay?.paid ?? [] } : null })),
          ),
        );
        if (p && payNow) get().confirmMyPay();
      },
      confirmMyPay: () => {
        const b = get().accounts[get().current ?? ""]?.data.business;
        if (!b?.pay) return;
        const k = periodKey({ repeat: b.pay.every, date: b.pay.since });
        if (b.pay.paid.includes(k)) return;
        get().payMyself(b.pay.amount);
        set((s) => mutateCurrent(s, (d) => withBiz(d, (x) => (x.pay ? { ...x, pay: { ...x.pay, paid: [...x.pay.paid.slice(-23), k] } } : x))));
      },
      addStock: (i) =>
        set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, stock: [...(b.stock ?? []), { ...i, id: uid(), updatedAt: new Date().toISOString() }] })))),
      updateStock: (id, i) =>
        set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, stock: (b.stock ?? []).map((x) => (x.id === id ? { ...x, ...i, updatedAt: new Date().toISOString() } : x)) })))),
      removeStock: (id) => set((s) => mutateCurrent(s, (d) => withBiz(d, (b) => ({ ...b, stock: (b.stock ?? []).filter((x) => x.id !== id) })))),
      setGameStars: (game, stars) =>
        set((s) =>
          mutateCurrent(s, (d) => {
            const l = d.learn ?? { stars: {}, read: [] };
            if ((l.stars[game] ?? 0) >= stars) return d;
            return { ...d, learn: { ...l, stars: { ...l.stars, [game]: stars } } };
          }),
        ),
      markLessonRead: (lesson) =>
        set((s) =>
          mutateCurrent(s, (d) => {
            const l = d.learn ?? { stars: {}, read: [] };
            if (l.read.includes(lesson)) return d;
            return { ...d, learn: { ...l, read: [...l.read, lesson] } };
          }),
        ),
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

/** The signed-in person's data, or null. */
export function useMe(): UserData | null {
  return useStore((s) => (s.current ? s.accounts[s.current]?.data ?? null : null));
}

/** Current language: the profile's if signed in, else the device choice. */
/** Where the signed-in person lives (New York City for older accounts). */
export function useRegion(): Region {
  const p = useStore((s) => (s.current ? s.accounts[s.current]?.data.profile : undefined));
  return regionOf(p);
}

export function useLang(): Lang {
  return useStore((s) => (s.current ? s.accounts[s.current]?.data.profile.lang : undefined) ?? s.deviceLang);
}

// Money shows in pesos for people who live in México, in dollars for everyone else.
if (typeof window !== "undefined") {
  const sync = (st: State) => setCurrency(regionOf(st.current ? st.accounts[st.current]?.data.profile : undefined).country === "mx" ? "MXN" : "USD");
  sync(useStore.getState());
  useStore.subscribe(sync);
}
