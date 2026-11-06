import "server-only";
// Barriers in front of the routes that cost money (Claude and ElevenLabs):
// 1. Only our own pages may call them (checked with the browser's Origin header).
// 2. Requests that are too big are refused before anything is read.
// 3. Each visitor gets a limited number of calls per minute and per day. The
//    count is kept in the database (public.rate_limit_hit), so it's the same on
//    every server. If the database doesn't answer quickly, a count kept in this
//    server's memory is used instead, so the app never stops working.
// Visitors are identified by an HMAC of their IP: no IP address is stored.
import { createHmac } from "node:crypto";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabaseConfig";

type Limit = { perMinute: number; perDay: number; maxBytes: number };

export const LIMITS = {
  entender: { perMinute: 20, perDay: 300, maxBytes: 20_000 },
  foto: { perMinute: 6, perDay: 60, maxBytes: 8_000_000 },
  explicar: { perMinute: 4, perDay: 40, maxBytes: 25_000_000 },
  hablar: { perMinute: 40, perDay: 600, maxBytes: 10_000 },
  escuchar: { perMinute: 15, perDay: 200, maxBytes: 16_000_000 },
} satisfies Record<string, Limit>;
export type Route = keyof typeof LIMITS;

const REMOTE_TIMEOUT_MS = 800;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

/** A stable, private id for this visitor on this route. */
function visitorKey(req: Request, route: Route): string {
  const secret = process.env.RATE_LIMIT_SECRET || process.env.ANTHROPIC_API_KEY || process.env.MI_CAMINO_AI_KEY || process.env.ELEVENLABS_API_KEY || "mi-camino";
  return `${route}:${createHmac("sha256", secret).update(clientIp(req)).digest("hex").slice(0, 32)}`;
}

/** Our own site: the host the request came to, plus any listed in ALLOWED_ORIGINS. */
function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Browsers always send Origin on POST from a page. No Origin means a script:
    // allow it only when the browser says the call comes from our own site.
    return req.headers.get("sec-fetch-site") === "same-origin";
  }
  let host: string;
  try { host = new URL(origin).host; } catch { return false; }
  const allowed = new Set([req.headers.get("host") ?? "", ...(process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)]);
  return allowed.has(host);
}

// ---------- counting in this server's memory (backup) ----------
const hits = new Map<string, number[]>();
let lastSweep = Date.now();
function localHit(key: string, limit: Limit, now = Date.now()): boolean {
  if (now - lastSweep > 10 * 60_000) {
    lastSweep = now;
    for (const [k, list] of hits) {
      const keep = list.filter((t) => now - t < 86_400_000);
      if (keep.length) hits.set(k, keep); else hits.delete(k);
    }
  }
  const list = (hits.get(key) ?? []).filter((t) => now - t < 86_400_000);
  const lastMinute = list.filter((t) => now - t < 60_000).length;
  if (lastMinute >= limit.perMinute || list.length >= limit.perDay) { hits.set(key, list); return false; }
  list.push(now);
  hits.set(key, list);
  return true;
}

// ---------- counting in the database (shared by every server) ----------
async function remoteHit(key: string, limit: Limit): Promise<boolean | null> {
  if (process.env.NODE_ENV === "test" || process.env.RATE_LIMIT_LOCAL_ONLY === "1") return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/rate_limit_hit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ p_key: key, p_per_minute: limit.perMinute, p_per_day: limit.perDay }),
      signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) === true;
  } catch {
    return null; // slow or unreachable: fall back to memory
  }
}

/**
 * Returns a Response to send back if the request must be refused, or null if it may go on.
 * First line of every paid route: `const refused = await guard(req, "foto"); if (refused) return refused;`
 */
export async function guard(req: Request, route: Route): Promise<Response | null> {
  const limit: Limit = LIMITS[route];
  if (!originAllowed(req)) return Response.json({ error: "forbidden" }, { status: 403 });

  const len = Number(req.headers.get("content-length") || 0);
  if (len > limit.maxBytes) return Response.json({ error: "too big" }, { status: 413 });

  const key = visitorKey(req, route);
  const allowed = (await remoteHit(key, limit)) ?? localHit(key, limit);
  if (!allowed) return Response.json({ error: "slow down" }, { status: 429, headers: { "Retry-After": "60" } });
  return null;
}

/** Only for tests. */
export function _resetGuard() { hits.clear(); }
