import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { _resetGuard, guard, LIMITS } from "./guard";

const req = (headers: Record<string, string>) => new Request("https://mi-camino.app/api/entender", { method: "POST", headers: { host: "mi-camino.app", ...headers } });

describe("guard on paid routes", async () => {
  beforeEach(() => _resetGuard());

  it("lets our own pages through", async () => {
    expect(await guard(req({ origin: "https://mi-camino.app", "x-forwarded-for": "1.1.1.1" }), "entender")).toBeNull();
  });

  it("refuses other websites and scripts without an origin", async () => {
    expect((await guard(req({ origin: "https://evil.example", "x-forwarded-for": "1.1.1.1" }), "entender"))?.status).toBe(403);
    expect((await guard(req({ "x-forwarded-for": "1.1.1.1" }), "entender"))?.status).toBe(403);
  });

  it("refuses requests that are too big", async () => {
    expect((await guard(req({ origin: "https://mi-camino.app", "content-length": String(LIMITS.entender.maxBytes + 1) }), "entender"))?.status).toBe(413);
  });

  it("slows down one visitor after too many calls, without blocking others", async () => {
    const from = (ip: string) => req({ origin: "https://mi-camino.app", "x-forwarded-for": ip });
    for (let i = 0; i < LIMITS.foto.perMinute; i++) expect(await guard(from("2.2.2.2"), "foto")).toBeNull();
    expect((await guard(from("2.2.2.2"), "foto"))?.status).toBe(429);
    expect(await guard(from("3.3.3.3"), "foto")).toBeNull();
  });
});
