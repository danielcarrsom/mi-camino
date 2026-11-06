// The shapes of everything a person saves: profile, work, money in and out,
// goals, tandas and the business. Plain data, stored as one JSON document.
import type { Lang } from "./i18n";
import type { Repeat } from "./catalog";
import type { WorkTax } from "./taxes";
import type { BizEntry, Product, BizType, StockItem, MyPay } from "./business";

export type Profile = {
  name: string;
  lang: Lang;
  casita: boolean;
  negocio: boolean;
  createdAt: string;
  recoveryQ?: string;     // id of the security question chosen (the answer lives only on the server)
  tourDone?: boolean;     // finished the guided tour
  stepsHiddenCasita?: boolean;
  stepsHiddenNegocio?: boolean;
  // Where you live: decides taxes and whether money is in dollars or pesos
  country?: "us" | "mx";
  usState?: string;       // two letters, e.g. "NY"
  nyc?: boolean;          // lives in one of New York City's five boroughs
  married?: boolean;      // files taxes as married
  avatar?: string;        // id of the animal picked as profile picture
  termsAccepted?: string; // version of the privacy notice + terms accepted (see src/lib/legal.ts)
  termsAcceptedAt?: string;
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
  tax?: WorkTax;          // are taxes taken out? where do you live? (missing = taken out, NYC)
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
  paid?: string[];        // fixed payments: the periods the person confirmed they paid
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
  learn?: Learn;
  business?: Business;
  updatedAt?: string;          // last change on this device or in the cloud
};

/** Mi Negocio: its own money, products and goals, kept apart from the home. */
export type Business = {
  name: string;
  type: BizType;
  entries: BizEntry[];
  products: Product[];
  goals: Goal[];
  createdAt: string;
  pay?: MyPay | null;
  stock?: StockItem[];
};

/** Best stars per game (0–3) and lessons finished. */
export type Learn = { stars: Record<string, number>; read: string[] };

export type CloudStatus = "off" | "syncing" | "saved" | "local";
