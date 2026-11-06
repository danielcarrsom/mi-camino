"use client";
// "Where do I start?": the first four things to do, in order, with one big
// button for the next one. It disappears once everything is done.
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { Card, ListenButton, cx } from "./ui";
import { useLang, useMe, useStore } from "@/lib/store";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/FirstSteps";

type Step = { done: boolean; label: string; href: string };

export function FirstSteps({ where }: { where: "casita" | "negocio" }) {
  const lang = useLang();
  const en = lang === "en";
  const me = useMe();
  const updateProfile = useStore((s) => s.updateProfile);
  if (!me) return null;
  const hiddenKey = where === "casita" ? "stepsHiddenCasita" : "stepsHiddenNegocio";
  if (me.profile[hiddenKey]) return null;

  let steps: Step[];
  if (where === "casita") {
    steps = [
      { done: me.work.length > 0 || me.entries.some((e) => e.kind === "in"), label: tx(en, TXT.anotaTuSalario), href: "/casita/anotar?tipo=gane" },
      { done: me.entries.some((e) => e.kind === "out" && e.repeat !== "once"), label: tx(en, TXT.anotaTuRentaYTus), href: "/casita/anotar?tipo=gaste" },
      { done: me.goals.length > 0, label: tx(en, TXT.creaTuPrimeraMeta), href: "/casita/metas?nueva=1" },
      { done: Object.keys(me.learn?.stars ?? {}).length > 0 || (me.learn?.read.length ?? 0) > 0, label: tx(en, TXT.juegaUnJuegoParaAprender), href: "/aprender" },
    ];
  } else {
    const b = me.business;
    if (!b) return null;
    steps = [
      { done: b.entries.some((e) => e.kind === "in"), label: tx(en, TXT.anotaLoQueVendisteHoy), href: "/negocio/anotar?tipo=venta" },
      { done: b.entries.some((e) => e.kind === "out" && e.repeat !== "once"), label: tx(en, TXT.anotaTusGastosFijosRenta), href: "/negocio/anotar?tipo=gasto" },
      { done: b.products.length > 0, label: tx(en, TXT.agregaLoQueVendesY), href: "/negocio/dinero?tab=costos" },
      { done: !!b.pay || b.entries.some((e) => e.category === "mi_sueldo"), label: tx(en, TXT.ponteUnSueldo), href: "/negocio?sueldo=1" },
    ];
  }
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const next = steps.find((s) => !s.done)!;
  const say = txf(en, TXT.tusPrimerosPasosLlevasDe, [doneCount, steps.length, next.label]);

  return (
    <Card className="mb-5 border-2 border-clay/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{tx(en, TXT.tusPrimerosPasos)}</h2>
          <p className="text-lg text-muted">{txf(en, TXT.llevasDe, [doneCount, steps.length])}</p>
        </div>
        <div className="flex items-center gap-1">
          <ListenButton compact text={say} />
          <button onClick={() => updateProfile({ [hiddenKey]: true })} aria-label={tx(en, TXT.ocultar)} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-sand/60"><X size={20} /></button>
        </div>
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map((s, i) => (
          <li key={i}>
            <Link href={s.href} className={cx("flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 text-lg font-bold", s === next ? "bg-clay/10" : "")}>
              <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-extrabold", s.done ? "bg-leaf text-paper" : s === next ? "bg-clay text-paper" : "bg-sand text-muted")}>
                {s.done ? <Check size={22} /> : i + 1}
              </span>
              <span className={cx("min-w-0 flex-1", s.done && "text-muted line-through")}>{s.label}</span>
              {s === next && <ArrowRight size={22} className="shrink-0 text-clay" />}
            </Link>
          </li>
        ))}
      </ol>
      <Link href={next.href} className="mt-4 flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-clay px-4 text-center text-xl font-extrabold text-paper shadow-[0_4px_0_#8f3a20] active:translate-y-0.5">
        {tx(en, TXT.sigue)} {next.label} <ArrowRight size={24} />
      </Link>
    </Card>
  );
}
