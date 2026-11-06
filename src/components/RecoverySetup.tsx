"use client";
// Pick a security question and answer it (typing or speaking). Used when
// signing up and from the reminder for people who signed up before.
import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Button, MicButton, Sheet, cx } from "./ui";
import { useLang, useMe, useStore, DEMO_PHONE } from "@/lib/store";
import { pick } from "@/lib/catalog";
import { RECOVERY_QUESTIONS } from "@/lib/recovery";
import { playSaved } from "@/lib/sound";
import { tx } from "@/lib/i18n";
import TXT from "@/messages/RecoverySetup";

export function RecoveryForm({ onDone, saveLabel, busy }: { onDone: (question: string, answer: string) => void; saveLabel?: string; busy?: boolean }) {
  const lang = useLang();
  const [q, setQ] = useState(RECOVERY_QUESTIONS[0].id);
  const [answer, setAnswer] = useState("");
  const ok = answer.replace(/[^\p{L}\p{N}]/gu, "").length >= 2;
  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-2xl bg-leaf-soft px-4 py-3 text-base">
        <ShieldCheck size={22} className="mt-0.5 shrink-0 text-leaf" />
        {tx(lang, TXT.siUnDiaOlvidasTu)}
      </p>
      <div className="grid grid-cols-1 gap-2" role="radiogroup">
        {RECOVERY_QUESTIONS.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={q === x.id} onClick={() => setQ(x.id)}
            className={cx("flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 text-left text-lg font-bold", q === x.id ? "border-clay bg-clay/10" : "border-sand bg-paper")}>
            <span className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", q === x.id ? "border-clay bg-clay text-paper" : "border-sand-dark")}>{q === x.id && <Check size={14} strokeWidth={3} />}</span>
            {pick(x.label, lang)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={pick(RECOVERY_QUESTIONS.find((x) => x.id === q)!.example, lang)}
          className="h-16 w-full min-w-0 rounded-2xl border-2 border-sand bg-paper px-4 text-xl outline-none focus:border-clay" aria-label={tx(lang, TXT.tuRespuesta)} />
        <div className="shrink-0 [&_p]:hidden"><MicButton size="md" onText={(t) => setAnswer(t.replace(/[.,!¡¿?]+$/g, ""))} /></div>
      </div>
      <p className="text-base text-muted">{tx(lang, TXT.noImportaSiUsasAcentos)}</p>
      <Button variant="green" className="w-full" disabled={!ok || busy} onClick={() => onDone(q, answer.trim())}>
        <Check size={22} /> {saveLabel ?? tx(lang, TXT.guardarMiPregunta)}
      </Button>
    </div>
  );
}

/** A gentle reminder for accounts that don't have a security question yet. */
export function RecoveryNudge() {
  const lang = useLang();
  const me = useMe();
  const current = useStore((s) => s.current);
  const cloud = useStore((s) => s.cloud);
  const setRecovery = useStore((s) => s.setRecovery);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem("mc-nudge") === "1"; } catch { return false; } });
  if (!me || me.profile.recoveryQ || current === DEMO_PHONE || cloud !== "saved" || hidden) return null;
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-3xl border-2 border-leaf/30 bg-leaf-soft px-4 py-3">
        <ShieldCheck size={26} className="shrink-0 text-leaf" />
        <p className="min-w-0 flex-1 text-base"><b>{tx(lang, TXT.protegeTuCuenta)}</b> {tx(lang, TXT.eligeUnaPreguntaParaRecuperar)}</p>
        <div className="flex gap-2">
          <Button variant="green" className="min-h-12 px-4 text-base" onClick={() => setOpen(true)}>{tx(lang, TXT.elegir)}</Button>
          <button onClick={() => { setHidden(true); try { sessionStorage.setItem("mc-nudge", "1"); } catch { /* fine */ } }} className="h-12 rounded-2xl px-3 text-base font-bold text-muted">{tx(lang, TXT.despues)}</button>
        </div>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={tx(lang, TXT.tuPreguntaDeSeguridad)}>
        <RecoveryForm busy={busy} onDone={async (q, a) => {
          setBusy(true); setFailed(false);
          const ok = await setRecovery(q, a);
          setBusy(false);
          if (ok) { playSaved(); setOpen(false); } else setFailed(true);
        }} />
        {failed && <p className="mt-3 text-base font-bold text-clay">{tx(lang, TXT.noSePudoGuardarRevisa)}</p>}
      </Sheet>
    </>
  );
}
