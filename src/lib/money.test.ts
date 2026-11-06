import { afterEach, describe, expect, it } from "vitest";
import { localAmount, money, moneySpoken, setCurrency, toMonthly, toWeekly } from "./money";

afterEach(() => setCurrency("USD"));

describe("money", () => {
  it("turns weekly and monthly amounts into each other", () => {
    expect(toMonthly(100, "week")).toBeCloseTo((100 * 52) / 12, 5);
    expect(toWeekly(1200, "month")).toBeCloseTo((1200 * 12) / 52, 5);
  });
  it("speaks dollars or pesos depending on where the person lives", () => {
    expect(moneySpoken(20, "es")).toBe("20 dólares");
    setCurrency("MXN");
    expect(moneySpoken(20, "es")).toBe("20 pesos");
    expect(money(12500, "es")).toBe("$12,500");
  });
  it("scales suggested amounts to pesos with round numbers", () => {
    expect(localAmount(1000)).toBe(1000);
    setCurrency("MXN");
    expect(localAmount(1000)).toBe(8000);
    expect(localAmount(15000)).toBe(120000);
  });
});
