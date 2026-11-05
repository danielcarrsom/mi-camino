"use client";
// Shown once to people who still have an old 4-digit PIN.
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ListenButton, Logo, PinPad } from "./ui";
import { useT } from "@/lib/hooks";
import { useLang, useStore } from "@/lib/store";
import { speak } from "@/lib/voice";

export function NewPin() {
  const t = useT();
  const lang = useLang();
  const changePin = useStore((s) => s.changePin);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState(false);

  useEffect(() => { speak(t("newPinSay"), lang); }, [t, lang]);
  useEffect(() => { if (step === 1 && pin.length === 6) setTimeout(() => setStep(2), 250); }, [pin, step]);
  useEffect(() => {
    if (step !== 2 || pin2.length !== 6) return;
    if (pin2 === pin) void changePin(pin);
    else { setError(true); setTimeout(() => { setPin(""); setPin2(""); setStep(1); }, 1400); }
  }, [pin2, pin, step, changePin]);

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4"><Logo /></header>
      <main className="mx-auto w-full max-w-md flex-1 px-5 pt-4 pb-12">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h1 className="text-[2rem] leading-tight font-semibold">{step === 1 ? t("newPinTitle") : t("repeatPin")}</h1>
          <ListenButton text={step === 1 ? t("newPinSay") : t("repeatPinSay")} compact />
        </div>
        <p className="mb-6 flex items-start gap-2 text-base text-muted"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-leaf" /> {t("newPinSay")}</p>
        {step === 1 ? <PinPad value={pin} onChange={setPin} /> : <PinPad value={pin2} onChange={(v) => { setError(false); setPin2(v); }} />}
        {error && <p className="mt-5 text-center text-lg font-bold text-clay">{t("pinMismatch")}</p>}
      </main>
    </div>
  );
}
