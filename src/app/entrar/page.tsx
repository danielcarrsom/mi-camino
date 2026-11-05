"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, ListenButton, Logo, PinPad } from "@/components/ui";
import { useHydrated, useT } from "@/lib/hooks";
import { onlyDigits, useStore } from "@/lib/store";

export default function Login() {
  const hydrated = useHydrated();
  const t = useT();
  const router = useRouter();
  const login = useStore((s) => s.login);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [stage, setStage] = useState<"phone" | "pin">("phone");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length !== 4) return;
    login(phone, pin).then((ok) => {
      if (ok) router.replace("/inicio");
      else { setError(true); setPin(""); }
    });
  }, [pin, phone, login, router]);

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
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d\s()+-]/g, ""))}
              inputMode="tel"
              autoComplete="tel"
              placeholder="(718) 555 0123"
              className="h-20 w-full rounded-2xl border-2 border-sand bg-paper px-5 text-center font-serif text-4xl font-semibold outline-none focus:border-clay"
              aria-label={t("askPhone")}
            />
            <Button onClick={() => { setError(false); setStage("pin"); }} disabled={onlyDigits(phone).length < 10} className="mt-6 w-full">{t("next")}</Button>
          </>
        ) : (
          <>
            <PinPad value={pin} onChange={(v) => { setError(false); setPin(v); }} />
            {error && <p className="mt-5 text-center text-lg font-bold text-clay">{t("wrongLogin")}</p>}
          </>
        )}
      </main>
    </div>
  );
}
