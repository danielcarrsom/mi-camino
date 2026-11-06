// Mi Camino PIN recovery. No email or SMS: people prove who they are with
// their security question, or with a one-time code given in person
// (for example at the Consulate). Failed tries are limited per phone.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, cors, json, loginEmail, passwordFor } from "../_shared/auth.ts";

const QUESTIONS = ["pueblo", "mama", "mascota", "comida", "escuela", "apodo"];
const MAX_FAILS = 5;            // per phone
const WINDOW_MIN = 60;          // in this many minutes

const PEPPER = Deno.env.get("RECOVERY_PEPPER") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Same answer however it is typed or said: no accents, case, spaces or filler words. */
function normAnswer(s: string) {
  let t = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  t = t.replace(/^(mi |su )?(mama |mascota |perro |perrito |gato |pueblo |escuela |apodo |comida favorita )?(se llama(ba)? |es |era |me dicen |me decian |nacio en |naci en |en )/, "");
  t = t.replace(/^(el |la |los |las )/, "");
  return t.replace(/ /g, "");
}
const normCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
const answerHash = (uid: string, answer: string) => sha256(`${PEPPER}:${uid}:${normAnswer(answer)}`);

async function userIdFor(phone: string): Promise<string | null> {
  const { data } = await admin.rpc("user_id_by_login", { login: loginEmail(phone) });
  return (data as string | null) ?? null;
}

async function recentFails(phone: string) {
  const since = new Date(Date.now() - WINDOW_MIN * 60000).toISOString();
  const { count } = await admin.from("recovery_attempts").select("id", { count: "exact", head: true }).eq("phone", phone).eq("ok", false).gte("at", since);
  return count ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const action = String(body.action ?? "");

  // ----- save my security question (signed in) -----
  if (action === "set") {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: u, error } = await admin.auth.getUser(token);
    if (error || !u.user) return json({ error: "auth" }, 401);
    const question = String(body.question ?? "");
    const answer = String(body.answer ?? "");
    if (!QUESTIONS.includes(question)) return json({ error: "bad_question" }, 400);
    if (normAnswer(answer).length < 2) return json({ error: "short_answer" }, 400);
    const { error: e2 } = await admin.from("recovery").upsert({ user_id: u.user.id, question, answer_hash: await answerHash(u.user.id, answer), updated_at: new Date().toISOString() });
    if (e2) return json({ error: "save_failed" }, 500);
    return json({ ok: true });
  }

  const phone = String(body.phone ?? "").replace(/\D/g, "");
  if (phone.length < 10 || phone.length > 15 || phone === "0000000000") return json({ error: "bad_phone" }, 400);

  // ----- does this phone have an account, and which question? -----
  if (action === "question") {
    const uid = await userIdFor(phone);
    if (!uid) return json({ exists: false, question: null });
    const { data } = await admin.from("recovery").select("question").eq("user_id", uid).maybeSingle();
    return json({ exists: true, question: data?.question ?? null });
  }

  // ----- set a new PIN after proving who you are -----
  if (action === "reset") {
    const pin = String(body.pin ?? "");
    if (!/^\d{6}$/.test(pin)) return json({ error: "bad_pin" }, 400);
    const fails = await recentFails(phone);
    if (fails >= MAX_FAILS) return json({ error: "locked", minutes: WINDOW_MIN }, 429);

    const uid = await userIdFor(phone);
    let ok = false;
    let codeId: string | null = null;
    if (uid && typeof body.code === "string" && body.code.trim()) {
      const h = await sha256(normCode(body.code));
      const { data } = await admin.from("recovery_codes").select("id").eq("user_id", uid).eq("code_hash", h).is("used_at", null).gt("expires_at", new Date().toISOString()).limit(1).maybeSingle();
      if (data) { ok = true; codeId = data.id; }
    } else if (uid && typeof body.answer === "string") {
      const { data } = await admin.from("recovery").select("answer_hash").eq("user_id", uid).maybeSingle();
      if (data && data.answer_hash === await answerHash(uid, body.answer)) ok = true;
    }
    await admin.from("recovery_attempts").insert({ phone, ok });
    if (!ok) return json({ error: "wrong", left: Math.max(0, MAX_FAILS - fails - 1) }, 403);

    const { error } = await admin.auth.admin.updateUserById(uid!, { password: await passwordFor(phone, pin) });
    if (error) return json({ error: "update_failed" }, 500);
    if (codeId) await admin.from("recovery_codes").update({ used_at: new Date().toISOString() }).eq("id", codeId);
    return json({ ok: true });
  }

  return json({ error: "action" }, 400);
});
