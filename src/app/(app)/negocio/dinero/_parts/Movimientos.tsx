"use client";
// Mi Negocio → Mi dinero → Movimientos: every sale and cost, by month.
import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, ChevronDown, Repeat as RepeatIcon } from "lucide-react";
import { Button, Card, cx } from "@/components/ui";
import { BizEntryRow, BizEntrySheet, Stat, useBiz } from "@/components/Biz";
import { money, toMonthly } from "@/lib/money";
import { type BizEntry } from "@/lib/business";
import { tx } from "@/lib/i18n";
import TXT from "@/messages/negocio-dinero";
import { MiniRow } from "./shared";

// ---------- Sales and costs ----------
export function Movimientos() {
  const { biz, n, lang, goals30, free } = useBiz();
  const [edit, setEdit] = useState<BizEntry | null>(null);
  const [filter, setFilter] = useState<"todo" | "in" | "out">("todo");
  const [limit, setLimit] = useState(15);
  if (!biz) return null;
  const fixed = biz.entries.filter((e) => e.repeat !== "once");
  const fixedIn = fixed.filter((e) => e.kind === "in"), fixedOut = fixed.filter((e) => e.kind === "out");
  const once = biz.entries.filter((e) => e.repeat === "once" && (filter === "todo" || e.kind === filter)).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={tx(lang, TXT.vendiste30Dias)} value={money(n.sales, lang)} tone="in" />
        <Stat label={tx(lang, TXT.compraste30Dias)} value={money(n.varCosts, lang)} tone="out" />
        <Stat label={tx(lang, TXT.gastosFijosAlMes)} value={money(n.fixed, lang)} tone="out" />
        <Stat label={n.profit >= 0 ? tx(lang, TXT.teQuedo) : tx(lang, TXT.teFalto)} value={money(Math.abs(n.profit), lang)} tone="big" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniRow label={tx(lang, TXT.tuSueldo30Dias)} value={`−${money(n.paidMe, lang)}`} />
        <MiniRow label={tx(lang, TXT.apartadoParaMetas30Dias)} value={`−${money(goals30, lang)}`} />
        <MiniRow label={tx(lang, TXT.libreEnElNegocio)} value={money(free, lang)} strong={free >= 0} bad={free < 0} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button href="/negocio/anotar?tipo=venta" variant="green" className="px-3"><ArrowDownCircle size={24} /> {tx(lang, TXT.anotarVenta)}</Button>
        <Button href="/negocio/anotar?tipo=gasto" className="px-3"><ArrowUpCircle size={24} /> {tx(lang, TXT.anotarGasto)}</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><RepeatIcon size={22} className="text-clay" /> {tx(lang, TXT.gastosFijosDelNegocio)}</h2>
          <p className="text-base text-muted">{tx(lang, TXT.seCuentanSolosCadaMes)}</p>
          {fixedOut.length === 0 ? (
            <p className="py-4 text-lg text-muted">{tx(lang, TXT.sinGastosFijosPagasRenta)}</p>
          ) : (
            <ul className="divide-y divide-sand">{fixedOut.map((e) => <BizEntryRow key={e.id} e={e} onEdit={() => setEdit(e)} />)}</ul>
          )}
          {fixedOut.length > 0 && (
            <p className="mt-2 flex justify-between border-t-2 border-sand pt-3 text-lg font-extrabold">
              <span>{tx(lang, TXT.totalAlMes)}</span><span>{money(fixedOut.reduce((a, e) => a + toMonthly(e.amount, e.repeat), 0), lang)}</span>
            </p>
          )}
          {fixedIn.length > 0 && (
            <>
              <h3 className="mt-5 text-lg font-extrabold">{tx(lang, TXT.entradasQueSeRepiten)}</h3>
              <ul className="divide-y divide-sand">{fixedIn.map((e) => <BizEntryRow key={e.id} e={e} onEdit={() => setEdit(e)} />)}</ul>
            </>
          )}
        </Card>

        <Card className="min-w-0 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold">{tx(lang, TXT.todoLoQueAnotaste)}</h2>
            <div className="flex gap-1 rounded-full bg-cream p-1">
              {(["todo", "in", "out"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={cx("h-10 rounded-full px-3 text-base font-bold", filter === f ? "bg-ink text-paper" : "text-muted")}>
                  {f === "todo" ? tx(lang, TXT.todo) : f === "in" ? tx(lang, TXT.ventas) : tx(lang, TXT.gastos)}
                </button>
              ))}
            </div>
          </div>
          {once.length === 0 ? (
            <p className="py-4 text-lg text-muted">{tx(lang, TXT.nadaTodavia)}</p>
          ) : (
            <ul className="divide-y divide-sand">{once.slice(0, limit).map((e) => <BizEntryRow key={e.id} e={e} onEdit={() => setEdit(e)} />)}</ul>
          )}
          {once.length > limit && <Button variant="ghost" className="mt-2 w-full" onClick={() => setLimit(limit + 20)}><ChevronDown size={20} /> {tx(lang, TXT.verMas)}</Button>}
        </Card>
      </div>
      <BizEntrySheet entry={edit} onClose={() => setEdit(null)} />
    </div>
  );
}
