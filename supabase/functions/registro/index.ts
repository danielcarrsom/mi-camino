// Mi Camino sign-up: creates a confirmed account from a phone number + 6-digit PIN.
// People don't need an email. The phone becomes an internal login name; nothing is sent to it.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, cleanPhone, cors, json, loginEmail, passwordFor, validPhone, validPin } from "../_shared/auth.ts";

const LANGS = ["es", "en", "mix", "nah", "yua", "quc", "qvi"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body: { phone?: string; pin?: string; profile?: { name?: string; lang?: string; casita?: boolean; negocio?: boolean } };
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

  const phone = cleanPhone(body.phone);
  const pin = String(body.pin ?? "");
  if (!validPhone(phone)) return json({ error: "bad_phone" }, 400); // also keeps the demo profile offline
  if (!validPin(pin)) return json({ error: "bad_pin" }, 400);

  const p = body.profile ?? {};
  const profile = {
    name: String(p.name ?? "").slice(0, 60),
    lang: LANGS.includes(String(p.lang)) ? String(p.lang) : "es",
    casita: p.casita !== false,
    negocio: !!p.negocio,
  };

  const { data, error } = await admin.auth.admin.createUser({
    email: loginEmail(phone),
    password: await passwordFor(phone, pin),
    email_confirm: true,
    user_metadata: { name: profile.name, lang: profile.lang },
  });
  if (error) {
    const exists = /already|exists|registered/i.test(error.message) || (error as { code?: string }).code === "email_exists";
    return json({ error: exists ? "exists" : "create_failed" }, exists ? 409 : 500);
  }

  const { error: pErr } = await admin.from("profiles").insert({ id: data.user.id, ...profile });
  if (pErr) console.error("profile insert", pErr.message);
  return json({ ok: true });
});
