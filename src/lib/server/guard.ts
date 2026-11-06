import "server-only";
// Barriers in front of the routes that cost money (Claude and ElevenLabs):
// 1. Only our own pages may call them (checked with the browser's Origin header).
// 2. Each visitor (by IP) gets a limited number of calls per minute and per day.
// 3. Requests that are too big are refused before anything is read.
//
// The counters live in this server's memory, so on Vercel each running copy
// keeps its own count: a determined attacker could get a few more calls, but
// casual abuse and runaway loops are stopped. For a hard cap, add a rate-limit
// rule in Vercel → Firewall, and set a monthly spend limit in the Anthropic and
// ElevenLabs consoles (see SECURITY.md).

type Limit = { perMinute: number; perDay: number; maxBytes: number };

export const LIMITS = {
  entender: { perMinute: 20, perDay: 300, maxBytes: 20_000 },
  foto: { perMinute: 6, perDay: 60, maxBytes: 8_000_000 },
  explicar: { perMinute: 4, perDay: 40, maxBytes: 25_000_000 },
  hablar: { perMinute: 40, perDay: 600, maxBytes: 10_000 },
  escuchar: { perMinute: 15, perDay: 200, maxBytes: 16_000_000 },
} satisfies Record<string, Limit>;

const hits = new Map<string, number[]>();
let lastSweep = Date.now();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

/** Our own site: the host the request came to, plus any listed in ALLOWED_ORIGINS. */
function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Browsers always send Origin on POST from a page. No Origin means a script:
    // allow it only when it says it comes from our own site.
    const site = req.headers.get("sec-fetch-site");
    return site === "same-origin";
  }
  let host: string;
  try { host = new URL(origin).host; } catch { return false; }
  const allowed = new Set([req.headers.get("host") ?? "", ...(process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)]);
  return allowed.has(host);
}

function sweep(now: number) {
  if (now - lastSweep < 10 * 60_000) return;
  lastSweep = now;
  for (const [k, list] of hits) {
    const keep = list.filter((t) => now - t < 86_400_000);
    if (keep.length) hits.set(k, keep); else hits.delete(k);
  }
}

/**
 * Returns a Response to send back if the request must be refused, or null if it may go on.
 * Use it as the first line of a route: `const no = guard(req, "foto"); if (no) return no;`
 */
export function guard(req: Request, route: keyof typeof LIMITS): Response | null {
  const limit: Limit = LIMITS[route];
  if (!originAllowed(req)) return Response.json({ error: "forbidden" }, { status: 403 });

  const len = Number(req.headers.get("content-length") || 0);
  if (len > limit.maxBytes) return Response.json({ error: "too big" }, { status: 413 });

  const now = Date.now();
  sweep(now);
  const key = `${route}:${clientIp(req)}`;
  const list = (hits.get(key) ?? []).filter((t) => now - t < 86_400_000);
  const lastMinute = list.filter((t) => now - t < 60_000).length;
  if (lastMinute >= limit.perMinute || list.length >= limit.perDay) {
    hits.set(key, list);
    const retry = lastMinute >= limit.perMinute ? 60 : 3600;
    return Response.json({ error: "slow down" }, { status: 429, headers: { "Retry-After": String(retry) } });
  }
  list.push(now);
  hits.set(key, list);
  return null;
}

/** Only for tests. */
export function _resetGuard() { hits.clear(); }
