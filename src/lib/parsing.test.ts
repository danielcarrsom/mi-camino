import { describe, expect, it } from "vitest";
import { understandLocally, repeatIn } from "./understand";
import { parseBiz } from "./business";
import { altPhoneKey, detectCountry, formatPhoneKey, phoneKey } from "./phone";

describe("understanding what people say or type (without AI)", () => {
  it("reads pay and how often", () => {
    const r = understandLocally("me pagaron 650 dolares por semana", "in");
    expect(r.entries[0]).toMatchObject({ kind: "in", category: "trabajo", amount: 650, repeat: "week" });
  });
  it("reads rent paid monthly", () => {
    expect(understandLocally("pague la renta 1200 al mes", "out").entries[0]).toMatchObject({ category: "renta", amount: 1200, repeat: "month" });
  });
  it("understands 'cada quince días' as every two weeks", () => {
    expect(repeatIn("cada quince días")).toBe("2weeks");
  });
});

describe("business entries", () => {
  it("does not confuse 'gasté' with gas", () => {
    expect(parseBiz("gasté 50 en masa")).toMatchObject({ kind: "out", category: "mercancia", amount: 50 });
  });
  it("multiplies pieces by price", () => {
    expect(parseBiz("vendí 40 tamales a 3 dólares")).toMatchObject({ kind: "in", category: "ventas", amount: 120 });
  });
});

describe("phone numbers", () => {
  it("keeps US numbers as 10 digits and Mexican ones with 52", () => {
    expect(phoneKey("(917) 555-0123", "us")).toBe("9175550123");
    expect(phoneKey("55 1234 5678", "mx")).toBe("525512345678");
    expect(formatPhoneKey("525512345678")).toBe("+52 55 1234 5678");
  });
  it("finds an account saved with the other country by mistake", () => {
    expect(altPhoneKey("5512345678")).toBe("525512345678");
    expect(detectCountry("+52 55 1234 5678", "us")).toBe("mx");
  });
});
