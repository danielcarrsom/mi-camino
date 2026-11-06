"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, Check, Keyboard, Minus, Plus, Sparkles } from "lucide-react";
import { AmountInput, Button, Card, MicButton, PageHeader, QuickAmounts, cx } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { L, RepeatPicker, useBiz } from "@/components/Biz";
import { useStore } from "@/lib/store";
import { money, getCurrency, unitWord } from "@/lib/money";
import { pick, type Repeat } from "@/lib/catalog";
import { BIZ_CATEGORIES, bizCategoryById, parseBiz } from "@/lib/business";
import { playSaved } from "@/lib/sound";
import { speak } from "@/lib/voice";

export default function AnotarNegocioPage() {
  return (
    <Suspense>
      <Anotar />
    </Suspense>
  );
}

type Kind = "in" | "out";

function Anotar() {
  const { biz, lang } = useBiz();
  const params = useSearchParams();
  const router = useRouter();
  const add = useStore((s) => s.addBizEntries);
  const voiceOn = useStore((s) => s.voiceOn);
  const tipo = params.get("tipo");
  const [kind, setKind] = useState<Kind | null>(tipo === "venta" ? "in" : tipo === "gasto" ? "out" : null);

  const [cat, setCat] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState<Repeat>("once");
  const [when, setWhen] = useState<0 | 1>(0);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [typed, setTyped] = useState("");
  const [heard, setHeard] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ amount: number; kind: Kind } | null>(null);

  useEffect(() => {
    const k: Kind | null = tipo === "venta" ? "in" : tipo === "gasto" ? "out" : null;
    setKind(k); setCat(k === "in" ? "ventas" : null); setAmount(""); setNote(""); setRepeat("once"); setQty({}); setSaved(null); setHeard(null); setWhen(0);
  }, [tipo]);

  useEffect(() => { if (!biz) router.replace("/negocio"); }, [biz, router]);

  const products = biz?.products ?? [];
  const fromProducts = useMemo(() => products.reduce((a, p) => a + (qty[p.id] ?? 0) * p.price, 0), [products, qty]);
  useEffect(() => {
    if (fromProducts > 0) {
      setAmount(String(Math.round(fromProducts * 100) / 100));
      setNote(products.filter((p) => qty[p.id]).map((p) => `${qty[p.id]} ${p.name}`).join(", "));
    }
  }, [fromProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!biz) return null;

  const understand = (text: string) => {
    const r = parseBiz(text, kind ?? undefined);
    if (!r) { setHeard(L(lang, `No encontré una cantidad. Intenta: “vendí 300 ${unitWord(lang)}”.`, `I couldn't find an amount. Try: “I sold 300 ${unitWord(lang)}”.`)); return; }
    if (r.kind) setKind(r.kind);
    setAmount(String(r.amount)); setCat(r.category); setRepeat(r.repeat); setNote(r.note);
    const msg = L(lang, `Entendí: ${money(r.amount, lang, r.amount % 1 !== 0)}, ${pick(bizCategoryById(r.category ?? "otro_out").label, lang)}. Revisa y guarda.`, `Got it: ${money(r.amount, lang, r.amount % 1 !== 0)}, ${pick(bizCategoryById(r.category ?? "otro_out").label, lang)}. Check and save.`);
    setHeard(msg);
    if (voiceOn) speak(msg, lang);
  };

  const save = () => {
    if (!kind || !cat || !(Number(amount) > 0)) return;
    const d = new Date(); d.setDate(d.getDate() - when);
    add([{ kind, category: cat, amount: Number(amount), repeat, note: note.trim(), date: d.toISOString(), source: heard ? "voz" : "manual" }]);
    playSaved();
    setSaved({ amount: Number(amount), kind });
    if (voiceOn) speak(L(lang, "¡Anotado!", "Saved!"), lang);
  };

  if (!kind) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title={L(lang, "Anotar en mi negocio", "Add to my business")} back="/negocio" say={L(lang, "¿Vendiste o gastaste? Toca uno.", "Did you sell or spend? Tap one.")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/negocio/anotar?tipo=venta" className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[2rem] bg-leaf p-6 text-paper shadow-[0_5px_0_#2d5c3a]">
            <ArrowDownCircle size={48} /> <span className="text-2xl font-extrabold">{L(lang, "Vendí o me pagaron", "I sold / got paid")}</span>
          </Link>
          <Link href="/negocio/anotar?tipo=gasto" className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[2rem] bg-clay p-6 text-paper shadow-[0_5px_0_#8f3a20]">
            <ArrowUpCircle size={48} /> <span className="text-2xl font-extrabold">{L(lang, "Gasté o compré", "I spent / bought")}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <Card className="py-10">
          <span className={cx("mx-auto flex h-24 w-24 items-center justify-center rounded-full text-paper", saved.kind === "in" ? "bg-leaf" : "bg-clay")}><Check size={52} /></span>
          <p className="mt-5 text-3xl font-semibold">{L(lang, "¡Anotado!", "Saved!")}</p>
          <p className="mt-1 text-xl text-muted">{saved.kind === "in" ? "+" : "−"}{money(saved.amount, lang, saved.amount % 1 !== 0)}</p>
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button onClick={() => { setSaved(null); setAmount(""); setNote(""); setQty({}); setHeard(null); setTyped(""); }}>{L(lang, "Anotar otro", "Add another")}</Button>
            <Button href="/negocio" variant="soft">{L(lang, "Ver mi semáforo", "See my traffic light")}</Button>
          </div>
        </Card>
      </div>
    );
  }

  const isIn = kind === "in";
  const isOther = cat === "otro_out" || cat === "otro_fijo" || cat === "otro_in";
  const cats = BIZ_CATEGORIES.filter((c) => c.kind === kind && !c.hidden);
  const variable = cats.filter((c) => !c.fixed), fixed = cats.filter((c) => c.fixed);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isIn ? L(lang, "Vendí o me pagaron", "I sold / got paid") : L(lang, "Gasté o compré", "I spent / bought")}
        back="/negocio"
        say={isIn
          ? L(lang, `Dime cuánto vendiste. Por ejemplo: vendí cuarenta tamales a ${getCurrency() === "MXN" ? "veinte pesos" : "tres dólares"}. O toca tus productos.`, `Tell me how much you sold. For example: I sold forty tamales at ${getCurrency() === "MXN" ? "twenty pesos" : "three dollars"}. Or tap your products.`)
          : L(lang, `Dime qué compraste o pagaste. Por ejemplo: compré masa y carne, ${getCurrency() === "MXN" ? "novecientos pesos" : "ciento veinte dólares"}.`, `Tell me what you bought or paid. For example: I bought dough and meat, ${getCurrency() === "MXN" ? "nine hundred pesos" : "one hundred twenty dollars"}.`)}
      />

      {/* Say it or type it */}
      <Card className="mb-4">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <MicButton size="md" onText={understand} />
          <div className="w-full min-w-0 flex-1">
            <p className="mb-2 flex items-center gap-2 text-lg font-bold"><Keyboard size={20} /> {L(lang, "O escríbelo como lo dirías", "Or type it like you'd say it")}</p>
            <form onSubmit={(e) => { e.preventDefault(); if (typed.trim()) understand(typed); }} className="flex gap-2">
              <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={getCurrency() === "MXN" ? (isIn ? L(lang, "vendí 40 tamales a 20 pesos", "sold 40 tamales at 20 pesos") : L(lang, "compré masa 900 pesos", "bought dough 900 pesos")) : isIn ? L(lang, "vendí 40 tamales a 3 dólares", "sold 40 tamales at 3 dollars") : L(lang, "compré masa 120 dólares", "bought dough 120 dollars")} className="h-14 w-full min-w-0 rounded-2xl border-2 border-sand bg-paper px-4 text-lg outline-none focus:border-clay" />
              <button aria-label={L(lang, "Entender", "Understand")} className="flex h-14 shrink-0 items-center gap-2 rounded-2xl bg-ink px-4 font-extrabold text-paper"><Sparkles size={20} /> <span className="hidden sm:inline">{L(lang, "Entender", "Understand")}</span></button>
            </form>
          </div>
        </div>
        {heard && <p className="mt-4 rounded-2xl bg-sun-soft px-4 py-3 text-lg">{heard}</p>}
      </Card>

      {/* Tap your products */}
      {isIn && products.length > 0 && (
        <Card className="mb-4">
          <p className="mb-3 text-lg font-bold">{L(lang, "¿Qué vendiste? Toca + por cada uno", "What did you sell? Tap + for each")}</p>
          <ul className="space-y-2">
            {products.map((p) => {
              const q = qty[p.id] ?? 0;
              return (
                <li key={p.id} className="flex min-w-0 flex-wrap items-center gap-2 rounded-2xl bg-cream p-2 pl-4">
                  <span className="min-w-[9rem] flex-1">
                    <span className="block text-lg leading-tight font-extrabold">{p.name}</span>
                    <span className="text-base text-muted">{money(p.price, lang, true)} {L(lang, "cada uno", "each")}</span>
                  </span>
                  <span className="ml-auto flex items-center gap-2"><button onClick={() => setQty({ ...qty, [p.id]: Math.max(0, q - 1) })} aria-label="−" className="flex h-12 w-12 items-center justify-center rounded-xl bg-paper"><Minus size={22} /></button>
                  <input inputMode="numeric" value={q || ""} placeholder="0" onChange={(e) => setQty({ ...qty, [p.id]: Number(e.target.value.replace(/\D/g, "")) || 0 })} className="h-12 w-14 rounded-xl border-2 border-sand bg-paper text-center text-xl font-extrabold outline-none focus:border-clay" aria-label={p.name} />
                  <button onClick={() => setQty({ ...qty, [p.id]: q + 1 })} aria-label="+" className="flex h-12 w-12 items-center justify-center rounded-xl bg-leaf text-paper"><Plus size={22} /></button></span>
                </li>
              );
            })}
          </ul>
          {fromProducts > 0 && <p className="mt-3 text-right text-lg font-extrabold text-leaf">= {money(fromProducts, lang, true)}</p>}
        </Card>
      )}

      <Card className="space-y-5">
        {/* Category */}
        <div>
          <p className="mb-2 text-lg font-bold">{isIn ? L(lang, "¿De dónde vino?", "Where did it come from?") : L(lang, "¿En qué fue?", "What was it for?")}</p>
          {isIn ? (
            <CatGrid cats={cats} value={cat} onPick={(id) => { setCat(id); setRepeat("once"); }} />
          ) : (
            <>
              <p className="mb-2 text-base text-muted">{L(lang, "Lo que compras para vender", "What you buy to sell")}</p>
              <CatGrid cats={variable} value={cat} onPick={(id) => { setCat(id); setRepeat("once"); }} />
              <p className="mt-4 mb-2 text-base text-muted">{L(lang, "Gastos fijos (se repiten)", "Fixed costs (they repeat)")}</p>
              <CatGrid cats={fixed} value={cat} onPick={(id) => { setCat(id); setRepeat(bizCategoryById(id).repeat); }} />
            </>
          )}
        </div>

        <div>
          <AmountInput label={L(lang, "¿Cuánto?", "How much?")} value={amount} onChange={setAmount} />
          <QuickAmounts amounts={isIn ? [50, 100, 200, 300] : [20, 50, 100, 300]} onPick={(n) => setAmount(String(n))} />
        </div>

        {isOther ? (
          <label className="block">
            <span className="mb-2 block text-lg font-bold">{isIn ? L(lang, "¿De qué fue este dinero?", "What was this money for?") : L(lang, "¿Qué gasto es?", "What cost is it?")}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} autoFocus placeholder={isIn ? L(lang, "Ej. Me pagaron un préstamo", "e.g. A loan was paid back") : L(lang, "Ej. Seguro del carrito", "e.g. Cart insurance")} className="h-14 w-full rounded-2xl border-2 border-clay bg-paper px-4 text-lg outline-none" />
          </label>
        ) : (
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={isIn ? L(lang, "¿Qué vendiste? (opcional)", "What did you sell? (optional)") : L(lang, "¿Qué compraste? (opcional)", "What did you buy? (optional)")} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg outline-none focus:border-clay" />
        )}

        {!isIn && cat && <RepeatPicker value={repeat} onChange={setRepeat} kind="out" />}

        {repeat === "once" && (
          <div className="grid grid-cols-2 gap-2">
            {[L(lang, "Hoy", "Today"), L(lang, "Ayer", "Yesterday")].map((w, i) => (
              <button key={w} onClick={() => setWhen(i as 0 | 1)} className={cx("h-14 rounded-2xl border-2 text-lg font-bold", when === i ? "border-ink bg-ink text-paper" : "border-sand bg-paper")}>{w}</button>
            ))}
          </div>
        )}

        <Button variant={isIn ? "green" : "primary"} className="w-full" disabled={!cat || !(Number(amount) > 0) || (isOther && note.trim().length < 2)} onClick={save}>
          <Check size={24} /> {L(lang, "Guardar", "Save")} {Number(amount) > 0 ? money(Number(amount), lang, Number(amount) % 1 !== 0) : ""}
        </Button>
      </Card>
    </div>
  );
}

function CatGrid({ cats, value, onPick }: { cats: typeof BIZ_CATEGORIES; value: string | null; onPick: (id: string) => void }) {
  const { lang } = useBiz();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {cats.map((c) => (
        <button key={c.id} onClick={() => onPick(c.id)} aria-pressed={value === c.id} className={cx("flex min-h-16 min-w-0 items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-base leading-tight font-bold", value === c.id ? "border-clay bg-clay/10 ring-4 ring-clay/15" : "border-sand bg-paper")}>
          <Icon name={c.icon} size={24} className="shrink-0 text-clay" /> <span className="min-w-0">{pick(c.label, lang)}</span>
        </button>
      ))}
    </div>
  );
}
