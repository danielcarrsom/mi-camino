"use client";
// Accepting the privacy notice and terms: a checkbox at sign-up, and a one-time
// screen for people who signed up before (or when the texts change).
import { useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Button, cx } from "./ui";
import { BetaBadge } from "./LegalPage";
import { LEGAL } from "@/lib/legal";
import { DEMO_PHONE, useLang, useStore } from "@/lib/store";
import type { Lang } from "@/lib/i18n";

export function ConsentCheck({ checked, onChange, lang }: { checked: boolean; onChange: (v: boolean) => void; lang: Lang }) {
  const en = lang === "en";
  return (
    <div className={cx("flex items-start gap-3 rounded-2xl border-2 p-4 text-left", checked ? "border-leaf bg-leaf/10" : "border-sand bg-paper")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={en ? "I accept the privacy notice and terms" : "Acepto el aviso de privacidad y los términos"}
        onClick={() => onChange(!checked)}
        className={cx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2", checked ? "border-leaf bg-leaf text-paper" : "border-sand-dark bg-paper")}
      >
        {checked && <Check size={20} strokeWidth={3} />}
      </button>
      <p className="text-base leading-snug">
        {en ? "I read and accept the " : "Leí y acepto el "}
        <Link href="/privacidad" target="_blank" className="font-bold text-clay underline">{en ? "privacy notice" : "aviso de privacidad"}</Link>
        {en ? " and the " : " y los "}
        <Link href="/terminos" target="_blank" className="font-bold text-clay underline">{en ? "terms" : "términos y condiciones"}</Link>
        {en ? ". I understand Mi Camino is in beta and may change." : ". Entiendo que Mi Camino está en beta y puede cambiar."}
      </p>
    </div>
  );
}

/** Shown once inside the app to anyone who hasn't accepted the current version. */
export function ConsentGate() {
  const lang = useLang();
  const en = lang === "en";
  const current = useStore((s) => s.current);
  const accepted = useStore((s) => (s.current ? s.accounts[s.current]?.data.profile.termsAccepted : undefined));
  const updateProfile = useStore((s) => s.updateProfile);
  const logout = useStore((s) => s.logout);
  const [ok, setOk] = useState(false);
  if (!current || current === DEMO_PHONE || accepted === LEGAL.version) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={en ? "Privacy and terms" : "Privacidad y términos"}>
      <div className="w-full max-w-lg rounded-t-[2rem] bg-cream p-6 shadow-2xl sm:rounded-[2rem]">
        <p className="flex items-center gap-2"><ShieldCheck className="text-leaf" /> <BetaBadge /></p>
        <h2 className="mt-3 font-serif text-3xl font-semibold">{en ? "Your privacy, in plain words" : "Tu privacidad, en palabras sencillas"}</h2>
        <ul className="mt-3 space-y-1.5 text-lg">
          <li>• {en ? "We never ask for immigration status or account numbers." : "Nunca te pedimos estatus migratorio ni números de cuenta."}</li>
          <li>• {en ? "We don't sell your data and there are no ads." : "No vendemos tus datos y no hay anuncios."}</li>
          <li>• {en ? "You can download or delete your data any time." : "Puedes descargar o borrar tus datos cuando quieras."}</li>
          <li>• {en ? "Mi Camino is in beta: it may have mistakes and change." : "Mi Camino está en beta: puede tener errores y cambiar."}</li>
        </ul>
        <div className="mt-4"><ConsentCheck checked={ok} onChange={setOk} lang={lang} /></div>
        <Button className="mt-4 w-full" disabled={!ok} onClick={() => updateProfile({ termsAccepted: LEGAL.version, termsAcceptedAt: new Date().toISOString() })}>
          {en ? "Continue" : "Continuar"}
        </Button>
        <button onClick={logout} className="mt-3 w-full text-center text-base font-bold text-muted underline underline-offset-4">{en ? "Not now, sign out" : "Ahora no, salir"}</button>
      </div>
    </div>
  );
}
