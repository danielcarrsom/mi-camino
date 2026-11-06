"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, Boxes, Calculator, Check, ChevronDown, Pencil, Plus, Receipt, Repeat as RepeatIcon, Telescope, Trash2 } from "lucide-react";
import { AmountInput, Button, Card, ListenButton, PageHeader, Sheet, cx } from "@/components/ui";
import { BizEntryRow, BizEntrySheet, L, LightDot, Semaforo, Stat, useBiz } from "@/components/Biz";
import { goalSaved, useStore } from "@/lib/store";
import { money, toMonthly } from "@/lib/money";
import { monthlyProfitDollars, productLight, productsMonthly, suggestedPrice, type BizEntry, type DollarScenario, type Product, type StockItem } from "@/lib/business";
import { playSaved } from "@/lib/sound";

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
  useEffect(() => { if (!biz) router.replace("/negocio"); }, [biz, router]);
  if (!biz) return null;

  const pickTab = (t: Tab) => { setTab(t); router.replace(`/negocio/dinero?tab=${t}`, { scroll: false }); };
  const tabs: { id: Tab; label: string; short: string; icon: React.ReactNode }[] = [
    { id: "movimientos", label: L(lang, "Ventas y gastos", "Sales and costs"), short: L(lang, "Ventas y gastos", "Sales & costs"), icon: <Receipt size={22} /> },
    { id: "costos", label: L(lang, "Mis costos", "My costs"), short: L(lang, "Costos", "Costs"), icon: <Calculator size={22} /> },
    { id: "futuro", label: L(lang, "A futuro", "Looking ahead"), short: L(lang, "A futuro", "Ahead"), icon: <Telescope size={22} /> },
  ];

  return (
    <div>
      <PageHeader
        title={L(lang, "El dinero de mi negocio", "My business money")}
        say={L(lang, "Aquí anotas lo que vendes y gastas, calculas cuánto te cuesta cada producto, y ves cuánto podrías ganar más adelante.", "Here you add what you sell and spend, figure out what each product costs, and see what you could earn ahead.")}
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
        <Stat label={L(lang, "Vendiste (30 días)", "Sold (30 days)")} value={money(n.sales, lang)} tone="in" />
        <Stat label={L(lang, "Compraste (30 días)", "Bought (30 days)")} value={money(n.varCosts, lang)} tone="out" />
        <Stat label={L(lang, "Gastos fijos al mes", "Fixed costs / month")} value={money(n.fixed, lang)} tone="out" />
        <Stat label={n.profit >= 0 ? L(lang, "Te quedó", "You kept") : L(lang, "Te faltó", "Short by")} value={money(Math.abs(n.profit), lang)} tone="big" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniRow label={L(lang, "Tu sueldo (30 días)", "Your salary (30 days)")} value={`−${money(n.paidMe, lang)}`} />
        <MiniRow label={L(lang, "Apartado para metas (30 días)", "Set aside for goals (30 days)")} value={`−${money(goals30, lang)}`} />
        <MiniRow label={L(lang, "Libre en el negocio", "Free in the business")} value={money(free, lang)} strong={free >= 0} bad={free < 0} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button href="/negocio/anotar?tipo=venta" variant="green" className="px-3"><ArrowDownCircle size={24} /> {L(lang, "Anotar venta", "Add sale")}</Button>
        <Button href="/negocio/anotar?tipo=gasto" className="px-3"><ArrowUpCircle size={24} /> {L(lang, "Anotar gasto", "Add cost")}</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><RepeatIcon size={22} className="text-clay" /> {L(lang, "Gastos fijos del negocio", "Fixed business costs")}</h2>
          <p className="text-base text-muted">{L(lang, "Se cuentan solos cada mes. Toca el lápiz para cambiarlos.", "They count on their own every month. Tap the pencil to change them.")}</p>
          {fixedOut.length === 0 ? (
            <p className="py-4 text-lg text-muted">{L(lang, "Sin gastos fijos. ¿Pagas renta del local, permisos o luz? Anótalos.", "No fixed costs. Do you pay rent, permits or utilities? Add them.")}</p>
          ) : (
            <ul className="divide-y divide-sand">{fixedOut.map((e) => <BizEntryRow key={e.id} e={e} onEdit={() => setEdit(e)} />)}</ul>
          )}
          {fixedOut.length > 0 && (
            <p className="mt-2 flex justify-between border-t-2 border-sand pt-3 text-lg font-extrabold">
              <span>{L(lang, "Total al mes", "Total per month")}</span><span>{money(fixedOut.reduce((a, e) => a + toMonthly(e.amount, e.repeat), 0), lang)}</span>
            </p>
          )}
          {fixedIn.length > 0 && (
            <>
              <h3 className="mt-5 text-lg font-extrabold">{L(lang, "Entradas que se repiten", "Repeating income")}</h3>
              <ul className="divide-y divide-sand">{fixedIn.map((e) => <BizEntryRow key={e.id} e={e} onEdit={() => setEdit(e)} />)}</ul>
            </>
          )}
        </Card>

        <Card className="min-w-0 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold">{L(lang, "Todo lo que anotaste", "Everything you added")}</h2>
            <div className="flex gap-1 rounded-full bg-cream p-1">
              {(["todo", "in", "out"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={cx("h-10 rounded-full px-3 text-base font-bold", filter === f ? "bg-ink text-paper" : "text-muted")}>
                  {f === "todo" ? L(lang, "Todo", "All") : f === "in" ? L(lang, "Ventas", "Sales") : L(lang, "Gastos", "Costs")}
                </button>
              ))}
            </div>
          </div>
          {once.length === 0 ? (
            <p className="py-4 text-lg text-muted">{L(lang, "Nada todavía.", "Nothing yet.")}</p>
          ) : (
            <ul className="divide-y divide-sand">{once.slice(0, limit).map((e) => <BizEntryRow key={e.id} e={e} onEdit={() => setEdit(e)} />)}</ul>
          )}
          {once.length > limit && <Button variant="ghost" className="mt-2 w-full" onClick={() => setLimit(limit + 20)}><ChevronDown size={20} /> {L(lang, "Ver más", "See more")}</Button>}
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
    ? L(lang,
      `Con lo que vendes en un mes normal, tus productos te dejan ${money(pm.gain, lang)}. Tus gastos fijos son ${money(n.fixed, lang)}. ${left >= 0 ? `Te quedan ${money(left, lang)}.` : `Te faltan ${money(-left, lang)}.`}`,
      `In a normal month your products leave you ${money(pm.gain, lang)}. Fixed costs are ${money(n.fixed, lang)}. ${left >= 0 ? `You keep ${money(left, lang)}.` : `You're short ${money(-left, lang)}.`}`)
    : "";

  return (
    <div className="space-y-5">
      <Card className="bg-sun-soft">
        <p className="text-lg">
          <b>{L(lang, "¿Le estás ganando a lo que vendes?", "Are you making money on what you sell?")}</b>{" "}
          {L(lang, "Anota cuánto te cuesta hacer o comprar cada cosa y a cuánto la vendes. Te digo cuánto ganas por pieza y a cuánto te conviene venderla.", "Write what each item costs you to make or buy and what you sell it for. I'll tell you what you earn per piece and a good price.")}
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                <button onClick={() => setEdit(p)} aria-label={L(lang, "Cambiar", "Edit")} className="-mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sand/60"><Pencil size={20} /></button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Mini label={L(lang, "Te cuesta", "Costs you")} value={money(p.cost, lang, true)} />
                <Mini label={L(lang, "Lo vendes", "You sell")} value={money(p.price, lang, true)} />
                <Mini label={L(lang, "Ganas", "You earn")} value={money(gain, lang, true)} strong={gain > 0} bad={gain <= 0} />
              </div>
              <p className="mt-3 text-base">
                {gain > 0
                  ? L(lang, `De cada dólar que cobras, ganas ${Math.round(m * 100)} centavos.`, `Out of every dollar, you keep ${Math.round(m * 100)} cents.`)
                  : L(lang, "Lo vendes al costo o perdiendo.", "You're selling at cost or at a loss.")}
                {p.perWeek > 0 && <> {L(lang, `Vendes ${p.perWeek} a la semana: ${money(gain * p.perWeek, lang)} de ganancia.`, `You sell ${p.perWeek} a week: ${money(gain * p.perWeek, lang)} profit.`)}</>}
              </p>
              {light !== "verde" && sp > p.price && (
                <p className="mt-3 rounded-2xl bg-sun-soft px-3 py-2 text-base">💡 {L(lang, `Prueba venderlo a ${money(sp, lang, true)}. Así ganas 40 centavos de cada dólar.`, `Try selling it at ${money(sp, lang, true)} to keep 40 cents of every dollar.`)}</p>
              )}
            </Card>
          );
        })}
        <button onClick={() => setEdit("new")} className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-sand-dark p-5 text-lg font-extrabold text-clay hover:bg-paper">
          <Plus size={32} /> {L(lang, "Agregar lo que vendo", "Add something I sell")}
        </button>
      </div>

      {biz.products.length > 0 && (
        <Card dark>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-extrabold">{L(lang, "Tu mes con estos productos", "Your month with these products")}</h2>
            <ListenButton text={summary} compact light />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <DarkStat label={L(lang, "Vendes", "Sales")} value={money(pm.sales, lang)} />
            <DarkStat label={L(lang, "Te cuesta", "Costs")} value={money(pm.costs, lang)} />
            <DarkStat label={L(lang, "Gastos fijos", "Fixed costs")} value={money(n.fixed, lang)} />
            <DarkStat label={left >= 0 ? L(lang, "Te queda", "You keep") : L(lang, "Te falta", "Short")} value={money(Math.abs(left), lang)} accent />
          </div>
          {best && breakEven > 0 && (
            <p className="mt-4 text-lg text-paper/90">
              {L(lang,
                `Para pagar tus gastos fijos necesitas vender al menos ${breakEven} piezas de ${best.name} al mes (unos ${Math.ceil(breakEven / 4.33)} por semana). Todo lo que vendas arriba de eso ya es ganancia.`,
                `To cover your fixed costs you need to sell at least ${breakEven} pieces of ${best.name} a month (about ${Math.ceil(breakEven / 4.33)} a week). Everything above that is profit.`)}
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
      <p className={cx("text-base font-bold", accent ? "text-ink/75" : "text-paper/70")}>{label}</p>
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
  useEffect(() => {
    if (!product) return;
    const p = product === "new" ? null : product;
    setName(p?.name ?? ""); setCost(p ? String(p.cost) : ""); setPrice(p ? String(p.price) : ""); setPerWeek(p ? String(p.perWeek) : "");
    setBatch(false); setBatchCost(""); setBatchUnits("");
  }, [product]);

  const unitFromBatch = Number(batchCost) > 0 && Number(batchUnits) > 0 ? Number(batchCost) / Number(batchUnits) : 0;
  useEffect(() => { if (batch && unitFromBatch) setCost(String(Math.round(unitFromBatch * 100) / 100)); }, [batch, unitFromBatch]);

  if (!product) return null;
  const c = Number(cost) || 0, pr = Number(price) || 0;
  const preview: Product = { id: "x", name, cost: c, price: pr, perWeek: Number(perWeek) || 0, createdAt: "" };
  const sp = suggestedPrice(c);
  const ok = name.trim().length > 0 && c > 0 && pr > 0;

  return (
    <Sheet open={!!product} onClose={onClose} title={product === "new" ? L(lang, "Algo que vendo", "Something I sell") : product.name}>
      <div className="space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={L(lang, "¿Qué vendes? Ej. Tamal", "What do you sell? e.g. Tamale")} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg outline-none focus:border-clay" />

        <div>
          <AmountInput label={L(lang, "¿Cuánto te cuesta hacer o comprar UNO?", "What does ONE cost you to make or buy?")} value={cost} onChange={(v) => { setCost(v); setBatch(false); }} />
          <button onClick={() => setBatch(!batch)} className="mt-2 text-base font-bold text-clay underline underline-offset-4">
            {L(lang, "¿No sabes? Te ayudo a calcularlo", "Not sure? I'll help you figure it out")}
          </button>
          {batch && (
            <div className="mt-3 rounded-2xl bg-cream p-4">
              <p className="text-base">{L(lang, "Piensa en una tanda: lo que gastaste en todo y cuántos te salieron.", "Think of one batch: what you spent on everything and how many you got.")}</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block min-w-0">
                  <span className="mb-1 block text-base font-bold">{L(lang, "Gasté en todo", "I spent")}</span>
                  <input inputMode="decimal" value={batchCost} onChange={(e) => setBatchCost(e.target.value.replace(/[^\d.]/g, ""))} placeholder="$50" className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-3 text-xl font-bold outline-none focus:border-clay" />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-base font-bold">{L(lang, "Me salieron", "I made")}</span>
                  <input inputMode="numeric" value={batchUnits} onChange={(e) => setBatchUnits(e.target.value.replace(/\D/g, ""))} placeholder="40" className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-3 text-xl font-bold outline-none focus:border-clay" />
                </label>
              </div>
              {unitFromBatch > 0 && <p className="mt-3 text-lg font-extrabold">= {money(unitFromBatch, lang, true)} {L(lang, "cada uno", "each")}</p>}
            </div>
          )}
        </div>

        <AmountInput label={L(lang, "¿A cuánto vendes UNO?", "What do you sell ONE for?")} value={price} onChange={setPrice} />

        <label className="block">
          <span className="mb-2 block text-lg font-bold">{L(lang, "¿Cuántos vendes en una semana normal?", "How many do you sell in a normal week?")}</span>
          <input inputMode="numeric" value={perWeek} onChange={(e) => setPerWeek(e.target.value.replace(/\D/g, ""))} placeholder="0" className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-xl font-bold outline-none focus:border-clay" />
        </label>

        {c > 0 && pr > 0 && (
          <div className={cx("rounded-2xl p-4", productLight(preview) === "verde" ? "bg-leaf/12" : productLight(preview) === "amarillo" ? "bg-sun-soft" : "bg-clay/10")}>
            <p className="flex items-center gap-2 text-lg font-extrabold"><LightDot light={productLight(preview)} /> {L(lang, `Ganas ${money(pr - c, lang, true)} por cada uno`, `You earn ${money(pr - c, lang, true)} each`)}</p>
            {sp > pr && <p className="mt-1 text-base">{L(lang, `Te conviene venderlo a ${money(sp, lang, true)} o más.`, `Better to sell it at ${money(sp, lang, true)} or more.`)} <button onClick={() => setPrice(String(sp))} className="font-extrabold text-clay underline">{L(lang, "Usar ese precio", "Use that price")}</button></p>}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="green" disabled={!ok} onClick={() => {
            const data = { name: name.trim(), cost: c, price: pr, perWeek: Number(perWeek) || 0 };
            if (product === "new") addProduct(data); else updateProduct(product.id, data);
            playSaved(); onClose();
          }}><Check size={22} /> {L(lang, "Guardar", "Save")}</Button>
          {product !== "new" && <Button variant="soft" onClick={() => { removeProduct(product.id); onClose(); }}><Trash2 size={20} /> {L(lang, "Borrar", "Delete")}</Button>}
        </div>
      </div>
    </Sheet>
  );
}

// ---------- Looking ahead ----------
const MORE = [-100, 0, 50, 100, 200, 400];
const PRICE = [0, 0.25, 0.5, 1];
const CUT = [0, 25, 50, 100];

function Futuro() {
  const { biz, n, lang } = useBiz();
  const [s, setS] = useState<DollarScenario>({ moreWeekly: 100, pricePerPiece: 0, cutWeekly: 0 });
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
  const horizons = [{ m: 1, l: L(lang, "1 mes", "1 month") }, { m: 3, l: L(lang, "3 meses", "3 months") }, { m: 6, l: L(lang, "6 meses", "6 months") }, { m: 12, l: L(lang, "1 año", "1 year") }];
  const max = Math.max(1, ...horizons.map((h) => Math.max(same, withChanges, 0) * h.m));
  const dollars = (x: number) => (x > 0 ? `+${money(x, lang, x % 1 !== 0)}` : x < 0 ? `−${money(-x, lang)}` : L(lang, "Igual", "Same"));
  const say = L(lang,
    `Si sigues igual, te quedarían unos ${money(same, lang)} al mes. Con estos cambios, ${money(withChanges, lang)} al mes. En un año serían ${money(withChanges * 12, lang)}.`,
    `If nothing changes, you'd keep about ${money(same, lang)} a month. With these changes, ${money(withChanges, lang)} a month. In a year that's ${money(withChanges * 12, lang)}.`);

  if (base.weeklySales === 0) {
    return (
      <Card className="py-8 text-center">
        <Telescope size={40} className="mx-auto text-clay" />
        <p className="mx-auto mt-3 max-w-md text-lg">{L(lang, "Para ver tu futuro, anota tus ventas de una semana o agrega lo que vendes en “Mis costos”.", "To look ahead, add one week of sales or add what you sell in “My costs”.")}</p>
        <Button href="/negocio/anotar?tipo=venta" variant="green" className="mt-5">{L(lang, "Anotar venta", "Add sale")}</Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <Card className="min-w-0 space-y-5 lg:col-span-2">
        <div>
          <h2 className="text-xl font-extrabold">{L(lang, "¿Y si…?", "What if…?")}</h2>
          <p className="text-base text-muted">
            {base.fromProducts
              ? L(lang, "Calculado con tus productos.", "Based on your products.")
              : L(lang, `Calculado con tus últimas semanas: vendes unos ${money(base.weeklySales, lang)} a la semana.`, `Based on recent weeks: you sell about ${money(base.weeklySales, lang)} a week.`)}
          </p>
        </div>
        <Choice label={L(lang, "…vendes esto más cada semana", "…you sell this much more each week")} hint={L(lang, "En dinero de ventas. Ojo: vender más también cuesta más hacer.", "In sales dollars. Selling more also costs more to make.")} options={MORE} value={s.moreWeekly} onPick={(v) => setS({ ...s, moreWeekly: v })} fmt={dollars} />
        {units > 0 ? (
          <Choice label={L(lang, "…cobras esto más por cada pieza", "…you charge this much more per piece")} hint={L(lang, `Vendes unas ${units} piezas a la semana.`, `You sell about ${units} pieces a week.`)} options={PRICE} value={s.pricePerPiece} onPick={(v) => setS({ ...s, pricePerPiece: v })} fmt={dollars} />
        ) : (
          <p className="rounded-2xl bg-cream px-4 py-3 text-base text-muted">{L(lang, "Agrega lo que vendes en “Mis costos” para probar qué pasa si subes tus precios.", "Add what you sell in “My costs” to try raising prices.")}</p>
        )}
        <Choice label={L(lang, "…gastas esto menos cada semana", "…you spend this much less each week")} hint={L(lang, "Por ejemplo, comprando al mayoreo.", "For example, buying in bulk.")} options={CUT} value={s.cutWeekly} onPick={(v) => setS({ ...s, cutWeekly: v })} fmt={(x) => (x ? `−${money(x, lang)}` : L(lang, "Igual", "Same"))} />
      </Card>

      <div className="min-w-0 space-y-5 lg:col-span-3">
        <Card dark>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-bold text-paper/70">{L(lang, "Te quedaría al mes", "You'd keep per month")}</p>
              <p className="font-serif text-5xl font-semibold">{money(withChanges, lang)}</p>
              <p className="mt-1 text-lg text-paper/85">
                {L(lang, "Si sigues igual:", "If nothing changes:")} {money(same, lang)}
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
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-sun" /> {L(lang, "Con cambios", "With changes")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-5 rounded-full bg-paper/40" /> {L(lang, "Si sigues igual", "No changes")}</span>
            </p>
          </div>
        </Card>

        {biz.goals.length > 0 && withChanges > 0 && (
          <Card>
            <h3 className="text-lg font-extrabold">{L(lang, "¿Cuándo llegas a tus metas?", "When do you reach your goals?")}</h3>
            <p className="text-base text-muted">{L(lang, "Si apartas la mitad de lo que te queda cada mes:", "If you set aside half of what you keep each month:")}</p>
            <ul className="mt-2 divide-y divide-sand">
              {biz.goals.map((g) => {
                const missing = Math.max(0, g.target - goalSaved(g));
                const months = missing === 0 ? 0 : Math.ceil(missing / (withChanges / 2));
                return (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-3 text-lg">
                    <span className="min-w-0 truncate font-bold">{g.name}</span>
                    <span className="shrink-0 font-extrabold text-leaf">{months === 0 ? L(lang, "¡Ya la tienes!", "Done!") : months === 1 ? L(lang, "en 1 mes", "in 1 month") : L(lang, `en ${months} meses`, `in ${months} months`)}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
        <p className="text-sm text-muted">{L(lang, "Es un cálculo aproximado con lo que anotaste. Las ventas reales cambian con la temporada.", "This is an estimate from what you entered. Real sales change with the season.")}</p>
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
  useEffect(() => { if (recount) setCount(String(recount.have)); }, [recount]);
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
    ? L(lang,
      `Para las próximas ${weeks} semanas${season ? ", en temporada alta," : ""} necesitas comprar: ${plan.filter((p) => p.need > 0).map((p) => `${p.need} ${p.i.unit} de ${p.i.name}`).join(", ") || "nada, ya tienes suficiente"}. En total, unos ${money(total, lang)}.`,
      `For the next ${weeks} weeks${season ? ", in the busy season," : ""} you need to buy: ${plan.filter((p) => p.need > 0).map((p) => `${p.need} ${unitLabel(p.i.unit)} of ${p.i.name}`).join(", ") || "nothing, you have enough"}. About ${money(total, lang)} in total.`)
    : "";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><Boxes size={26} className="text-clay" /> {L(lang, "Mi inventario", "My inventory")}</h2>
          <p className="text-lg text-muted">{L(lang, "Lo que tienes guardado, para cuántos días te alcanza y cuánto comprar.", "What you have, how many days it lasts and how much to buy.")}</p>
        </div>
        <Button variant="soft" className="min-h-12 px-4 text-base" onClick={() => setEdit("new")}><Plus size={20} /> {L(lang, "Agregar", "Add")}</Button>
      </div>

      {stock.length === 0 ? (
        <Card><p className="text-lg text-muted">{L(lang, "Agrega tus ingredientes, materiales o productos: por ejemplo, masa, hojas, vasos.", "Add your ingredients, materials or products: for example dough, husks, cups.")}</p></Card>
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
                  <button onClick={() => setEdit(i)} aria-label={L(lang, "Cambiar", "Edit")} className="-mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sand/60"><Pencil size={20} /></button>
                </div>
                <p className="mt-2 text-lg">{L(lang, "Tienes", "You have")} <b>{i.have} {unitLabel(i.unit)}</b> · {L(lang, "usas", "you use")} {i.perWeek} {L(lang, "a la semana", "a week")}</p>
                <p className={cx("mt-2 rounded-2xl px-3 py-2 text-lg font-extrabold", light === "rojo" ? "bg-clay/10 text-clay" : light === "amarillo" ? "bg-sun-soft" : "bg-leaf/12 text-leaf")}>
                  {d === Infinity ? L(lang, "No lo usas cada semana", "Not used weekly") : d < 1 ? L(lang, "¡Se te acaba hoy!", "Runs out today!") : L(lang, `Te alcanza para ${Math.floor(d)} días`, `Lasts ${Math.floor(d)} days`)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => setBought(i)} className="h-12 rounded-2xl bg-leaf px-2 text-base font-extrabold text-paper">{L(lang, "Compré más", "I bought more")}</button>
                  <button onClick={() => setRecount(i)} className="h-12 rounded-2xl border-2 border-sand px-2 text-base font-bold">{L(lang, "Contar otra vez", "Recount")}</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {stock.length > 0 && (
        <Card dark>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-extrabold">{L(lang, "¿Cuánto comprar para las próximas semanas?", "How much to buy for the coming weeks?")}</h3>
            <ListenButton compact light text={say} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 4].map((w) => (
              <button key={w} onClick={() => setWeeks(w)} aria-pressed={weeks === w} className={cx("h-12 rounded-2xl px-4 text-lg font-extrabold", weeks === w ? "bg-sun text-ink" : "bg-paper/10")}>
                {w === 1 ? L(lang, "1 semana", "1 week") : L(lang, `${w} semanas`, `${w} weeks`)}
              </button>
            ))}
            <button onClick={() => setSeason(!season)} aria-pressed={season} className={cx("h-12 rounded-2xl px-4 text-lg font-extrabold", season ? "bg-sun text-ink" : "bg-paper/10")}>
              🎉 {L(lang, "Temporada alta (vendo más)", "Busy season (selling more)")}
            </button>
          </div>
          <ul className="mt-4 divide-y divide-paper/15">
            {plan.map(({ i, need, cost }) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-lg">
                <span className="min-w-0 truncate font-bold">{i.name}</span>
                <span className="shrink-0 text-right">{need > 0 ? <>{L(lang, "Compra", "Buy")} <b>{need} {unitLabel(i.unit)}</b> <span className="text-paper/70">≈ {money(cost, lang)}</span></> : <span className="text-sun">✓ {L(lang, "Te alcanza", "Enough")}</span>}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-paper/20 pt-3 text-xl font-extrabold"><span>{L(lang, "Necesitas guardar", "You'll need")}</span><span className="text-sun">{money(total, lang)}</span></p>
        </Card>
      )}

      <StockSheet item={edit} onClose={() => setEdit(null)} unitLabel={unitLabel} />
      <Sheet open={!!recount} onClose={() => setRecount(null)} title={recount ? L(lang, `¿Cuánto ${recount.name} tienes ahora?`, `How much ${recount.name} now?`) : ""}>
        {recount && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setCount(String(Math.max(0, (Number(count) || 0) - 1)))} aria-label="−" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand/60 text-3xl font-bold">−</button>
              <input inputMode="decimal" value={count} onChange={(e) => setCount(e.target.value.replace(/[^\d.]/g, ""))} className="h-16 w-full min-w-0 rounded-2xl border-2 border-sand bg-paper text-center text-3xl font-bold outline-none focus:border-clay" aria-label={unitLabel(recount.unit)} />
              <button onClick={() => setCount(String((Number(count) || 0) + 1))} aria-label="+" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-leaf text-3xl font-bold text-paper">+</button>
            </div>
            <p className="text-center text-lg text-muted">{unitLabel(recount.unit)}</p>
            <Button variant="green" className="w-full" onClick={() => { updateStock(recount.id, { have: Math.max(0, Number(count) || 0) }); playSaved(); setRecount(null); }}><Check size={22} /> {L(lang, "Guardar", "Save")}</Button>
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
  useEffect(() => {
    if (!item) return;
    const i = item === "new" ? null : item;
    setName(i?.name ?? ""); setUnit(i?.unit ?? "piezas"); setHave(i ? String(i.have) : ""); setPerWeek(i ? String(i.perWeek) : ""); setCost(i ? String(i.cost) : "");
  }, [item]);
  if (!item) return null;
  const ok = name.trim() && Number(perWeek) >= 0 && have !== "";
  const num = (v: string) => v.replace(/[^\d.]/g, "");
  return (
    <Sheet open={!!item} onClose={onClose} title={item === "new" ? L(lang, "Algo de mi inventario", "An inventory item") : item.name}>
      <div className="space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={L(lang, "¿Qué es? Ej. Masa", "What is it? e.g. Dough")} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg outline-none focus:border-clay" />
        <div>
          <p className="mb-2 text-lg font-bold">{L(lang, "¿Cómo lo cuentas?", "How do you count it?")}</p>
          <div className="flex flex-wrap gap-2">
            {UNITS.map((u) => (
              <button key={u.es} onClick={() => setUnit(u.es)} aria-pressed={unit === u.es} className={cx("h-11 rounded-full border-2 px-4 text-base font-bold", unit === u.es ? "border-ink bg-ink text-paper" : "border-sand bg-paper")}>{unitLabel(u.es)}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block min-w-0"><span className="mb-1 block text-base font-bold">{L(lang, `¿Cuántos ${unit} tienes?`, `How many ${unitLabel(unit)} now?`)}</span>
            <input inputMode="decimal" value={have} onChange={(e) => setHave(num(e.target.value))} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-3 text-xl font-bold outline-none focus:border-clay" /></label>
          <label className="block min-w-0"><span className="mb-1 block text-base font-bold">{L(lang, "¿Cuántos usas a la semana?", "How many a week?")}</span>
            <input inputMode="decimal" value={perWeek} onChange={(e) => setPerWeek(num(e.target.value))} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-3 text-xl font-bold outline-none focus:border-clay" /></label>
        </div>
        <AmountInput label={L(lang, `¿Cuánto te cuesta cada ${unit.replace(/s$/, "")}? (opcional)`, `Cost of each? (optional)`)} value={cost} onChange={setCost} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="green" disabled={!ok} onClick={() => {
            const data = { name: name.trim(), unit, have: Number(have) || 0, perWeek: Number(perWeek) || 0, cost: Number(cost) || 0 };
            if (item === "new") addStock(data); else updateStock(item.id, data);
            playSaved(); onClose();
          }}><Check size={22} /> {L(lang, "Guardar", "Save")}</Button>
          {item !== "new" && <Button variant="soft" onClick={() => { removeStock(item.id); onClose(); }}><Trash2 size={20} /> {L(lang, "Borrar", "Delete")}</Button>}
        </div>
      </div>
    </Sheet>
  );
}

function BoughtSheet({ item, onClose, onSave, unitLabel }: { item: StockItem | null; onClose: () => void; onSave: (qty: number, record: boolean) => void; unitLabel: (u: string) => string }) {
  const { lang } = useBiz();
  const [qty, setQty] = useState("");
  const [record, setRecord] = useState(true);
  useEffect(() => { if (item) { setQty(""); setRecord(true); } }, [item]);
  if (!item) return null;
  const cost = (Number(qty) || 0) * item.cost;
  return (
    <Sheet open={!!item} onClose={onClose} title={L(lang, `Compré ${item.name}`, `I bought ${item.name}`)}>
      <div className="space-y-4">
        <label className="block"><span className="mb-1 block text-lg font-bold">{L(lang, `¿Cuántos ${item.unit} compraste?`, `How many ${unitLabel(item.unit)}?`)}</span>
          <input inputMode="decimal" autoFocus value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ""))} className="h-16 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-2xl font-bold outline-none focus:border-clay" /></label>
        {item.cost > 0 && (
          <button onClick={() => setRecord(!record)} aria-pressed={record} className={cx("flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left text-lg font-bold", record ? "border-leaf bg-leaf/10" : "border-sand")}>
            <span className={cx("flex h-7 w-7 items-center justify-center rounded-lg border-2", record ? "border-leaf bg-leaf text-paper" : "border-sand-dark")}>{record && <Check size={16} />}</span>
            {L(lang, `Anotar el gasto (${money(cost, lang, cost % 1 !== 0)}) en mis gastos`, `Add the cost (${money(cost, lang, cost % 1 !== 0)}) to my costs`)}
          </button>
        )}
        <Button variant="green" className="w-full" disabled={!(Number(qty) > 0)} onClick={() => onSave(Number(qty), record)}><Check size={22} /> {L(lang, "Guardar", "Save")}</Button>
      </div>
    </Sheet>
  );
}
