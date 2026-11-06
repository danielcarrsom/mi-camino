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
import { tx } from "@/lib/i18n";
import TXT from "@/messages/Consent";

export function ConsentCheck({ checked, onChange, lang }: { checked: boolean; onChange: (v: boolean) => void; lang: Lang }) {
  const en = lang === "en";
  return (
    <div className={cx("flex items-start gap-3 rounded-2xl border-2 p-4 text-left", checked ? "border-leaf bg-leaf/10" : "border-sand bg-paper")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={tx(en, TXT.aceptoElAvisoDePrivacidad)}
        onClick={() => onChange(!checked)}
        className={cx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2", checked ? "border-leaf bg-leaf text-paper" : "border-sand-dark bg-paper")}
      >
        {checked && <Check size={20} strokeWidth={3} />}
      </button>
      <p className="text-base leading-snug">
        {tx(en, TXT.leiYAceptoEl)}
        <Link href="/privacidad" target="_blank" className="font-bold text-clay underline">{tx(en, TXT.avisoDePrivacidad)}</Link>
        {tx(en, TXT.yLos)}
        <Link href="/terminos" target="_blank" className="font-bold text-clay underline">{tx(en, TXT.terminosYCondiciones)}</Link>
        {tx(en, TXT.entiendoQueMiCaminoEsta)}
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={tx(en, TXT.privacidadYTerminos)}>
      <div className="w-full max-w-lg rounded-t-[2rem] bg-cream p-6 shadow-2xl sm:rounded-[2rem]">
        <p className="flex items-center gap-2"><ShieldCheck className="text-leaf" /> <BetaBadge /></p>
        <h2 className="mt-3 font-serif text-3xl font-semibold">{tx(en, TXT.tuPrivacidadEnPalabrasSencillas)}</h2>
        <ul className="mt-3 space-y-1.5 text-lg">
          <li>• {tx(en, TXT.nuncaTePedimosEstatusMigratorio)}</li>
          <li>• {tx(en, TXT.noVendemosTusDatosY)}</li>
          <li>• {tx(en, TXT.puedesDescargarOBorrarTus)}</li>
          <li>• {tx(en, TXT.miCaminoEstaEnBeta)}</li>
        </ul>
        <div className="mt-4"><ConsentCheck checked={ok} onChange={setOk} lang={lang} /></div>
        <Button className="mt-4 w-full" disabled={!ok} onClick={() => updateProfile({ termsAccepted: LEGAL.version, termsAcceptedAt: new Date().toISOString() })}>
          {tx(en, TXT.continuar)}
        </Button>
        <button onClick={logout} className="mt-3 w-full text-center text-base font-bold text-muted underline underline-offset-4">{tx(en, TXT.ahoraNoSalir)}</button>
      </div>
    </div>
  );
}
