"use client";
import { useResetOn } from "@/lib/hooks";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, Boxes, Calculator, Check, ChevronDown, Pencil, Plus, Receipt, Repeat as RepeatIcon, Telescope, Trash2 } from "lucide-react";
import { AmountInput, Button, Card, ListenButton, PageHeader, Sheet, cx } from "@/components/ui";
import { BizEntryRow, BizEntrySheet, LightDot, Semaforo, Stat, useBiz } from "@/components/Biz";
import { goalSaved, useStore } from "@/lib/store";
import { money, toMonthly, unitWord, localAmount, getCurrency } from "@/lib/money";
import { monthlyProfitDollars, productLight, productsMonthly, suggestedPrice, type BizEntry, type DollarScenario, type Product, type StockItem } from "@/lib/business";
import { playSaved } from "@/lib/sound";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/negocio-dinero";

type Tab = "movimientos" | "costos" | "futuro";

export default function DineroNegocioPage() {
  return (
    <Suspense>
      <Dinero />
    </Suspense>
  );
}

function Dinero() {
  const { biz, lang, health } = useBiz();
  const params = useSearchParams();
  const router = useRouter();
  const initial = (params.get("tab") as Tab) || "movimientos";
  const [tab, setTab] = useState<Tab>(["movimientos", "costos", "futuro"].includes(initial) ? initial : "movimientos");
  useResetOn(initial, () => { if (["movimientos", "costos", "futuro"].includes(initial)) setTab(initial); });
  useEffect(() => { if (!biz) router.replace("/negocio"); }, [biz, router]);
  if (!biz) return null;

  const pickTab = (t: Tab) => { setTab(t); router.replace(`/negocio/dinero?tab=${t}`, { scroll: false }); };
  const tabs: { id: Tab; label: string; short: string; icon: React.ReactNode }[] = [
    { id: "movimientos", label: tx(lang, TXT.ventasYGastos), short: tx(lang, TXT.ventasYGastos2), icon: <Receipt size={22} /> },
    { id: "costos", label: tx(lang, TXT.misCostos), short: tx(lang, TXT.costos), icon: <Calculator size={22} /> },
    { id: "futuro", label: tx(lang, TXT.aFuturo), short: tx(lang, TXT.aFuturo2), icon: <Telescope size={22} /> },
  ];

  return (
    <div>
      <PageHeader
        title={tx(lang, TXT.elDineroDeMiNegocio)}
        say={tx(lang, TXT.aquiAnotasLoQueVendes)}
        right={<span className="hidden md:block"><Semaforo light={health.light} size={18} horizontal /></span>}
      />

      <div role="tablist" className="mb-6 grid grid-cols-3 gap-2 rounded-3xl bg-sand/60 p-1.5">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => pickTab(t.id)}
            className={cx("flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.95rem] leading-tight font-extrabold transition sm:flex-row sm:gap-2 sm:text-lg", tab === t.id ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink")}>
            {t.icon}<span className="text-center sm:hidden">{t.short}</span><span className="hidden text-center sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "movimientos" && <Movimientos />}
      {tab === "costos" && <Costos />}
      {tab === "futuro" && <Futuro />}
    </div>
  );
}

// ---------- Sales and costs ----------
function Movimientos() {
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

// ---------- Product costs ----------
function Costos() {
  const { biz, n, lang } = useBiz();
  const [edit, setEdit] = useState<Product | "new" | null>(null);
  if (!biz) return null;
  const pm = productsMonthly(biz.products);
  const left = pm.gain - n.fixed;
  const best = [...biz.products].filter((p) => p.price > p.cost).sort((a, b) => (b.price - b.cost) * b.perWeek - (a.price - a.cost) * a.perWeek)[0];
  const breakEven = best && n.fixed > 0 ? Math.ceil(n.fixed / (best.price - best.cost)) : 0;
  const summary = biz.products.length
    ? txf(lang, TXT.conLoQueVendesEn, [money(pm.gain, lang), money(n.fixed, lang), left >= 0 ? `Te quedan ${money(left, lang)}.` : `Te faltan ${money(-left, lang)}.`, left >= 0 ? `You keep ${money(left, lang)}.` : `You're short ${money(-left, lang)}.`])
    : "";

  return (
    <div className="space-y-5">
      <Card className="bg-sun-soft">
        <p className="text-lg">
          <b>{tx(lang, TXT.leEstasGanandoALo)}</b>{" "}
          {tx(lang, TXT.anotaCuantoTeCuestaHacer)}
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" data-tour="costos">
        {biz.products.map((p) => {
          const gain = p.price - p.cost;
          const m = p.price > 0 ? gain / p.price : 0;
          const light = productLight(p);
          const sp = suggestedPrice(p.cost);
          return (
            <Card key={p.id} className="min-w-0">
              <div className="flex items-start gap-3">
                <LightDot light={light} />
                <h3 className="-mt-1 min-w-0 flex-1 truncate text-xl font-extrabold">{p.name}</h3>
                <button onClick={() => setEdit(p)} aria-label={tx(lang, TXT.cambiar)} className="-mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sand/60"><Pencil size={20} /></button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Mini label={tx(lang, TXT.teCuesta)} value={money(p.cost, lang, true)} />
                <Mini label={tx(lang, TXT.loVendes)} value={money(p.price, lang, true)} />
                <Mini label={tx(lang, TXT.ganas)} value={money(gain, lang, true)} strong={gain > 0} bad={gain <= 0} />
              </div>
              <p className="mt-3 text-base">
                {gain > 0
                  ? txf(lang, TXT.deCadaQueCobrasGanas, [unitWord(lang, false), Math.round(m * 100)])
                  : tx(lang, TXT.loVendesAlCostoO)}
                {p.perWeek > 0 && <> {txf(lang, TXT.vendesALaSemanaDe, [p.perWeek, money(gain * p.perWeek, lang)])}</>}
              </p>
              {light !== "verde" && sp > p.price && (
                <p className="mt-3 rounded-2xl bg-sun-soft px-3 py-2 text-base">💡 {txf(lang, TXT.pruebaVenderloAAsiGanas, [money(sp, lang, true), unitWord(lang, false)])}</p>
              )}
            </Card>
          );
        })}
        <button onClick={() => setEdit("new")} className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-sand-dark p-5 text-lg font-extrabold text-clay hover:bg-paper">
          <Plus size={32} /> {tx(lang, TXT.agregarLoQueVendo)}
        </button>
      </div>

      {biz.products.length > 0 && (
        <Card dark>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-extrabold">{tx(lang, TXT.tuMesConEstosProductos)}</h2>
            <ListenButton text={summary} compact light />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <DarkStat label={tx(lang, TXT.vendes)} value={money(pm.sales, lang)} />
            <DarkStat label={tx(lang, TXT.teCuesta2)} value={money(pm.costs, lang)} />
            <DarkStat label={tx(lang, TXT.gastosFijos)} value={money(n.fixed, lang)} />
            <DarkStat label={left >= 0 ? tx(lang, TXT.teQueda) : tx(lang, TXT.teFalta)} value={money(Math.abs(left), lang)} accent />
          </div>
          {best && breakEven > 0 && (
            <p className="mt-4 text-lg text-paper/90">
              {txf(lang, TXT.paraPagarTusGastosFijos, [breakEven, best.name, Math.ceil(breakEven / 4.33)])}
            </p>
          )}
        </Card>
      )}

      <ProductSheet product={edit} onClose={() => setEdit(null)} />
      <div className="pt-4"><Inventario /></div>
    </div>
  );
}

function MiniRow({ label, value, strong, bad }: { label: string; value: string; strong?: boolean; bad?: boolean }) {
  return (
    <div className={cx("flex min-w-0 items-center justify-between gap-2 rounded-2xl px-4 py-3", strong ? "bg-leaf/12" : bad ? "bg-clay/10" : "bg-paper border border-sand")}>
      <span className="text-base font-bold">{label}</span>
      <span className={cx("text-xl font-extrabold", strong && "text-leaf", bad && "text-clay")}>{value}</span>
    </div>
  );
}

function Mini({ label, value, strong, bad }: { label: string; value: string; strong?: boolean; bad?: boolean }) {
  return (
    <div className={cx("min-w-0 rounded-2xl px-1 py-2", strong ? "bg-leaf/12" : bad ? "bg-clay/10" : "bg-cream")}>
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className={cx("truncate text-lg font-extrabold", strong && "text-leaf", bad && "text-clay")}>{value}</p>
    </div>
  );
}

function DarkStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cx("min-w-0 rounded-2xl p-3", accent ? "bg-sun text-ink" : "bg-paper/10")}>
      <p className={cx("text-base font-bold", accent ? "text-ink" : "text-paper/80")}>{label}</p>
      <p className="truncate font-serif text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ProductSheet({ product, onClose }: { product: Product | "new" | null; onClose: () => void }) {
  const { lang } = useBiz();
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const removeProduct = useStore((s) => s.removeProduct);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [perWeek, setPerWeek] = useState("");
  const [batch, setBatch] = useState(false);
  const [batchCost, setBatchCost] = useState("");
  const [batchUnits, setBatchUnits] = useState("");
  useResetOn(product, () => {
    if (!product) return;
    const p = product === "new" ? null : product;
    setName(p?.name ?? ""); setCost(p ? String(p.cost) : ""); setPrice(p ? String(p.price) : ""); setPerWeek(p ? String(p.perWeek) : "");
    setBatch(false); setBatchCost(""); setBatchUnits("");
  });

  const unitFromBatch = Number(batchCost) > 0 && Number(batchUnits) > 0 ? Number(batchCost) / Number(batchUnits) : 0;
  /** "I buy a batch": the cost of one comes from the batch price ÷ how many it makes. */
  const fromBatch = (costText: string, unitsText: string) => {
    setBatchCost(costText); setBatchUnits(unitsText);
    const unit = Number(costText) > 0 && Number(unitsText) > 0 ? Number(costText) / Number(unitsText) : 0;
    if (unit) setCost(String(Math.round(unit * 100) / 100));
  };

  if (!product) return null;
  const c = Number(cost) || 0, pr = Number(price) || 0;
  const preview: Product = { id: "x", name, cost: c, price: pr, perWeek: Number(perWeek) || 0, createdAt: "" };
  const sp = suggestedPrice(c);
  const ok = name.trim().length > 0 && c > 0 && pr > 0;

  return (
    <Sheet open={!!product} onClose={onClose} title={product === "new" ? tx(lang, TXT.algoQueVendo) : product.name}>
      <div className="space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={tx(lang, TXT.queVendesEjTamal)} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg outline-none focus:border-clay" />

        <div>
          <AmountInput label={tx(lang, TXT.cuantoTeCuestaHacerO)} value={cost} onChange={(v) => { setCost(v); setBatch(false); }} />
          <button onClick={() => setBatch(!batch)} className="mt-2 text-base font-bold text-clay underline underline-offset-4">
            {tx(lang, TXT.noSabesTeAyudoA)}
          </button>
          {batch && (
            <div className="mt-3 rounded-2xl bg-cream p-4">
              <p className="text-base">{tx(lang, TXT.piensaEnUnaTandaLo)}</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block min-w-0">
                  <span className="mb-1 block text-base font-bold">{tx(lang, TXT.gasteEnTodo)}</span>
                  <input inputMode="decimal" value={batchCost} onChange={(e) => fromBatch(e.target.value.replace(/[^\d.]/g, ""), batchUnits)} placeholder="$50" className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-3 text-xl font-bold outline-none focus:border-clay" />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-base font-bold">{tx(lang, TXT.meSalieron)}</span>
                  <input inputMode="numeric" value={batchUnits} onChange={(e) => fromBatch(batchCost, e.target.value.replace(/\D/g, ""))} placeholder="40" className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-3 text-xl font-bold outline-none focus:border-clay" />
                </label>
              </div>
              {unitFromBatch > 0 && <p className="mt-3 text-lg font-extrabold">= {money(unitFromBatch, lang, true)} {tx(lang, TXT.cadaUno)}</p>}
            </div>
          )}
        </div>

        <AmountInput label={tx(lang, TXT.aCuantoVendesUno)} value={price} onChange={setPrice} />

        <label className="block">
          <span className="mb-2 block text-lg font-bold">{tx(lang, TXT.cuantosVendesEnUnaSemana)}</span>
          <input inputMode="numeric" value={perWeek} onChange={(e) => setPerWeek(e.target.value.replace(/\D/g, ""))} placeholder="0" className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-xl font-bold outline-none focus:border-clay" />
        </label>

        {c > 0 && pr > 0 && (
          <div className={cx("rounded-2xl p-4", productLight(preview) === "verde" ? "bg-leaf/12" : productLight(preview) === "amarillo" ? "bg-sun-soft" : "bg-clay/10")}>
            <p className="flex items-center gap-2 text-lg font-extrabold"><LightDot light={productLight(preview)} /> {txf(lang, TXT.ganasPorCadaUno, [money(pr - c, lang, true)])}</p>
            {sp > pr && <p className="mt-1 text-base">{txf(lang, TXT.teConvieneVenderloAO, [money(sp, lang, true)])} <button onClick={() => setPrice(String(sp))} className="font-extrabold text-clay underline">{tx(lang, TXT.usarEsePrecio)}</button></p>}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="green" disabled={!ok} onClick={() => {
            const data = { name: name.trim(), cost: c, price: pr, perWeek: Number(perWeek) || 0 };
            if (product === "new") addProduct(data); else updateProduct(product.id, data);
            playSaved(); onClose();
          }}><Check size={22} /> {tx(lang, TXT.guardar)}</Button>
          {product !== "new" && <Button variant="soft" onClick={() => { removeProduct(product.id); onClose(); }}><Trash2 size={20} /> {tx(lang, TXT.borrar)}</Button>}
        </div>
      </div>
    </Sheet>
  );
}

// ---------- Looking ahead ----------
const MORE = [-100, 0, 50, 100, 200, 400];
const PRICE = [0, 0.25, 0.5, 1];
const CUT = [0, 25, 50, 100];
const PRICE_MXN = [0, 2, 5, 10];

function Futuro() {
  const { biz, n, lang } = useBiz();
  const [s, setS] = useState<DollarScenario>(() => ({ moreWeekly: localAmount(100), pricePerPiece: 0, cutWeekly: 0 }));
  const base = useMemo(() => {
    if (!biz) return { weeklySales: 0, weeklyVar: 0, fixed: 0, fromProducts: false };
    if (n.weeklySales > 0) return { weeklySales: n.weeklySales, weeklyVar: n.weeklyVar, fixed: n.fixed, fromProducts: false };
    const pm = productsMonthly(biz.products);
    return { weeklySales: pm.sales / 4.33, weeklyVar: pm.costs / 4.33, fixed: n.fixed, fromProducts: true };
  }, [biz, n]);
  if (!biz) return null;

  const units = biz.products.reduce((a, p) => a + p.perWeek, 0);
  const same = monthlyProfitDollars(base, units, { moreWeekly: 0, pricePerPiece: 0, cutWeekly: 0 });
  const withChanges = monthlyProfitDollars(base, units, s);
  const diff = withChanges - same;
  const horizons = [{ m: 1, l: tx(lang, TXT.t1Mes) }, { m: 3, l: tx(lang, TXT.t3Meses) }, { m: 6, l: tx(lang, TXT.t6Meses) }, { m: 12, l: tx(lang, TXT.t1Ano) }];
  const max = Math.max(1, ...horizons.map((h) => Math.max(same, withChanges, 0) * h.m));
  const dollars = (x: number) => (x > 0 ? `+${money(x, lang, x % 1 !== 0)}` : x < 0 ? `−${money(-x, lang)}` : tx(lang, TXT.igual));
  const say = txf(lang, TXT.siSiguesIgualTeQuedarian, [money(same, lang), money(withChanges, lang), money(withChanges * 12, lang)]);

  if (base.weeklySales === 0) {
    return (
      <Card className="py-8 text-center">
        <Telescope size={40} className="mx-auto text-clay" />
        <p className="mx-auto mt-3 max-w-md text-lg">{tx(lang, TXT.paraVerTuFuturoAnota)}</p>
        <Button href="/negocio/anotar?tipo=venta" variant="green" className="mt-5">{tx(lang, TXT.anotarVenta)}</Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <Card className="min-w-0 space-y-5 lg:col-span-2" data-tour="futuro">
        <div>
          <h2 className="text-xl font-extrabold">{tx(lang, TXT.ySi)}</h2>
          <p className="text-base text-muted">
            {base.fromProducts
              ? tx(lang, TXT.calculadoConTusProductos)
              : txf(lang, TXT.calculadoConTusUltimasSemanas, [money(base.weeklySales, lang)])}
          </p>
        </div>
        <Choice label={tx(lang, TXT.vendesEstoMasCadaSemana)} hint={tx(lang, TXT.enDineroDeVentasOjo)} options={MORE.map(localAmount)} value={s.moreWeekly} onPick={(v) => setS({ ...s, moreWeekly: v })} fmt={dollars} />
        {units > 0 ? (
          <Choice label={tx(lang, TXT.cobrasEstoMasPorCada)} hint={txf(lang, TXT.vendesUnasPiezasALa, [units])} options={getCurrency() === "MXN" ? PRICE_MXN : PRICE} value={s.pricePerPiece} onPick={(v) => setS({ ...s, pricePerPiece: v })} fmt={dollars} />
        ) : (
          <p className="rounded-2xl bg-cream px-4 py-3 text-base text-muted">{tx(lang, TXT.agregaLoQueVendesEn)}</p>
        )}
        <Choice label={tx(lang, TXT.gastasEstoMenosCadaSemana)} hint={tx(lang, TXT.porEjemploComprandoAlMayoreo)} options={CUT.map(localAmount)} value={s.cutWeekly} onPick={(v) => setS({ ...s, cutWeekly: v })} fmt={(x) => (x ? `−${money(x, lang)}` : tx(lang, TXT.igual))} />
      </Card>

      <div className="min-w-0 space-y-5 lg:col-span-3">
        <Card dark>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-bold text-paper/70">{tx(lang, TXT.teQuedariaAlMes)}</p>
              <p className="font-serif text-5xl font-semibold">{money(withChanges, lang)}</p>
              <p className="mt-1 text-lg text-paper/85">
                {tx(lang, TXT.siSiguesIgual)} {money(same, lang)}
                {Math.abs(diff) >= 1 && <span className={cx("ml-2 font-extrabold", diff > 0 ? "text-sun" : "text-[#f19a83]")}>{diff > 0 ? "+" : "−"}{money(Math.abs(diff), lang)}</span>}
              </p>
            </div>
            <ListenButton text={say} compact light />
          </div>
          <div className="mt-5 space-y-3">
            {horizons.map((h) => (
              <div key={h.m}>
                <div className="mb-1 flex justify-between text-base font-bold"><span>{h.l}</span><span>{money(withChanges * h.m, lang)}</span></div>
                <div className="space-y-1">
                  <div className="h-3.5 rounded-full bg-paper/10"><div className="h-full rounded-full bg-sun" style={{ width: `${(Math.max(0, withChanges) * h.m / max) * 100}%` }} /></div>
                  <div className="h-2 rounded-full bg-paper/10"><div className="h-full rounded-full bg-paper/40" style={{ width: `${(Math.max(0, same) * h.m / max) * 100}%` }} /></div>
                </div>
              </div>
            ))}
            <p className="flex gap-4 pt-1 text-sm text-paper/70">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-sun" /> {tx(lang, TXT.conCambios)}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-5 rounded-full bg-paper/40" /> {tx(lang, TXT.siSiguesIgual2)}</span>
            </p>
          </div>
        </Card>

        {biz.goals.length > 0 && withChanges > 0 && (
          <Card>
            <h3 className="text-lg font-extrabold">{tx(lang, TXT.cuandoLlegasATusMetas)}</h3>
            <p className="text-base text-muted">{tx(lang, TXT.siApartasLaMitadDe)}</p>
            <ul className="mt-2 divide-y divide-sand">
              {biz.goals.map((g) => {
                const missing = Math.max(0, g.target - goalSaved(g));
                const months = missing === 0 ? 0 : Math.ceil(missing / (withChanges / 2));
                return (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-3 text-lg">
                    <span className="min-w-0 truncate font-bold">{g.name}</span>
                    <span className="shrink-0 font-extrabold text-leaf">{months === 0 ? tx(lang, TXT.yaLaTienes) : months === 1 ? tx(lang, TXT.en1Mes) : txf(lang, TXT.enMeses, [months])}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
        <p className="text-sm text-muted">{tx(lang, TXT.esUnCalculoAproximadoCon)}</p>
      </div>
    </div>
  );
}

function Choice({ label, hint, options, value, onPick, fmt }: { label: string; hint?: string; options: number[]; value: number; onPick: (v: number) => void; fmt: (x: number) => string }) {
  return (
    <div>
      <p className="text-lg font-bold">{label}</p>
      {hint && <p className="text-base text-muted">{hint}</p>}
      <div className="mb-2" />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onPick(o)} aria-pressed={value === o} className={cx("h-12 min-w-16 rounded-2xl border-2 px-3 text-lg font-extrabold", value === o ? "border-ink bg-ink text-paper" : "border-sand bg-paper")}>
            {fmt(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Inventory: what you have, how long it lasts, what to buy ----------
const UNITS = [
  { es: "piezas", en: "pieces" }, { es: "kilos", en: "kilos" }, { es: "libras", en: "pounds" },
  { es: "paquetes", en: "packs" }, { es: "cajas", en: "boxes" }, { es: "litros", en: "liters" },
];

function daysLeft(i: StockItem) {
  return i.perWeek > 0 ? (i.have / i.perWeek) * 7 : Infinity;
}

function Inventario() {
  const { biz, lang } = useBiz();
  const addBizEntries = useStore((s) => s.addBizEntries);
  const updateStock = useStore((s) => s.updateStock);
  const [edit, setEdit] = useState<StockItem | "new" | null>(null);
  const [bought, setBought] = useState<StockItem | null>(null);
  const [recount, setRecount] = useState<StockItem | null>(null);
  const [count, setCount] = useState("");
  useResetOn(recount, () => { if (recount) setCount(String(recount.have)); });
  const [weeks, setWeeks] = useState(2);
  const [season, setSeason] = useState(false);
  if (!biz) return null;
  const stock = biz.stock ?? [];
  const unitLabel = (u: string) => (lang === "en" ? UNITS.find((x) => x.es === u)?.en ?? u : u);
  const plan = stock.map((i) => {
    const need = Math.max(0, Math.ceil(i.perWeek * weeks * (season ? 1.5 : 1) - i.have));
    return { i, need, cost: need * i.cost };
  });
  const total = plan.reduce((a, p) => a + p.cost, 0);
  const say = stock.length
    ? txf(lang, TXT.paraLasProximasSemanasNecesitas, [weeks, season ? ", en temporada alta," : "", plan.filter((p) => p.need > 0).map((p) => `${p.need} ${p.i.unit} de ${p.i.name}`).join(", ") || "nada, ya tienes suficiente", money(total, lang), season ? ", in the busy season," : "", plan.filter((p) => p.need > 0).map((p) => `${p.need} ${unitLabel(p.i.unit)} of ${p.i.name}`).join(", ") || "nothing, you have enough"])
    : "";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><Boxes size={26} className="text-clay" /> {tx(lang, TXT.miInventario)}</h2>
          <p className="text-lg text-muted">{tx(lang, TXT.loQueTienesGuardadoPara)}</p>
        </div>
        <Button variant="soft" className="min-h-12 px-4 text-base" onClick={() => setEdit("new")}><Plus size={20} /> {tx(lang, TXT.agregar)}</Button>
      </div>

      {stock.length === 0 ? (
        <Card><p className="text-lg text-muted">{tx(lang, TXT.agregaTusIngredientesMaterialesO)}</p></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {stock.map((i) => {
            const d = daysLeft(i);
            const light = d < 3 ? "rojo" : d < 7 ? "amarillo" : "verde";
            return (
              <Card key={i.id} className="min-w-0">
                <div className="flex items-start gap-3">
                  <LightDot light={light} />
                  <h3 className="-mt-1 min-w-0 flex-1 truncate text-xl font-extrabold">{i.name}</h3>
                  <button onClick={() => setEdit(i)} aria-label={tx(lang, TXT.cambiar)} className="-mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sand/60"><Pencil size={20} /></button>
                </div>
                <p className="mt-2 text-lg">{tx(lang, TXT.tienes)} <b>{i.have} {unitLabel(i.unit)}</b> · {tx(lang, TXT.usas)} {i.perWeek} {tx(lang, TXT.aLaSemana)}</p>
                <p className={cx("mt-2 rounded-2xl px-3 py-2 text-lg font-extrabold", light === "rojo" ? "bg-clay/10 text-clay" : light === "amarillo" ? "bg-sun-soft" : "bg-leaf/12 text-leaf")}>
                  {d === Infinity ? tx(lang, TXT.noLoUsasCadaSemana) : d < 1 ? tx(lang, TXT.seTeAcabaHoy) : txf(lang, TXT.teAlcanzaParaDias, [Math.floor(d)])}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => setBought(i)} className="h-12 rounded-2xl bg-leaf px-2 text-base font-extrabold text-paper">{tx(lang, TXT.compreMas)}</button>
                  <button onClick={() => setRecount(i)} className="h-12 rounded-2xl border-2 border-sand px-2 text-base font-bold">{tx(lang, TXT.contarOtraVez)}</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {stock.length > 0 && (
        <Card dark>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-extrabold">{tx(lang, TXT.cuantoComprarParaLasProximas)}</h3>
            <ListenButton compact light text={say} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 4].map((w) => (
              <button key={w} onClick={() => setWeeks(w)} aria-pressed={weeks === w} className={cx("h-12 rounded-2xl px-4 text-lg font-extrabold", weeks === w ? "bg-sun text-ink" : "bg-paper/10")}>
                {w === 1 ? tx(lang, TXT.t1Semana) : txf(lang, TXT.semanas, [w])}
              </button>
            ))}
            <button onClick={() => setSeason(!season)} aria-pressed={season} className={cx("h-12 rounded-2xl px-4 text-lg font-extrabold", season ? "bg-sun text-ink" : "bg-paper/10")}>
              🎉 {tx(lang, TXT.temporadaAltaVendoMas)}
            </button>
          </div>
          <ul className="mt-4 divide-y divide-paper/15">
            {plan.map(({ i, need, cost }) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-lg">
                <span className="min-w-0 truncate font-bold">{i.name}</span>
                <span className="shrink-0 text-right">{need > 0 ? <>{tx(lang, TXT.compra)} <b>{need} {unitLabel(i.unit)}</b> <span className="text-paper/70">≈ {money(cost, lang)}</span></> : <span className="text-sun">✓ {tx(lang, TXT.teAlcanza)}</span>}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-paper/20 pt-3 text-xl font-extrabold"><span>{tx(lang, TXT.necesitasGuardar)}</span><span className="text-sun">{money(total, lang)}</span></p>
        </Card>
      )}

      <StockSheet item={edit} onClose={() => setEdit(null)} unitLabel={unitLabel} />
      <Sheet open={!!recount} onClose={() => setRecount(null)} title={recount ? txf(lang, TXT.cuantoTienesAhora, [recount.name]) : ""}>
        {recount && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setCount(String(Math.max(0, (Number(count) || 0) - 1)))} aria-label="−" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand/60 text-3xl font-bold">−</button>
              <input inputMode="decimal" value={count} onChange={(e) => setCount(e.target.value.replace(/[^\d.]/g, ""))} className="h-16 w-full min-w-0 rounded-2xl border-2 border-sand bg-paper text-center text-3xl font-bold outline-none focus:border-clay" aria-label={unitLabel(recount.unit)} />
              <button onClick={() => setCount(String((Number(count) || 0) + 1))} aria-label="+" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-leaf text-3xl font-bold text-paper">+</button>
            </div>
            <p className="text-center text-lg text-muted">{unitLabel(recount.unit)}</p>
            <Button variant="green" className="w-full" onClick={() => { updateStock(recount.id, { have: Math.max(0, Number(count) || 0) }); playSaved(); setRecount(null); }}><Check size={22} /> {tx(lang, TXT.guardar)}</Button>
          </div>
        )}
      </Sheet>
      <BoughtSheet item={bought} onClose={() => setBought(null)} onSave={(qty, record) => {
        if (!bought) return;
        updateStock(bought.id, { have: bought.have + qty });
        if (record && qty * bought.cost > 0) addBizEntries([{ kind: "out", category: "mercancia", amount: Math.round(qty * bought.cost * 100) / 100, repeat: "once", note: `${qty} ${bought.unit} ${bought.name}`, date: new Date().toISOString(), source: "manual" }]);
        playSaved(); setBought(null);
      }} unitLabel={unitLabel} />
    </section>
  );
}

function StockSheet({ item, onClose, unitLabel }: { item: StockItem | "new" | null; onClose: () => void; unitLabel: (u: string) => string }) {
  const { lang } = useBiz();
  const addStock = useStore((s) => s.addStock);
  const updateStock = useStore((s) => s.updateStock);
  const removeStock = useStore((s) => s.removeStock);
  const [name, setName] = useState(""); const [unit, setUnit] = useState("piezas");
  const [have, setHave] = useState(""); const [perWeek, setPerWeek] = useState(""); const [cost, setCost] = useState("");
  useResetOn(item, () => {
    if (!item) return;
    const i = item === "new" ? null : item;
    setName(i?.name ?? ""); setUnit(i?.unit ?? "piezas"); setHave(i ? String(i.have) : ""); setPerWeek(i ? String(i.perWeek) : ""); setCost(i ? String(i.cost) : "");
  });
  if (!item) return null;
  const ok = name.trim() && Number(perWeek) >= 0 && have !== "";
  const num = (v: string) => v.replace(/[^\d.]/g, "");
  return (
    <Sheet open={!!item} onClose={onClose} title={item === "new" ? tx(lang, TXT.algoDeMiInventario) : item.name}>
      <div className="space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={tx(lang, TXT.queEsEjMasa)} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg outline-none focus:border-clay" />
        <div>
          <p className="mb-2 text-lg font-bold">{tx(lang, TXT.comoLoCuentas)}</p>
          <div className="flex flex-wrap gap-2">
            {UNITS.map((u) => (
              <button key={u.es} onClick={() => setUnit(u.es)} aria-pressed={unit === u.es} className={cx("h-11 rounded-full border-2 px-4 text-base font-bold", unit === u.es ? "border-ink bg-ink text-paper" : "border-sand bg-paper")}>{unitLabel(u.es)}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block min-w-0"><span className="mb-1 block text-base font-bold">{txf(lang, TXT.cuantosTienes, [unit, unitLabel(unit)])}</span>
            <input inputMode="decimal" value={have} onChange={(e) => setHave(num(e.target.value))} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-3 text-xl font-bold outline-none focus:border-clay" /></label>
          <label className="block min-w-0"><span className="mb-1 block text-base font-bold">{tx(lang, TXT.cuantosUsasALaSemana)}</span>
            <input inputMode="decimal" value={perWeek} onChange={(e) => setPerWeek(num(e.target.value))} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-3 text-xl font-bold outline-none focus:border-clay" /></label>
        </div>
        <AmountInput label={txf(lang, TXT.cuantoTeCuestaCadaOpcional, [unit.replace(/s$/, "")])} value={cost} onChange={setCost} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="green" disabled={!ok} onClick={() => {
            const data = { name: name.trim(), unit, have: Number(have) || 0, perWeek: Number(perWeek) || 0, cost: Number(cost) || 0 };
            if (item === "new") addStock(data); else updateStock(item.id, data);
            playSaved(); onClose();
          }}><Check size={22} /> {tx(lang, TXT.guardar)}</Button>
          {item !== "new" && <Button variant="soft" onClick={() => { removeStock(item.id); onClose(); }}><Trash2 size={20} /> {tx(lang, TXT.borrar)}</Button>}
        </div>
      </div>
    </Sheet>
  );
}

function BoughtSheet({ item, onClose, onSave, unitLabel }: { item: StockItem | null; onClose: () => void; onSave: (qty: number, record: boolean) => void; unitLabel: (u: string) => string }) {
  const { lang } = useBiz();
  const [qty, setQty] = useState("");
  const [record, setRecord] = useState(true);
  useResetOn(item, () => { if (item) { setQty(""); setRecord(true); } });
  if (!item) return null;
  const cost = (Number(qty) || 0) * item.cost;
  return (
    <Sheet open={!!item} onClose={onClose} title={txf(lang, TXT.compre, [item.name])}>
      <div className="space-y-4">
        <label className="block"><span className="mb-1 block text-lg font-bold">{txf(lang, TXT.cuantosCompraste, [item.unit, unitLabel(item.unit)])}</span>
          <input inputMode="decimal" autoFocus value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ""))} className="h-16 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-2xl font-bold outline-none focus:border-clay" /></label>
        {item.cost > 0 && (
          <button onClick={() => setRecord(!record)} aria-pressed={record} className={cx("flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left text-lg font-bold", record ? "border-leaf bg-leaf/10" : "border-sand")}>
            <span className={cx("flex h-7 w-7 items-center justify-center rounded-lg border-2", record ? "border-leaf bg-leaf text-paper" : "border-sand-dark")}>{record && <Check size={16} />}</span>
            {txf(lang, TXT.anotarElGastoEnMis, [money(cost, lang, cost % 1 !== 0)])}
          </button>
        )}
        <Button variant="green" className="w-full" disabled={!(Number(qty) > 0)} onClick={() => onSave(Number(qty), record)}><Check size={22} /> {tx(lang, TXT.guardar)}</Button>
      </div>
    </Sheet>
  );
}
