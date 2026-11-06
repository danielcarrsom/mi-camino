// Shared by the edge functions: how a phone + PIN becomes a Supabase password.
//
// The password is an HMAC of phone and PIN with a secret ("pepper") that only
// exists inside the database (private.secrets, read through the service-role-only
// function public.login_pepper()). Because the browser can't compute it, nobody
// can guess PINs directly against Supabase's auth API: every try has to go
// through the `entrar` function, which locks a phone after repeated wrong PINs.
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export const admin: SupabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const loginEmail = (phone: string) => `${phone}@usuarios.micamino.app`;
/** Passwords made before the pepper existed (accounts are moved to the new kind at their next login). */
export const legacyPassword = (phone: string, pin: string) => `micamino-${pin}-${phone}`;

let pepper: string | null = null;
async function getPepper(): Promise<string> {
  if (pepper) return pepper;
  const { data, error } = await admin.rpc("login_pepper");
  if (error || !data) throw new Error("pepper unavailable");
  pepper = data as string;
  return pepper;
}

export async function passwordFor(phone: string, pin: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(await getPepper()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${phone}:${pin}`));
  return "mc1-" + Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const cleanPhone = (v: unknown) => String(v ?? "").replace(/\D/g, "");
export const validPhone = (p: string) => p.length >= 10 && p.length <= 15 && p !== "0000000000";
export const validPin = (v: unknown) => /^\d{6}$/.test(String(v ?? ""));
