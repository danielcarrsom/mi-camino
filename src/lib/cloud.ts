"use client";
// Online saving with Supabase. Each person's data is private to them (row
// level security). If the internet or Supabase is unavailable, the platform
// keeps working on the device and catches up later.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Profile, UserData } from "./store";

import { SUPABASE_KEY as KEY, SUPABASE_URL as URL } from "./supabaseConfig";

let client: SupabaseClient | null = null;
export function cloud(): SupabaseClient {
  client ??= createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "mi-camino-auth" } });
  return client;
}

// People sign in with phone + PIN. The real Supabase password is made on the
// server from the PIN and a secret only the server knows (supabase/functions/
// _shared/auth.ts), so PINs can't be guessed against Supabase directly: every
// try goes through the `entrar` function, which locks a phone after 5 wrong PINs.
const loginEmail = (phone: string) => `${phone}@usuarios.micamino.app`;

function withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

export type CloudResult = "ok" | "exists" | "wrong" | "locked" | "offline";

async function fnCall(name: string, body: Record<string, unknown>, token?: string) {
  return withTimeout(
    fetch(`${URL}/functions/v1/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }),
  );
}
async function sessionToken(): Promise<string | null> {
  const { data } = await cloud().auth.getSession();
  return data.session?.access_token ?? null;
}

export async function cloudRegister(phone: string, pin: string, profile: Profile): Promise<CloudResult> {
  try {
    const r = await withTimeout(
      fetch(`${URL}/functions/v1/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: KEY },
        body: JSON.stringify({ phone, pin, profile: { name: profile.name, lang: profile.lang, casita: profile.casita, negocio: profile.negocio } }),
      }),
    );
    if (r.status === 409) return "exists";
    if (!r.ok) return "offline";
    const signed = await cloudSignIn(phone, pin);
    return signed;
  } catch {
    return "offline";
  }
}

export async function cloudSignIn(phone: string, pin: string): Promise<CloudResult> {
  try {
    const r = await fnCall("entrar", { action: "login", phone, pin });
    if (r.status === 429) return "locked";
    if (r.status === 403 || r.status === 400) return "wrong";
    if (!r.ok) return "offline";
    const j = (await r.json()) as { access_token?: string; refresh_token?: string };
    if (!j.access_token || !j.refresh_token) return "offline";
    const { error } = await withTimeout(cloud().auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token }));
    return error ? "offline" : "ok";
  } catch {
    return "offline";
  }
}

export async function cloudSignedInAs(phone: string): Promise<boolean> {
  try {
    const { data } = await cloud().auth.getSession();
    return data.session?.user.email === loginEmail(phone);
  } catch {
    return false;
  }
}

export async function cloudLoad(): Promise<{ data: UserData | null; updatedAt: string | null } | null> {
  try {
    const { data: s } = await cloud().auth.getSession();
    const uid = s.session?.user.id;
    if (!uid) return null;
    const { data, error } = await withTimeout(Promise.resolve(cloud().from("user_data").select("data, updated_at").eq("user_id", uid).maybeSingle()));
    if (error) return null;
    if (!data) return { data: null, updatedAt: null };
    const d = data.data as UserData;
    return { data: d && d.profile ? d : null, updatedAt: data.updated_at as string };
  } catch {
    return null;
  }
}

export async function cloudSave(d: UserData): Promise<boolean> {
  try {
    const { data: s } = await cloud().auth.getSession();
    const uid = s.session?.user.id;
    if (!uid) return false;
    const { error } = await withTimeout(Promise.resolve(cloud().from("user_data").upsert({ user_id: uid, data: d })));
    if (error) return false;
    await withTimeout(Promise.resolve(cloud().from("profiles").upsert({
      id: uid, name: d.profile.name, lang: d.profile.lang, casita: d.profile.casita, negocio: d.profile.negocio,
    })));
    return true;
  } catch {
    return false;
  }
}

export async function cloudSignOut() {
  try { await cloud().auth.signOut(); } catch { /* offline is fine */ }
}

// ---------- Recovering a forgotten PIN ----------
export type RecoveryResult = { ok: true } | { ok: false; reason: "wrong" | "locked" | "offline"; left?: number };

async function recoveryCall(body: Record<string, unknown>, token?: string) {
  return withTimeout(
    fetch(`${URL}/functions/v1/recuperar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }),
  );
}

/** Does this phone have an account, and which security question did it choose? */
export async function recoveryQuestion(phone: string): Promise<{ exists: boolean; question: string | null } | "offline"> {
  try {
    const r = await recoveryCall({ action: "question", phone });
    if (!r.ok) return "offline";
    const j = await r.json();
    return { exists: j.exists ?? j.question != null, question: (j.question as string | null) ?? null };
  } catch {
    return "offline";
  }
}

export async function recoveryReset(phone: string, proof: { answer?: string; code?: string }, pin: string): Promise<RecoveryResult> {
  try {
    const r = await recoveryCall({ action: "reset", phone, pin, ...proof });
    if (r.ok) return { ok: true };
    const j = await r.json().catch(() => ({}));
    if (r.status === 429) return { ok: false, reason: "locked" };
    if (r.status === 403) return { ok: false, reason: "wrong", left: j.left };
    return { ok: false, reason: "offline" };
  } catch {
    return { ok: false, reason: "offline" };
  }
}

/** Save the security question for the signed-in person. */
export async function recoverySet(question: string, answer: string): Promise<boolean> {
  try {
    const { data } = await cloud().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return false;
    const r = await recoveryCall({ action: "set", question, answer }, token);
    return r.ok;
  } catch {
    return false;
  }
}

/** Change the online PIN while signed in. */
export async function cloudChangePin(_phone: string, pin: string): Promise<boolean> {
  try {
    const token = await sessionToken();
    if (!token) return false;
    const r = await fnCall("entrar", { action: "change_pin", pin }, token);
    return r.ok;
  } catch {
    return false;
  }
}

/** Erase the account and everything saved online. */
export async function cloudDeleteAccount(): Promise<boolean> {
  try {
    const token = await sessionToken();
    if (!token) return false;
    const r = await fnCall("cuenta", { action: "delete" }, token);
    if (r.ok) await cloudSignOut();
    return r.ok;
  } catch {
    return false;
  }
}
