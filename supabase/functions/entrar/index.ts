// Mi Camino sign-in and PIN change.
// - login: phone + PIN → a Supabase session. After 5 wrong PINs in 15 minutes the
//   phone is locked for 15 minutes; one network address gets 30 wrong tries per 15 minutes.
// - change_pin: signed in → new PIN.
// Accounts made before the server secret existed are moved to it at their next login.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { admin, cleanPhone, cors, json, legacyPassword, loginEmail, passwordFor, validPhone, validPin } from "../_shared/auth.ts";

const MAX_FAILS_PHONE = 5;
const MAX_FAILS_IP = 30;
const WINDOW_MIN = 15;

const anonClient = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });

async function fails(column: "phone" | "ip", value: string) {
  const since = new Date(Date.now() - WINDOW_MIN * 60000).toISOString();
  const { count } = await admin.from("login_attempts").select("id", { count: "exact", head: true }).eq(column, value).eq("ok", false).gte("at", since);
  return count ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const action = String(body.action ?? "");

  // ----- change my PIN (signed in) -----
  if (action === "change_pin") {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: u, error } = await admin.auth.getUser(token);
    if (error || !u.user) return json({ error: "auth" }, 401);
    if (!validPin(body.pin)) return json({ error: "bad_pin" }, 400);
    const phone = (u.user.email ?? "").split("@")[0];
    if (!validPhone(phone)) return json({ error: "auth" }, 401);
    const { error: e2 } = await admin.auth.admin.updateUserById(u.user.id, { password: await passwordFor(phone, String(body.pin)) });
    return e2 ? json({ error: "update_failed" }, 500) : json({ ok: true });
  }

  if (action !== "login") return json({ error: "action" }, 400);

  // ----- sign in -----
  const phone = cleanPhone(body.phone);
  const pin = String(body.pin ?? "");
  if (!validPhone(phone)) return json({ error: "bad_phone" }, 400);
  if (!validPin(pin)) return json({ error: "bad_pin" }, 400);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";

  const [byPhone, byIp] = await Promise.all([fails("phone", phone), fails("ip", ip)]);
  if (byPhone >= MAX_FAILS_PHONE || byIp >= MAX_FAILS_IP) return json({ error: "locked", minutes: WINDOW_MIN }, 429);

  const auth = anonClient().auth;
  const email = loginEmail(phone);
  let { data, error } = await auth.signInWithPassword({ email, password: await passwordFor(phone, pin) });
  if (error) {
    // Older account: try the old kind of password once and move it to the new kind.
    const legacy = await auth.signInWithPassword({ email, password: legacyPassword(phone, pin) });
    if (!legacy.error && legacy.data.user) {
      await admin.auth.admin.updateUserById(legacy.data.user.id, { password: await passwordFor(phone, pin) });
      ({ data, error } = legacy);
    }
  }

  await admin.from("login_attempts").insert({ phone, ip, ok: !error });
  // Now and then, erase attempt records older than 30 days (promised in the privacy notice).
  if (Math.random() < 0.05) {
    const old = new Date(Date.now() - 30 * 86400000).toISOString();
    await Promise.all([admin.from("login_attempts").delete().lt("at", old), admin.from("recovery_attempts").delete().lt("at", old)]);
  }
  if (error || !data.session) {
    // Unknown phone and wrong PIN look the same from outside.
    return json({ error: "wrong", left: Math.max(0, MAX_FAILS_PHONE - byPhone - 1) }, 403);
  }
  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
});
