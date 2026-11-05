"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, House, Store, Check, ShieldCheck } from "lucide-react";
import { Button, ListenButton, Logo, MicButton, PinPad, Tile, cx } from "@/components/ui";
import { useHydrated, useT } from "@/lib/hooks";
import { useLang, useStore } from "@/lib/store";
import { PhoneInput } from "@/components/PhoneInput";
import { RecoveryForm } from "@/components/RecoverySetup";
import { phoneKey, type PhoneCountry } from "@/lib/phone";
import { LANGS, type Lang } from "@/lib/i18n";
import { speak, stopSpeaking } from "@/lib/voice";

type Step = "lang" | "name" | "phone" | "pin" | "pin2" | "safety" | "modules";
const ORDER: Step[] = ["lang", "name", "phone", "pin", "pin2", "safety", "modules"];

export default function Onboarding() {
  const hydrated = useHydrated();
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const setLang = useStore((s) => s.setDeviceLang);
  const register = useStore((s) => s.register);
  const accounts = useStore((s) => s.accounts);
  const voiceOn = useStore((s) => s.voiceOn);

  const [step, setStep] = useState<Step>("lang");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<PhoneCountry>("us");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [pinError, setPinError] = useState(false);
  const [modules, setModules] = useState<"casita" | "negocio" | "both">("both");
  const [phoneTaken, setPhoneTaken] = useState(false);
  const [recovery, setRecovery] = useState<{ question: string; answer: string } | null>(null);

  const idx = ORDER.indexOf(step);
  const go = (s: Step) => setStep(s);
  const back = () => (idx === 0 ? router.push("/") : setStep(ORDER[idx - 1]));

  const says: Record<Step, string> = {
    lang: t("pickLangSay"), name: t("askNameSay"), phone: t("askPhoneSay"),
    pin: t("askPinSay"), pin2: t("repeatPinSay"), modules: t("pickModulesSay"),
    safety: lang === "en" ? "If you ever forget your PIN, we'll ask you a question. Pick one and answer it. Only you should know the answer." : "Si un día olvidas tu clave, te haremos una pregunta. Elige una y contéstala. Solo tú debes saber la respuesta.",
  };
  const titles: Record<Step, string> = {
    lang: t("pickLang"), name: t("askName"), phone: t("askPhone"),
    pin: t("askPin"), pin2: t("repeatPin"), modules: t("pickModules"),
    safety: lang === "en" ? "In case you forget your PIN" : "Por si olvidas tu clave",
  };

  // speak each step automatically when voice is on (and always on the first step)
  useEffect(() => {
    if (!hydrated) return;
    if (voiceOn) speak(says[step], lang, `onb_${step}`);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, hydrated, lang, voiceOn]);

  // PIN steps advance on the 4th digit
  useEffect(() => { if (step === "pin" && pin.length === 6) setTimeout(() => go("pin2"), 250); }, [pin, step]);
  useEffect(() => {
    if (step !== "pin2" || pin2.length !== 6) return;
    if (pin2 === pin) { setPinError(false); setTimeout(() => go("safety"), 250); }
    else { setPinError(true); setTimeout(() => { setPin(""); setPin2(""); go("pin"); }, 1400); }
  }, [pin2, pin, step]);

  async function finish() {
    const key = phoneKey(phone, country);
    if (!key) return;
    await register(key, pin, {
      name: name.trim() || "Amigo",
      lang,
      casita: modules !== "negocio",
      negocio: modules !== "casita",
      createdAt: new Date().toISOString(),
    }, recovery);
    router.replace(modules === "negocio" ? "/negocio" : "/casita");
  }

  if (!hydrated) return <div className="min-h-dvh bg-cream" />;
  const key = phoneKey(phone, country);
  const phoneOk = !!key;

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
        <button onClick={back} className="flex h-12 items-center gap-2 rounded-full pr-3 font-bold text-muted hover:text-ink">
          <ArrowLeft size={24} /> {t("back")}
        </button>
        <Logo />
      </header>

      {/* progress dots */}
      <div className="mx-auto mb-2 flex gap-2" aria-hidden>
        {ORDER.map((s, i) => (
          <span key={s} className={cx("h-2.5 rounded-full transition-all", i <= idx ? "w-8 bg-clay" : "w-2.5 bg-sand-dark")} />
        ))}
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-4 pb-12">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h1 className="text-[2rem] leading-tight font-semibold md:text-[2.6rem]">{titles[step]}</h1>
          <ListenButton text={says[step]} audioKey={`onb_${step}`} compact />
        </div>

        {step === "lang" && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code as Lang); speak(l.code === "en" ? "English" : l.name, l.code as Lang); }}
                className={cx("flex min-h-20 items-center justify-between gap-3 rounded-3xl border-2 bg-paper px-5 text-left transition", lang === l.code ? "border-clay ring-4 ring-clay/15" : "border-sand hover:border-sand-dark")}
                aria-pressed={lang === l.code}
              >
                <span>
                  <span className="block text-xl font-extrabold">{l.name}</span>
                  <span className="block text-base text-muted">{l.label} · {l.region}</span>
                </span>
                {lang === l.code ? <Check className="text-clay" size={28} /> : l.indigenous ? <span className="rounded-full bg-sun-soft px-3 py-1 text-sm font-bold whitespace-nowrap">{t("audioComing")}</span> : null}
              </button>
            ))}
            {LANGS.find((l) => l.code === lang)?.indigenous && (
              <p className="rounded-2xl bg-sun-soft px-4 py-3 text-base md:col-span-2">{t("audioComingText")}</p>
            )}
            <Button onClick={() => go("name")} className="mt-3 md:col-span-2">{t("next")}</Button>
          </div>
        )}

        {step === "name" && (
          <div className="mx-auto max-w-md">
            <MicButton size="md" onText={(s) => setName(s.replace(/^(me llamo|mi nombre es|soy|my name is|i'm|i am)\s+/i, "").replace(/[.,!]+$/, ""))} />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="mt-6 h-16 w-full rounded-2xl border-2 border-sand bg-paper px-5 text-2xl font-bold outline-none focus:border-clay"
              autoComplete="given-name"
            />
            <Button onClick={() => go("phone")} disabled={!name.trim()} className="mt-6 w-full">{t("next")}</Button>
          </div>
        )}

        {step === "phone" && (
          <div className="mx-auto max-w-md">
            <PhoneInput value={phone} onChange={(v) => { setPhone(v); setPhoneTaken(false); }} country={country} onCountry={(c) => { setCountry(c); setPhoneTaken(false); }} label={t("askPhone")} />
            <p className="mt-3 flex items-start gap-2 text-base text-muted"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-leaf" /> {t("phoneHelp")}</p>
            {phoneTaken && <p className="mt-3 text-base font-bold text-clay">{lang === "en" ? "This number already has an account. Sign in instead." : "Este número ya tiene cuenta. Mejor entra con tu clave."}</p>}
            <Button
              onClick={() => (key && accounts[key] ? setPhoneTaken(true) : go("pin"))}
              disabled={!phoneOk}
              className="mt-6 w-full"
            >
              {t("next")}
            </Button>
          </div>
        )}

        {step === "pin" && <PinPad value={pin} onChange={setPin} />}
        {step === "pin2" && (
          <>
            <PinPad value={pin2} onChange={setPin2} />
            {pinError && <p className="mt-5 text-center text-lg font-bold text-clay">{t("pinMismatch")}</p>}
          </>
        )}

        {step === "safety" && (
          <div className="mx-auto max-w-xl">
            <RecoveryForm saveLabel={t("next")} onDone={(question, answer) => { setRecovery({ question, answer }); go("modules"); }} />
            <button onClick={() => { setRecovery(null); go("modules"); }} className="mt-4 w-full text-center text-base font-bold text-muted underline underline-offset-4">
              {lang === "en" ? "Skip for now" : "Hacerlo después"}
            </button>
          </div>
        )}

        {step === "modules" && (
          <div className="mx-auto grid max-w-xl gap-3">
            <Tile icon={<House size={30} />} label={t("casita")} sub={t("casitaWhat")} selected={modules === "casita"} onClick={() => setModules("casita")} />
            <Tile icon={<Store size={30} />} label={t("negocio")} sub={t("negocioWhat")} color="#3e7d4f" selected={modules === "negocio"} onClick={() => setModules("negocio")} />
            <Tile
              icon={<span className="flex"><House size={22} /><Store size={22} /></span>}
              label={t("both")}
              sub={t("separateLesson")}
              color="#e0a33a"
              selected={modules === "both"}
              onClick={() => setModules("both")}
            />
            <p className="mt-2 flex items-start gap-2 text-base text-muted"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-leaf" /> {t("privacyNote")}</p>
            <Button onClick={finish} className="mt-3 w-full">{t("start")}</Button>
          </div>
        )}
      </main>
    </div>
  );
}
