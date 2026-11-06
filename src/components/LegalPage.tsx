"use client";
// Shared layout for the privacy notice and the terms: a short plain-language
// summary first, then the full text, in Spanish or English.
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo, LogoMark, cx } from "./ui";
import { useLang, useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { LEGAL } from "@/lib/legal";

export type LegalSection = { title: string; body: React.ReactNode };
export type LegalDoc = { title: string; summaryTitle: string; summary: string[]; sections: LegalSection[] };

export function BetaBadge({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold tracking-wide uppercase", light ? "bg-sun text-ink" : "bg-sun-soft text-ink ring-1 ring-sun", className)}>
      Beta
    </span>
  );
}

export function LegalPage({ es, en }: { es: LegalDoc; en: LegalDoc }) {
  const hydrated = useHydrated();
  const lang = useLang();
  const current = useStore((s) => s.current);
  const [pick, setPick] = useState<"es" | "en" | null>(null);
  const english = pick ? pick === "en" : hydrated && lang === "en";
  const d = english ? en : es;
  return (
    <div className="min-h-dvh bg-cream">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-4">
        <Link href={current ? "/perfil" : "/"} className="flex items-center gap-2 text-base font-bold text-muted hover:text-ink">
          <ArrowLeft size={20} /> {english ? "Back" : "Regresar"}
        </Link>
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap"><span className="hidden sm:inline"><Logo /></span><span className="sm:hidden"><LogoMark /></span><BetaBadge /></span>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 pb-16">
        <div className="mb-4 flex justify-end gap-2 text-base font-bold">
          <button onClick={() => setPick("es")} aria-pressed={!english} className={cx("rounded-full px-3 py-1", !english ? "bg-ink text-paper" : "text-muted underline")}>Español</button>
          <button onClick={() => setPick("en")} aria-pressed={english} className={cx("rounded-full px-3 py-1", english ? "bg-ink text-paper" : "text-muted underline")}>English</button>
        </div>
        <h1 className="font-serif text-4xl font-semibold md:text-5xl">{d.title}</h1>
        <p className="mt-2 text-base text-muted">{english ? `Last updated: ${LEGAL.updatedEn}` : `Última actualización: ${LEGAL.updatedEs}`}</p>

        <section className="mt-6 rounded-3xl border-2 border-sun bg-sun-soft p-5">
          <h2 className="text-2xl font-bold">{d.summaryTitle}</h2>
          <ul className="mt-3 space-y-2 text-lg">
            {d.summary.map((s, i) => <li key={i} className="flex gap-2"><span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-clay" />{s}</li>)}
          </ul>
        </section>

        <div className="mt-8 space-y-7">
          {d.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-2xl font-bold">{i + 1}. {s.title}</h2>
              <div className="legal mt-2 space-y-3 text-lg leading-relaxed">{s.body}</div>
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-sand pt-5 text-base text-muted">
          {english ? "Questions? Write to " : "¿Preguntas? Escribe a "}
          <a className="font-bold text-clay underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.{" "}
          <Link className="font-bold text-clay underline" href="/privacidad">{english ? "Privacy notice" : "Aviso de privacidad"}</Link> ·{" "}
          <Link className="font-bold text-clay underline" href="/terminos">{english ? "Terms" : "Términos y condiciones"}</Link>
        </p>
      </main>
    </div>
  );
}
