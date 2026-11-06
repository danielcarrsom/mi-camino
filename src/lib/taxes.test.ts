import { describe, expect, it } from "vitest";
import { US_STATES, cashSetAsideWeekly, resicoRate, takeHomeWeekly, weeklyTaxes, yearlyTaxes, type Region } from "./taxes";

const NYC: Region = { country: "us", state: "NY", nyc: true };
const part = (b: ReturnType<typeof weeklyTaxes>, id: string) => b.parts.find((p) => p.id === id)?.amount ?? 0;

describe("United States, 2026", () => {
  // $864 a week = $44,928 a year, single, New York City. Worked out by hand:
  // federal (44,928 − 16,100) → 1,240 + 1,971.36 = 3,211.36
  // NY state (44,928 − 8,000 = 36,928) → 331.50 + 140.80 + 113.30 + 1,243.51 = 1,829.11
  // NYC (36,928) → 369.36 + 489.06 + 455.53 = 1,313.95
  it("matches a hand calculation for a cook in New York City", () => {
    const t = weeklyTaxes(864, NYC);
    expect(part(t, "federal")).toBeCloseTo(3211.36 / 52, 2);
    expect(part(t, "ss")).toBeCloseTo(864 * 0.062, 2);
    expect(part(t, "medicare")).toBeCloseTo(864 * 0.0145, 2);
    expect(part(t, "state")).toBeCloseTo(1829.11 / 52, 1);
    expect(part(t, "city")).toBeCloseTo(1313.95 / 52, 1);
    expect(t.net).toBeCloseTo(675.7, 0);
  });

  it("charges no state tax in Texas or Florida, and no city tax outside NYC", () => {
    for (const state of ["TX", "FL", "WA", "NV"]) {
      const t = weeklyTaxes(864, { country: "us", state });
      expect(part(t, "state")).toBe(0);
      expect(part(t, "city")).toBe(0);
    }
    expect(part(weeklyTaxes(864, { country: "us", state: "NY", nyc: false }), "city")).toBe(0);
  });

  it("taxes a married couple less than a single person on the same pay", () => {
    expect(weeklyTaxes(1200, { ...NYC, married: true }).total).toBeLessThan(weeklyTaxes(1200, NYC).total);
  });

  it("stops Social Security at the 2026 wage base ($184,500)", () => {
    expect(yearlyTaxes(300000, NYC).parts.find((p) => p.id === "ss")!.amount).toBeCloseTo(184500 * 0.062, 2);
  });

  it("has every state and D.C., with brackets in order", () => {
    expect(Object.keys(US_STATES)).toHaveLength(51);
    for (const [code, s] of Object.entries(US_STATES)) {
      for (const list of [s.s, s.m]) {
        if (!list) continue;
        for (let i = 1; i < list.length; i++) expect(list[i][0], code).toBeGreaterThan(list[i - 1][0]);
      }
    }
  });

  it("never returns negative taxes or more tax than pay", () => {
    for (const state of Object.keys(US_STATES)) {
      for (const pay of [0, 100, 500, 1500, 5000]) {
        const t = weeklyTaxes(pay, { country: "us", state });
        expect(t.total, state).toBeGreaterThanOrEqual(0);
        expect(t.total, state).toBeLessThanOrEqual(pay);
      }
    }
  });

  it("keeps cash pay whole and suggests setting money aside", () => {
    expect(takeHomeWeekly(700, { mode: "cash" }, NYC)).toBe(700);
    expect(takeHomeWeekly(700, { mode: "net" }, NYC)).toBe(700);
    expect(cashSetAsideWeekly(700, NYC)).toBeGreaterThan(100);
    expect(cashSetAsideWeekly(0, NYC)).toBe(0);
  });
});

describe("México, 2026", () => {
  const MX: Region = { country: "mx" };
  const perWeek = (monthly: number) => (monthly * 12) / 52;

  it("takes nothing from the minimum wage ($315.04 a day)", () => {
    const t = weeklyTaxes(315.04 * 7, MX);
    expect(t.total).toBe(0);
  });

  it("applies the 2026 ISR table: $15,000 a month", () => {
    // 1,339.14 + (15,000 − 14,644.65) × 17.92% = 1,402.82 (above the subsidy limit)
    const t = weeklyTaxes(perWeek(15000), MX);
    expect(part(t, "isr")).toBeCloseTo(perWeek(1402.82), 1);
    expect(part(t, "imss")).toBeGreaterThan(0);
  });

  it("subtracts the employment subsidy up to $11,492.66 a month", () => {
    // 420.95 + (10,000 − 7,168.52) × 10.88% − 535.65 = 193.37
    expect(part(weeklyTaxes(perWeek(10000), MX), "isr")).toBeCloseTo(perWeek(193.37), 1);
  });

  it("uses the RESICO rate for people who work on their own", () => {
    expect(resicoRate(20000)).toBe(0.01);
    expect(resicoRate(60000)).toBe(0.015);
    expect(cashSetAsideWeekly(1000, MX)).toBeCloseTo(10, 5);
  });
});
