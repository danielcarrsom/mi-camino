"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, ListenButton, Logo, PinPad } from "@/components/ui";
import { useHydrated, useT } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { PhoneInput } from "@/components/PhoneInput";
import { phoneKey, type PhoneCountry } from "@/lib/phone";

export default function Login() {
  const hydrated = useHydrated();
  const t = useT();
  const router = useRouter();
  const login = useStore((s) => s.login);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<PhoneCountry>("us");
  const [pin, setPin] = useState("");
  const [stage, setStage] = useState<"phone" | "pin">("phone");
  const [error, setError] = useState(false);

  const tryLogin = (p: string) =>
    login(phoneKey(phone, country) ?? phone, p).then((ok) => {
      if (ok) router.replace("/inicio");
      else { setError(true); setPin(""); }
    });

  useEffect(() => {
    if (pin.length === 6) void tryLogin(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  if (!hydrated) return <div className="min-h-dvh bg-cream" />;

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
        <button onClick={() => (stage === "pin" ? setStage("phone") : router.push("/"))} className="flex h-12 items-center gap-2 rounded-full pr-3 font-bold text-muted hover:text-ink">
          <ArrowLeft size={24} /> {t("back")}
        </button>
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-5 pt-6 pb-12">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h1 className="text-[2rem] font-semibold">{stage === "phone" ? t("askPhone") : t("loginTitle")}</h1>
          <ListenButton text={t("loginSay")} compact />
        </div>
        {stage === "phone" ? (
          <>
            <PhoneInput value={phone} onChange={setPhone} country={country} onCountry={setCountry} label={t("askPhone")} />
            <Button onClick={() => { setError(false); setStage("pin"); }} disabled={!phoneKey(phone, country)} className="mt-6 w-full">{t("next")}</Button>
          </>
        ) : (
          <>
            <PinPad value={pin} onChange={(v) => { setError(false); setPin(v); }} />
            {error && <p className="mt-5 text-center text-lg font-bold text-clay">{t("wrongLogin")}</p>}
            {pin.length === 4 && (
              <div className="mt-5 text-center">
                <Button variant="soft" onClick={() => void tryLogin(pin)}>{t("enter")}</Button>
                <p className="mt-2 text-base text-muted">{t("oldPinHint")}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
