"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound, Phone, ShieldCheck } from "lucide-react";
import { Button, ListenButton, Logo, MicButton, PinPad } from "@/components/ui";
import { PhoneInput } from "@/components/PhoneInput";
import { useHydrated } from "@/lib/hooks";
import { useLang, useStore } from "@/lib/store";
import { altPhoneKey, phoneKey, type PhoneCountry } from "@/lib/phone";
import { pick } from "@/lib/catalog";
import { recoveryQuestion as questionById } from "@/lib/recovery";
import { recoveryQuestion, recoveryReset } from "@/lib/cloud";
import { playGoal } from "@/lib/sound";
import { speak } from "@/lib/voice";

type Stage = "phone" | "proof" | "pin" | "pin2" | "busy";

export default function RecuperarPage() {
  return (
    <Suspense>
      <Recuperar />
    </Suspense>
  );
}

function Recuperar() {
  const hydrated = useHydrated();
  const lang = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const login = useStore((s) => s.login);
  const resetLocalPin = useStore((s) => s.resetLocalPin);
  const voiceOn = useStore((s) => s.voiceOn);
  const L = (es: string, en: string) => (lang === "en" ? en : es);

  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<PhoneCountry>("us");
  const [question, setQuestion] = useState<string | null>(null);
  const [foundKey, setFoundKey] = useState<string | null>(null);
  const [useCode, setUseCode] = useState(false);
  const [answer, setAnswer] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [pinOk, setPinOk] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const tel = params.get("tel");
    if (!tel) return;
    if (tel.length === 12 && tel.startsWith("52")) { setCountry("mx"); setPhone(tel.slice(2)); } else setPhone(tel);
  }, [params]);

  const key = phoneKey(phone, country);
  const say: Record<Stage, string> = {
    phone: L("Escribe tu número de teléfono para recuperar tu clave.", "Type your phone number to recover your PIN."),
    proof: useCode || !question
      ? L("Escribe el código de recuperación que te dieron.", "Type the recovery code you were given.")
      : L(`Contesta tu pregunta: ${pick(questionById(question).label, "es")}`, `Answer your question: ${pick(questionById(question).label, "en")}`),
    pin: L("Elige tu clave nueva de 6 números.", "Choose your new 6-digit PIN."),
    pin2: L("Escribe tu clave nueva otra vez.", "Type your new PIN again."),
    busy: L("Un momento…", "One moment…"),
  };
  useEffect(() => { if (voiceOn && hydrated) speak(say[stage], lang); }, [stage, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const findAccount = async () => {
    if (!key) return;
    setMsg(null); setStage("busy");
    let q = await recoveryQuestion(key);
    let k = key;
    // Not found: maybe it was saved as the other country (same 10 digits)
    const alt = altPhoneKey(key);
    if (q !== "offline" && !q.exists && alt) {
      const q2 = await recoveryQuestion(alt);
      if (q2 !== "offline" && q2.exists) { q = q2; k = alt; }
    }
    if (q === "offline") { setMsg(L("No hay conexión. Revisa tu internet e intenta otra vez.", "No connection. Check your internet and try again.")); setStage("phone"); return; }
    setFoundKey(k); setQuestion(q.question); setUseCode(!q.question); setStage("proof");
  };

  const submit = async (newPin: string) => {
    const k = foundKey ?? key;
    if (!k) return;
    setStage("busy"); setMsg(null);
    const r = await recoveryReset(k, useCode || !question ? { code } : { answer }, newPin);
    if (r.ok) {
      await resetLocalPin(k, newPin);
      const ok = await login(k, newPin);
      playGoal();
      if (voiceOn) speak(L("¡Listo! Ya tienes tu clave nueva.", "Done! You have your new PIN."), lang);
      router.replace(ok ? "/inicio" : "/entrar");
      return;
    }
    if (r.reason === "locked") setMsg(L("Por tu seguridad, ya no se puede intentar por una hora. Si necesitas ayuda, llama al Consulado.", "For your safety, no more tries for one hour. If you need help, call the Consulate."));
    else if (r.reason === "wrong") setMsg(useCode || !question
      ? L(`Ese código no sirve o ya se usó. Te quedan ${r.left ?? 0} intentos.`, `That code doesn't work or was used. ${r.left ?? 0} tries left.`)
      : L(`Esa respuesta no es la que guardaste. Te quedan ${r.left ?? 0} intentos.`, `That's not the answer you saved. ${r.left ?? 0} tries left.`));
    else setMsg(L("No hay conexión. Revisa tu internet e intenta otra vez.", "No connection. Check your internet and try again."));
    setStage("proof");
  };

  // New PIN, twice
  useEffect(() => { if (stage === "pin" && pin.length === 6) setTimeout(() => setStage("pin2"), 250); }, [pin, stage]);
  useEffect(() => {
    if (stage !== "pin2" || pin2.length !== 6) return;
    if (pin2 === pin) { setPinOk(true); void submit(pin); }
    else { setMsg(L("Las claves no son iguales. Intenta otra vez.", "The PINs don't match. Try again.")); setPin(""); setPin2(""); setTimeout(() => setStage("pin"), 900); }
  }, [pin2, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) return <div className="min-h-dvh bg-cream" />;

  const proofReady = useCode || !question ? code.replace(/[^a-z0-9]/gi, "").length >= 6 : answer.trim().length >= 2;
  const back = () => {
    setMsg(null);
    if (stage === "phone") router.push("/entrar");
    else if (stage === "proof") setStage("phone");
    else if (stage === "pin") setStage("proof");
    else if (stage === "pin2") { setPin(""); setPin2(""); setStage("pin"); }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
        <button onClick={back} className="flex h-12 items-center gap-2 rounded-full pr-3 font-bold text-muted hover:text-ink">
          <ArrowLeft size={24} /> {L("Regresar", "Back")}
        </button>
        <Logo />
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-5 pt-6 pb-12">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h1 className="text-[2rem] leading-tight font-semibold">
            {stage === "pin" || stage === "pin2" ? (stage === "pin" ? L("Tu clave nueva", "Your new PIN") : L("Otra vez tu clave nueva", "New PIN again")) : L("Recuperar mi clave", "Recover my PIN")}
          </h1>
          <ListenButton text={say[stage]} compact />
        </div>

        {msg && <p className="mb-5 rounded-2xl bg-clay/10 px-4 py-3 text-lg font-bold text-clay">{msg}</p>}

        {stage === "busy" && <p className="py-10 text-center text-xl font-bold text-muted">{say.busy}</p>}

        {stage === "phone" && (
          <>
            <PhoneInput value={phone} onChange={setPhone} country={country} onCountry={setCountry} label={L("Tu número de teléfono", "Your phone number")} />
            <Button onClick={findAccount} disabled={!key} className="mt-6 w-full">{L("Siguiente", "Next")}</Button>
          </>
        )}

        {stage === "proof" && (
          <div className="space-y-4">
            {!useCode && question ? (
              <>
                <p className="flex items-start gap-2 text-lg"><ShieldCheck size={24} className="mt-0.5 shrink-0 text-leaf" /> <b>{pick(questionById(question).label, lang)}</b></p>
                <div className="flex items-center gap-3">
                  <input value={answer} onChange={(e) => setAnswer(e.target.value)} autoFocus placeholder={L("Tu respuesta", "Your answer")}
                    className="h-16 w-full min-w-0 rounded-2xl border-2 border-sand bg-paper px-4 text-xl outline-none focus:border-clay" aria-label={L("Tu respuesta", "Your answer")} />
                  <div className="shrink-0 [&_p]:hidden"><MicButton size="md" onText={(t) => setAnswer(t.replace(/[.,!¡¿?]+$/g, ""))} /></div>
                </div>
                <p className="text-base text-muted">{L("No importa si usas acentos o mayúsculas.", "Accents and capitals don't matter.")}</p>
              </>
            ) : (
              <>
                {!question && (
                  <p className="rounded-2xl bg-sun-soft px-4 py-3 text-base">
                    {L("Tu cuenta todavía no tiene pregunta de seguridad. Pide un código de recuperación al equipo de Mi Camino: revisan que seas tú y te lo dan.", "Your account doesn't have a security question yet. Ask the Mi Camino team for a recovery code: they check it's you and give it to you.")}
                  </p>
                )}
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-lg font-bold"><KeyRound size={22} /> {L("Código de recuperación", "Recovery code")}</span>
                  <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoFocus autoCapitalize="characters" autoComplete="one-time-code" placeholder="MC-XXXX-XXXX"
                    className="h-16 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-center font-mono text-2xl font-bold tracking-widest outline-none focus:border-clay" />
                </label>
              </>
            )}

            <Button className="w-full" disabled={!proofReady} onClick={() => { setMsg(null); if (pinOk) void submit(pin); else { setPin(""); setPin2(""); setStage("pin"); } }}>
              {pinOk ? L("Intentar otra vez", "Try again") : L("Siguiente", "Next")}
            </Button>

            {question && (
              <button onClick={() => { setUseCode(!useCode); setMsg(null); }} className="w-full text-center text-base font-bold text-clay underline underline-offset-4">
                {useCode ? L("Mejor contesto mi pregunta", "I'll answer my question instead") : L("No me acuerdo · tengo un código de recuperación", "I don't remember · I have a recovery code")}
              </button>
            )}

            <a href="tel:+12122176400" className="mt-2 flex items-center gap-3 rounded-2xl border border-sand bg-paper px-4 py-3">
              <Phone size={22} className="shrink-0 text-leaf" />
              <span className="min-w-0 text-base">
                <b>{L("¿Necesitas ayuda?", "Need help?")}</b> {L("Consulado de México en Nueva York:", "Mexican Consulate in New York:")} <span className="font-bold whitespace-nowrap">(212) 217-6400</span>
              </span>
            </a>
          </div>
        )}

        {stage === "pin" && <PinPad value={pin} onChange={setPin} />}
        {stage === "pin2" && <PinPad value={pin2} onChange={setPin2} />}
      </main>
    </div>
  );
}
