import { describe, expect, it } from "vitest";
import { goalSaved, isPaidNow, periodKey, planActive, regionOf, summarize, tandaCurrentRound, tandaEnded, tandaPot } from "./model";
import type { Goal, Tanda, UserData } from "./types";

const base = (over: Partial<UserData> = {}): UserData => ({
  profile: { name: "Ana", lang: "es", casita: true, negocio: false, createdAt: "2026-01-01T00:00:00Z", country: "us", usState: "TX" },
  work: [],
  entries: [],
  goals: [],
  ...over,
} as UserData);

describe("where someone lives", () => {
  it("treats older accounts as New York City", () => {
    expect(regionOf(undefined)).toMatchObject({ country: "us", state: "NY", nyc: true });
    expect(regionOf({ ...base().profile, country: undefined })).toMatchObject({ state: "NY", nyc: true });
  });
  it("reads México and other states from the profile", () => {
    expect(regionOf({ ...base().profile, country: "mx" }).country).toBe("mx");
    expect(regionOf(base().profile)).toMatchObject({ country: "us", state: "TX", nyc: false });
  });
});

describe("summary", () => {
  it("counts pay after taxes and fixed costs", () => {
    const d = base({
      work: [{ id: "w", name: "Taller", pay: 864, every: "week", hoursPerWeek: 40, daysPerWeek: 5, source: "manual", createdAt: "2026-01-01", tax: { mode: "withheld" } }],
      entries: [{ id: "r", kind: "out", category: "renta", amount: 1200, repeat: "month", note: "", date: "2026-01-01", source: "manual" }],
    });
    const s = summarize(d, () => "casa");
    expect(s.workGrossWeekly).toBe(864);
    expect(s.taxWeekly).toBeGreaterThan(100); // Texas: federal + Social Security + Medicare
    expect(s.monthOut).toBeCloseTo(1200, 5);
    expect(s.byGroup.casa).toBeCloseTo(1200, 5);
    expect(s.perHour).toBeCloseTo(864 / 40, 5); // per hour is quoted before taxes, like a wage
    expect(s.monthIn).toBeLessThan((864 * 52) / 12);
  });
});

describe("fixed payments", () => {
  it("knows which month or week a payment belongs to", () => {
    expect(periodKey({ repeat: "month", date: "2026-01-15" }, new Date(2026, 10, 6))).toBe("2026-11");
    expect(periodKey({ repeat: "week", date: "2026-01-15" }, new Date(2026, 10, 6))).toMatch(/^w2026-11-0[1-6]$/);
  });
  it("marks a bill as paid only for the current period", () => {
    const e = { id: "x", kind: "out" as const, category: "renta", amount: 1, repeat: "month" as const, note: "", date: "2026-01-01", source: "manual" as const };
    expect(isPaidNow({ ...e, paid: [periodKey(e)] })).toBe(true);
    expect(isPaidNow({ ...e, paid: ["2001-01"] })).toBe(false);
  });
});

describe("goals and tandas", () => {
  const g: Goal = { id: "g", preset: "emergencias", name: "Emergencias", target: 500, deposits: [{ id: "d", amount: 200, date: "2026-01-01" }], plan: { amount: 50, every: "week", lastApplied: "2026-01-01" }, createdAt: "2026-01-01" } as Goal;
  it("adds up deposits and stops plans once the goal is reached", () => {
    expect(goalSaved(g)).toBe(200);
    expect(planActive(g)).toBe(true);
    expect(planActive({ ...g, target: 200 })).toBe(false);
  });
  it("works out the tanda pot and rounds", () => {
    const t: Tanda = { id: "t", name: "Familia", amount: 100, every: "week", people: 10, names: [], myTurn: 3, start: "2026-01-05T12:00:00Z", paid: [], received: false, goalId: null, createdAt: "2026-01-01" } as Tanda;
    expect(tandaPot(t)).toBe(900); // whoever receives doesn't pay that round
    expect(tandaCurrentRound(t, new Date("2026-01-04"))).toBe(-1);
    expect(tandaCurrentRound(t, new Date("2026-01-13T13:00:00Z"))).toBe(1);
    expect(tandaEnded(t, new Date("2026-04-01"))).toBe(true);
  });
});
