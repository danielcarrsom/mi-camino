import { connection } from "next/server";

// Today's exchange rate from US dollars. Cached for an hour; if the source
// can't be reached we return an approximate rate and say so.
type Rates = { MXN: number; GTQ: number; HNL: number };
const FALLBACK: Rates = { MXN: 18.5, GTQ: 7.7, HNL: 26 };

let cache: { rates: Rates; updated: string; at: number } | null = null;

export async function GET() {
  await connection();
  if (cache && Date.now() - cache.at < 60 * 60 * 1000) {
    return Response.json({ rates: cache.rates, updated: cache.updated, approx: false, source: "open.er-api.com" });
  }
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store", signal: AbortSignal.timeout(6000) });
    const j = (await r.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
    if (j.result !== "success" || !j.rates?.MXN) throw new Error("bad rates");
    const rates: Rates = { MXN: j.rates.MXN, GTQ: j.rates.GTQ ?? FALLBACK.GTQ, HNL: j.rates.HNL ?? FALLBACK.HNL };
    cache = { rates, updated: j.time_last_update_utc ?? new Date().toUTCString(), at: Date.now() };
    return Response.json({ rates, updated: cache.updated, approx: false, source: "open.er-api.com" });
  } catch {
    return Response.json({ rates: FALLBACK, updated: null, approx: true, source: null });
  }
}
