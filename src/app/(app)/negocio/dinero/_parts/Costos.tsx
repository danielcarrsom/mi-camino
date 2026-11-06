"use client";
// Mi Negocio → Mi dinero → Costos: what each product costs and earns, and editing products.
import { useResetOn } from "@/lib/hooks";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { AmountInput, Button, Card, ListenButton, Sheet, cx } from "@/components/ui";
import { LightDot, useBiz } from "@/components/Biz";
import { useStore } from "@/lib/store";
import { money, unitWord } from "@/lib/money";
import { productLight, productsMonthly, suggestedPrice, type Product } from "@/lib/business";
import { playSaved } from "@/lib/sound";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/negocio-dinero";
import { Inventario } from "./Inventario";
import { DarkStat, Mini } from "./shared";

// ---------- Product costs ----------
export function Costos() {
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

export function ProductSheet({ product, onClose }: { product: Product | "new" | null; onClose: () => void }) {
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
