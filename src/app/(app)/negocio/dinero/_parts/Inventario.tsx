"use client";
// Mi Negocio → Mi dinero → Costos → Inventario: what you have, how long it lasts and what to buy.
import { useResetOn } from "@/lib/hooks";
import { useState } from "react";
import { Boxes, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { AmountInput, Button, Card, ListenButton, Sheet, cx } from "@/components/ui";
import { LightDot, useBiz } from "@/components/Biz";
import { useStore } from "@/lib/store";
import { money } from "@/lib/money";
import { type StockItem } from "@/lib/business";
import { playSaved } from "@/lib/sound";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/negocio-dinero";


// ---------- Inventory: what you have, how long it lasts, what to buy ----------
export const UNITS = [
  { es: "piezas", en: "pieces" }, { es: "kilos", en: "kilos" }, { es: "libras", en: "pounds" },
  { es: "paquetes", en: "packs" }, { es: "cajas", en: "boxes" }, { es: "litros", en: "liters" },
];

export function daysLeft(i: StockItem) {
  return i.perWeek > 0 ? (i.have / i.perWeek) * 7 : Infinity;
}

export function Inventario() {
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

export function StockSheet({ item, onClose, unitLabel }: { item: StockItem | "new" | null; onClose: () => void; unitLabel: (u: string) => string }) {
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

export function BoughtSheet({ item, onClose, onSave, unitLabel }: { item: StockItem | null; onClose: () => void; onSave: (qty: number, record: boolean) => void; unitLabel: (u: string) => string }) {
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
