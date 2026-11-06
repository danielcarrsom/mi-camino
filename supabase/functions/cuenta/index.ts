// Mi Camino account deletion: a signed-in person can erase their account and
// everything saved online. Deleting the auth user cascades to profiles,
// user_data, recovery and recovery_codes (see migrations). Old failed-recovery
// logs for that phone are erased too.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, cors, json } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  if (body.action !== "delete") return json({ error: "action" }, 400);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u, error } = await admin.auth.getUser(token);
  if (error || !u.user) return json({ error: "auth" }, 401);

  const phone = (u.user.email ?? "").split("@")[0];
  const { error: delErr } = await admin.auth.admin.deleteUser(u.user.id);
  if (delErr) return json({ error: "delete_failed" }, 500);
  if (/^\d{10,15}$/.test(phone)) {
    await admin.from("recovery_attempts").delete().eq("phone", phone);
    await admin.from("login_attempts").delete().eq("phone", phone);
  }
  return json({ ok: true });
});
