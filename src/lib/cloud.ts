"use client";
// Online saving with Supabase. Each person's data is private to them (row
// level security). If the internet or Supabase is unavailable, the platform
// keeps working on the device and catches up later.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Profile, UserData } from "./store";

// Publishable values: safe to ship in the browser; access is limited by RLS.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hfdnzasqblxjdsenmpfc.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_7JlcboiI9Htq8E9iAgNCTA_OKhw1wPn";

let client: SupabaseClient | null = null;
export function cloud(): SupabaseClient {
  client ??= createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "mi-camino-auth" } });
  return client;
}

// People sign in with phone + PIN; Supabase needs an email-like login name
// and a longer password, so both are derived. Nothing is ever emailed.
const loginEmail = (phone: string) => `${phone}@usuarios.micamino.app`;
const loginPassword = (phone: string, pin: string) => `micamino-${pin}-${phone}`;

function withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

export type CloudResult = "ok" | "exists" | "wrong" | "offline";

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
    const { error } = await withTimeout(cloud().auth.signInWithPassword({ email: loginEmail(phone), password: loginPassword(phone, pin) }));
    if (!error) return "ok";
    return /invalid|credentials/i.test(error.message) ? "wrong" : "offline";
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
