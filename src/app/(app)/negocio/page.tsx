"use client";
import { useResetOn } from "@/lib/hooks";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, Check, ChevronRight, HandCoins, Lightbulb, Pencil, Store } from "lucide-react";
import { Button, Card, ListenButton, PageHeader, Sheet, cx } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { GoalVisual } from "@/components/GoalVisual";
import { FirstSteps } from "@/components/FirstSteps";
import { BizEntryRow, BizEntrySheet, MyPayCard, PayMyselfSheet, Semaforo, Stat, TipList, useBiz } from "@/components/Biz";
import { goalSaved, useStore } from "@/lib/store";
import { money } from "@/lib/money";
import { pick } from "@/lib/catalog";
import { BIZ_TYPES, bizGoalPreset, bizTips, bizTypeById, type BizEntry, type BizType } from "@/lib/business";
import { playGoal } from "@/lib/sound";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/negocio";

export default function NegocioPage() {
  return (
    <Suspense>
      <Negocio />
    </Suspense>
  );
}

function Negocio() {
  const { biz, n, health, lang, goals30, free, region } = useBiz();
  const params = useSearchParams();
  const router = useRouter();
  const [pay, setPay] = useState(false);
  const [edit, setEdit] = useState<BizEntry | null>(null);
  const [rename, setRename] = useState(false);

  const sueldo = params.get("sueldo");
  useResetOn(sueldo, () => { if (sueldo) setPay(true); });
  useEffect(() => { if (sueldo) router.replace("/negocio"); }, [sueldo, router]);

  if (!biz) return <Setup />;

  const tips = bizTips(n, biz.products, biz.entries, biz.goals, lang, { type: biz.type, stock: biz.stock, hasPay: !!biz.pay, region }).slice(0, 3);
  const recent = [...biz.entries].filter((e) => e.repeat === "once").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const type = bizTypeById(biz.type);
  const lightBg = health.light === "verde" ? "bg-[#21412c]" : health.light === "amarillo" ? "bg-[#4a3a17]" : health.light === "rojo" ? "bg-[#4b1f16]" : "bg-ink";

  return (
    <div>
      <PageHeader
        title={biz.name}
        sub={txf(lang, TXT.miNegocio3, [pick(type.label, lang)])}
        say={health.say}
        right={<button onClick={() => setRename(true)} aria-label={tx(lang, TXT.cambiarNombre)} className="flex h-12 w-12 items-center justify-center rounded-full text-muted hover:bg-sand/60"><Pencil size={20} /></button>}
      />
      <FirstSteps where="negocio" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Semáforo */}
        <section data-tour="semaforo" className={cx("min-w-0 rounded-[2rem] p-5 text-paper md:p-6 lg:col-span-3", lightBg)}>
          <div className="flex items-start gap-5">
            <Semaforo light={health.light} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-paper/70">{tx(lang, TXT.elSemaforoDeTuNegocio)}</p>
              <h2 className="mt-1 text-[1.7rem] leading-tight font-semibold md:text-[2rem]">{health.title}</h2>
              <ul className="mt-3 space-y-2">
                {health.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-lg leading-snug"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-paper/70" /> {r}</li>
                ))}
              </ul>
              <div className="mt-4"><ListenButton text={health.say} light /></div>
            </div>
          </div>
        </section>

        {/* Numbers */}
        <Card className="flex min-w-0 flex-col lg:col-span-2">
          <p className="text-lg font-extrabold">{tx(lang, TXT.ultimos30Dias)}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label={tx(lang, TXT.vendiste)} value={money(n.sales, lang)} tone="in" />
            <Stat label={tx(lang, TXT.gastaste)} value={money(n.varCosts + n.fixed, lang)} tone="out" />
          </div>
          <div className="mt-3">
            <Stat label={n.profit >= 0 ? tx(lang, TXT.teQuedoTuGanancia) : tx(lang, TXT.teFalto)} value={money(Math.abs(n.profit), lang)} tone="big" />
          </div>
          {(n.paidMe > 0 || goals30 > 0) && (
            <ul className="mt-3 space-y-1.5 text-base">
              {n.paidMe > 0 && <li className="flex justify-between gap-2"><span>{tx(lang, TXT.tePagasteDeSueldo)}</span><b>−{money(n.paidMe, lang)}</b></li>}
              {goals30 > 0 && <li className="flex justify-between gap-2"><span>{tx(lang, TXT.apartasteParaTusMetas)}</span><b>−{money(goals30, lang)}</b></li>}
              <li className="flex justify-between gap-2 border-t border-sand pt-1.5 text-lg"><span className="font-bold">{tx(lang, TXT.libreEnElNegocio)}</span><b className={free < 0 ? "text-clay" : "text-leaf"}>{money(free, lang)}</b></li>
            </ul>
          )}
          <div className="mt-auto pt-3" data-tour="sueldo">
            {biz.pay ? <MyPayCard onEdit={() => setPay(true)} /> : (
              <Button variant="soft" className="w-full" onClick={() => setPay(true)}><HandCoins size={22} /> {tx(lang, TXT.ponermeUnSueldo)}</Button>
            )}
          </div>
        </Card>
      </div>

      {/* Big actions */}
      <div className="mt-4 grid grid-cols-2 gap-3" data-tour="vendi">
        <Link href="/negocio/anotar?tipo=venta" className="flex min-h-24 min-w-0 flex-col items-center justify-center gap-1 rounded-3xl bg-leaf px-3 text-center text-paper shadow-[0_4px_0_#2d5c3a] active:scale-[0.98] sm:flex-row sm:gap-3">
          <ArrowDownCircle size={32} /> <span className="text-lg leading-tight font-extrabold">{tx(lang, TXT.vendiOMePagaron)}</span>
        </Link>
        <Link href="/negocio/anotar?tipo=gasto" className="flex min-h-24 min-w-0 flex-col items-center justify-center gap-1 rounded-3xl bg-clay px-3 text-center text-paper shadow-[0_4px_0_#8f3a20] active:scale-[0.98] sm:flex-row sm:gap-3">
          <ArrowUpCircle size={32} /> <span className="text-lg leading-tight font-extrabold">{tx(lang, TXT.gasteOCompre)}</span>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Suggestions */}
        <Card className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-xl font-extrabold"><Lightbulb size={24} className="text-sun" /> {tx(lang, TXT.sugerenciasParaTi)}</h2>
            <Link href="/negocio/metas#ideas" className="shrink-0 text-base font-bold text-clay">{tx(lang, TXT.verTodas)}</Link>
          </div>
          <TipList tips={tips} lang={lang} />
        </Card>

        {/* Recent */}
        <Card className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold">{tx(lang, TXT.loUltimoQueAnotaste)}</h2>
            <Link href="/negocio/dinero" className="shrink-0 text-base font-bold text-clay">{tx(lang, TXT.verTodo)}</Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-4 text-lg text-muted">{tx(lang, TXT.todaviaNoAnotasNadaEmpieza)}</p>
          ) : (
            <ul className="divide-y divide-sand">{recent.map((e) => <BizEntryRow key={e.id} e={e} onEdit={() => setEdit(e)} />)}</ul>
          )}
        </Card>
      </div>

      {/* Goals preview */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{tx(lang, TXT.metasDelNegocio)}</h2>
          <Link href="/negocio/metas" className="text-base font-bold text-clay">{biz.goals.length ? tx(lang, TXT.verMetas) : tx(lang, TXT.crearUnaMeta)}</Link>
        </div>
        {biz.goals.length === 0 ? (
          <Link href="/negocio/metas" className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-sand-dark p-5">
            <GoalVisual visual="jar" progress={0} size={80} />
            <span className="min-w-0 flex-1 text-lg">{tx(lang, TXT.unCarritoEquipoNuevoTu)}</span>
            <ChevronRight size={24} />
          </Link>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {biz.goals.map((g) => {
              const p = Math.min(1, goalSaved(g) / g.target);
              return (
                <Link key={g.id} href={`/negocio/metas#${g.id}`} className="flex min-w-0 items-center gap-4 rounded-3xl border border-sand bg-paper p-4">
                  <GoalVisual visual={bizGoalPreset(g.preset).visual} progress={p} size={76} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-extrabold">{g.name}</span>
                    <span className="block text-base text-muted">{money(goalSaved(g), lang)} {tx(lang, TXT.de)} {money(g.target, lang)}</span>
                    <span className="mt-2 block h-2.5 overflow-hidden rounded-full bg-sand"><span className="block h-full rounded-full bg-sun" style={{ width: `${p * 100}%` }} /></span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-muted">{tx(lang, TXT.elSemaforoEsUnaGuia)}</p>

      <PayMyselfSheet open={pay} onClose={() => setPay(false)} suggested={n.profit > 0 ? n.profit / 2 : 0} />
      <BizEntrySheet entry={edit} onClose={() => setEdit(null)} />
      <RenameSheet open={rename} onClose={() => setRename(false)} />
    </div>
  );
}

function Setup() {
  const { me, lang } = useBiz();
  const setup = useStore((s) => s.setupBusiness);
  const [name, setName] = useState("");
  const [type, setType] = useState<BizType | null>(null);
  const ok = name.trim().length > 1 && type;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={tx(lang, TXT.miNegocio)}
        sub={tx(lang, TXT.llevaLasCuentasDeTu)}
        say={tx(lang, TXT.vamosAEmpezarTuNegocio)}
      />
      <Card data-tour="setup">
        <label className="block">
          <span className="mb-2 block text-lg font-bold">{tx(lang, TXT.comoSeLlamaTuNegocio)}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={txf(lang, TXT.ejTamales, [me?.profile.name ?? "María"])} className="h-16 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-xl outline-none focus:border-clay" />
        </label>
        <p className="mt-5 mb-2 text-lg font-bold">{tx(lang, TXT.queTipoDeNegocioEs)}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BIZ_TYPES.map((t) => (
            <button key={t.id} onClick={() => setType(t.id)} aria-pressed={type === t.id} className={cx("flex min-h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 text-center text-base leading-tight font-bold", type === t.id ? "border-clay bg-clay/10 ring-4 ring-clay/15" : "border-sand bg-paper")}>
              <Icon name={t.icon} size={26} className="text-clay" /> {pick(t.label, lang)}
            </button>
          ))}
        </div>
        <Button className="mt-6 w-full" disabled={!ok} onClick={() => { if (type) { setup({ name: name.trim(), type }); playGoal(); } }}>
          <Store size={22} /> {tx(lang, TXT.empezarMiNegocio)}
        </Button>
      </Card>
    </div>
  );
}

function RenameSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { biz, lang } = useBiz();
  const update = useStore((s) => s.updateBusiness);
  const [name, setName] = useState("");
  const [type, setType] = useState<BizType>("otro");
  useResetOn(open, () => { if (open && biz) { setName(biz.name); setType(biz.type); } });
  return (
    <Sheet open={open} onClose={onClose} title={tx(lang, TXT.miNegocio2)}>
      <input value={name} onChange={(e) => setName(e.target.value)} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg outline-none focus:border-clay" />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BIZ_TYPES.map((t) => (
          <button key={t.id} onClick={() => setType(t.id)} className={cx("flex min-h-16 items-center gap-2 rounded-2xl border-2 px-3 text-left text-base font-bold", type === t.id ? "border-clay bg-clay/10" : "border-sand bg-paper")}>
            <Icon name={t.icon} size={22} className="shrink-0 text-clay" /> {pick(t.label, lang)}
          </button>
        ))}
      </div>
      <Button variant="green" className="mt-5 w-full" disabled={name.trim().length < 2} onClick={() => { update({ name: name.trim(), type }); onClose(); }}>
        <Check size={22} /> {tx(lang, TXT.guardar)}
      </Button>
    </Sheet>
  );
}
