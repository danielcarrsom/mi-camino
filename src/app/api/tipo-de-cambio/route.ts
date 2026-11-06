import { connection } from "next/server";

// Exchange rate from US dollars, refreshed every few minutes.
// 1) Coinbase's public rates (no key, updated through the day)
// 2) open.er-api.com (no key, updated daily) as a backup
// If neither answers we return an approximate rate and say so.
type Rates = { MXN: number; GTQ: number; HNL: number };
const FALLBACK: Rates = { MXN: 18.5, GTQ: 7.7, HNL: 26 };
const FRESH_MS = 5 * 60 * 1000;

let cache: { rates: Rates; updated: string; at: number; source: string } | null = null;

const ok = (n: unknown) => typeof n === "number" && isFinite(n) && n > 0;

async function fromCoinbase(): Promise<Partial<Rates>> {
  const r = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD", { cache: "no-store", signal: AbortSignal.timeout(5000) });
  const j = (await r.json()) as { data?: { rates?: Record<string, string> } };
  const g = (k: string) => Number(j.data?.rates?.[k]);
  return { MXN: g("MXN"), GTQ: g("GTQ"), HNL: g("HNL") };
}

async function fromErApi(): Promise<Partial<Rates>> {
  const r = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store", signal: AbortSignal.timeout(5000) });
  const j = (await r.json()) as { result?: string; rates?: Record<string, number> };
  if (j.result !== "success") return {};
  return { MXN: j.rates?.MXN, GTQ: j.rates?.GTQ, HNL: j.rates?.HNL };
}

export async function GET() {
  await connection();
  if (cache && Date.now() - cache.at < FRESH_MS) {
    return Response.json({ rates: cache.rates, updated: cache.updated, approx: false, source: cache.source });
  }
  const [cb, er] = await Promise.allSettled([fromCoinbase(), fromErApi()]);
  const a = cb.status === "fulfilled" ? cb.value : {};
  const b = er.status === "fulfilled" ? er.value : {};
  const pickRate = (k: keyof Rates) => (ok(a[k]) ? a[k]! : ok(b[k]) ? b[k]! : null);
  const MXN = pickRate("MXN");
  if (!MXN) {
    if (cache) return Response.json({ rates: cache.rates, updated: cache.updated, approx: false, source: cache.source });
    return Response.json({ rates: FALLBACK, updated: null, approx: true, source: null });
  }
  const rates: Rates = { MXN, GTQ: pickRate("GTQ") ?? FALLBACK.GTQ, HNL: pickRate("HNL") ?? FALLBACK.HNL };
  const source = ok(a.MXN) ? "Coinbase" : "open.er-api.com";
  cache = { rates, updated: new Date().toISOString(), at: Date.now(), source };
  return Response.json({ rates, updated: cache.updated, approx: false, source });
}
