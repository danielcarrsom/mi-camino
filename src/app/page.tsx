"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Languages, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button, ListenButton, Logo } from "@/components/ui";
import { BetaBadge } from "@/components/LegalPage";
import { LanguageSheet } from "@/components/AppShell";
import { GoalVisual } from "@/components/GoalVisual";
import { useHydrated, useT } from "@/lib/hooks";
import { useLang, useStore } from "@/lib/store";
import { langInfo } from "@/lib/i18n";
import { tx } from "@/lib/i18n";
import TXT from "@/messages/page";

export default function Welcome() {
  const hydrated = useHydrated();
  const current = useStore((s) => s.current);
  const loadDemo = useStore((s) => s.loadDemo);
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const [progress, setProgress] = useState(0.35);

  useEffect(() => {
    if (hydrated && current) router.replace("/inicio");
  }, [hydrated, current, router]);

  // the little house builds itself on the welcome screen
  useEffect(() => {
    const id = setInterval(() => setProgress((p) => (p >= 1 ? 0.2 : Math.min(1, p + 0.05))), 900);
    return () => clearInterval(id);
  }, []);

  if (!hydrated || current) return <div className="min-h-dvh bg-ink" />;

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-paper">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-10">
        <span className="flex items-center gap-2"><Logo light /><BetaBadge light /></span>
        <button onClick={() => setLangOpen(true)} className="flex h-12 items-center gap-2 rounded-full bg-paper/10 px-4 font-bold hover:bg-paper/20">
          <Languages size={22} /> {langInfo(lang).name}
        </button>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-5 pb-10 md:grid-cols-[1.1fr_1fr] md:px-10">
        <section className="order-2 md:order-1">
          <h1 className="text-[2.6rem] leading-[1.05] font-semibold md:text-[4rem]">{t("welcomeTitle")}</h1>
          <p className="mt-4 max-w-xl text-xl text-paper/80 md:text-2xl">{t("tagline")}</p>
          <div className="mt-6"><ListenButton text={t("welcomeSay")} audioKey="welcome" light /></div>

          <div className="mt-8 flex max-w-md flex-col gap-3">
            <Button href="/bienvenida" className="min-h-16 text-xl">{t("createAccount")}</Button>
            <Button href="/entrar" variant="soft" className="border-paper/20 bg-paper/5 text-paper hover:border-paper/40">{t("haveAccount")}</Button>
            <button
              onClick={async () => { await loadDemo(); router.push("/casita"); }}
              className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-2xl font-bold text-sun hover:bg-paper/5"
            >
              <Sparkles size={20} /> {t("tryDemo")}
            </button>
          </div>

          <p className="mt-8 flex max-w-md items-start gap-2 text-base text-paper/70">
            <ShieldCheck size={22} className="mt-0.5 shrink-0 text-leaf" /> {t("privacyNote")}
          </p>
          <p className="mt-3 max-w-md text-base text-paper/60">
            {tx(lang, TXT.versionBetaPuedeTenerErrores)}
            <Link href="/privacidad" className="font-bold text-paper/85 underline underline-offset-4">{tx(lang, TXT.privacidad)}</Link>
            {" · "}
            <Link href="/terminos" className="font-bold text-paper/85 underline underline-offset-4">{tx(lang, TXT.terminos)}</Link>
          </p>
        </section>

        <section className="order-1 flex justify-center md:order-2">
          <div className="rounded-full bg-ink-soft p-6 md:p-10">
            <GoalVisual visual="house" progress={progress} size={260} />
          </div>
        </section>
      </main>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </div>
  );
}
