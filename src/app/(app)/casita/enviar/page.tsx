"use client";
import { useEffect, useMemo, useState } from "react";
import { Send, RefreshCw, ShieldAlert, ShieldCheck, CreditCard, Lightbulb, Check, ExternalLink, ArrowRight, Store, ChevronDown, Repeat as RepeatIcon } from "lucide-react";
import { Card, ListenButton, PageHeader, cx } from "@/components/ui";
import { useLang, useMe, useStore } from "@/lib/store";
import { money } from "@/lib/money";
import { speak } from "@/lib/voice";
import { playSaved } from "@/lib/sound";
import type { Lang } from "@/lib/i18n";

const L = (lang: Lang, es: string, en: string) => (lang === "en" ? en : es);

type Country = { id: string; flag: string; es: string; en: string; cur: "MXN" | "GTQ" | "HNL" | "USD"; unitEs: string; unitEn: string };
const COUNTRIES: Country[] = [
  { id: "mx", flag: "🇲🇽", es: "México", en: "Mexico", cur: "MXN", unitEs: "pesos", unitEn: "pesos" },
  { id: "gt", flag: "🇬🇹", es: "Guatemala", en: "Guatemala", cur: "GTQ", unitEs: "quetzales", unitEn: "quetzales" },
  { id: "hn", flag: "🇭🇳", es: "Honduras", en: "Honduras", cur: "HNL", unitEs: "lempiras", unitEn: "lempiras" },
  { id: "us", flag: "🇪🇨🇸🇻", es: "Ecuador o El Salvador", en: "Ecuador or El Salvador", cur: "USD", unitEs: "dólares", unitEn: "dollars" },
];

// Finabien Paisano app: $2.99 per transfer from $100 to $2,500 (Finabien, 2025–2026)
const FINABIEN_FEE = 2.99;
const FINABIEN_MAX = 2500;
const CASH_TAX = 0.01; // US tax on cash remittances since Jan 1, 2026

type RateInfo = { rates: { MXN: number; GTQ: number; HNL: number }; updated: string | null; approx: boolean };

const fmt = (n: number, lang: Lang, d = 0) =>
  new Intl.NumberFormat(lang === "en" ? "en-US" : "es-MX", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

export default function SendMoney() {
  const lang = useLang();
  const me = useMe()!;
  const addEntries = useStore((s) => s.addEntries);
  const updateEntry = useStore((s) => s.updateEntry);

  const [rate, setRate] = useState<RateInfo | null>(null);
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [mode, setMode] = useState<"send" | "receive">("send");
  const [amount, setAmount] = useState("200");
  const [quoteFee, setQuoteFee] = useState("");
  const [quoteRate, setQuoteRate] = useState("");
  const [cash, setCash] = useState(true);
  const [saved, setSaved] = useState<null | "once" | "month">(null);

  // Today's rate, refreshed every 5 minutes and whenever you come back to the page
  useEffect(() => {
    const load = () => fetch("/api/tipo-de-cambio", { cache: "no-store" }).then((r) => r.json()).then(setRate).catch(() => setRate((r) => r ?? { rates: { MXN: 18.5, GTQ: 7.7, HNL: 26 }, updated: null, approx: true }));
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    const onFocus = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onFocus); };
  }, []);
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(id); }, []);
  const updatedLabel = rate?.updated ? (() => {
    const mins = Math.max(0, Math.round((Date.now() - new Date(rate.updated!).getTime()) / 60000));
    return mins < 1 ? L(lang, "actualizado hace un momento", "updated just now") : L(lang, `actualizado hace ${mins} min`, `updated ${mins} min ago`);
  })() : null;

  const fx = country.cur === "USD" ? 1 : rate?.rates[country.cur] ?? 0;
  const unit = L(lang, country.unitEs, country.unitEn);
  const n = Number(amount) || 0;

  // How many dollars you hand over and how much arrives, with Finabien.
  const calc = useMemo(() => {
    if (!fx) return null;
    if (mode === "send") {
      const sendUsd = n;
      const arrives = Math.max(0, sendUsd - FINABIEN_FEE) * fx;
      return { sendUsd, arrives, total: sendUsd };
    }
    // they want `n` in local currency to arrive
    const usdNeeded = n / fx + FINABIEN_FEE;
    return { sendUsd: usdNeeded, arrives: n, total: usdNeeded };
  }, [n, fx, mode]);

  const overMax = calc ? calc.sendUsd > FINABIEN_MAX : false;
  const underMin = calc ? calc.sendUsd > 0 && calc.sendUsd < 100 : false;

  // Comparison with what a store or app offered
  const qFee = Number(quoteFee) || 0;
  const qRate = Number(quoteRate) || 0;
  const usdForQuote = calc?.sendUsd ?? 0;
  const quoteArrives = qRate ? Math.max(0, usdForQuote - qFee - (cash ? usdForQuote * CASH_TAX : 0)) * qRate : 0;
  const finabienArrives = calc ? Math.max(0, usdForQuote - FINABIEN_FEE) * fx : 0;
  const difference = finabienArrives - quoteArrives;

  const say = calc
    ? mode === "send"
      ? L(lang, `Si envías ${fmt(n, lang)} dólares con la Tarjeta Finabien, a tu familia le llegan más o menos ${fmt(calc.arrives, lang)} ${unit}.`, `If you send ${fmt(n, lang)} dollars with the Finabien card, your family gets about ${fmt(calc.arrives, lang)} ${unit}.`)
      : L(lang, `Para que lleguen ${fmt(n, lang)} ${unit}, envía más o menos ${fmt(calc.sendUsd, lang, 2)} dólares con la Tarjeta Finabien.`, `For ${fmt(n, lang)} ${unit} to arrive, send about ${fmt(calc.sendUsd, lang, 2)} dollars with the Finabien card.`)
    : L(lang, "Cargando el tipo de cambio de hoy.", "Loading today's exchange rate.");

  const saveAsExpense = (repeat: "once" | "month") => {
    if (!calc) return;
    const total = Math.round(calc.sendUsd * 100) / 100;
    const note = `${country.flag} ${L(lang, "a", "to")} ${L(lang, country.es, country.en)}`;
    const existing = repeat === "month" ? me.entries.find((e) => e.kind === "out" && e.category === "envio" && e.repeat !== "once") : undefined;
    if (existing) updateEntry(existing.id, { amount: total, repeat: "month", note });
    else addEntries([{ kind: "out", category: "envio", amount: total, repeat, note, date: new Date().toISOString(), source: "manual" }]);
    playSaved();
    setSaved(repeat);
    speak(repeat === "month" ? L(lang, "Listo. Lo anotamos como envío de cada mes.", "Done. We added it as a monthly transfer.") : L(lang, "Listo. Lo anotamos como gasto.", "Done. We added it as an expense."), lang);
  };

  // Two linked boxes: what you send (dollars) and what arrives (local money).
  const usdBox = mode === "send" ? amount : calc ? String(Math.round(calc.sendUsd * 100) / 100) : "";
  const localBox = mode === "receive" ? amount : calc ? fmt(Math.round(calc.arrives), lang) : "";
  const clean = (v: string) => v.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"); // also drops thousands commas

  return (
    <>
      <PageHeader
        title={L(lang, "Enviar dinero", "Send money")}
        sub={L(lang, `De Estados Unidos a ${country.es}: cuánto le llega a tu familia`, `From the United States to ${country.en}: how much your family gets`)}
        say={L(lang, "Enviar dinero de Estados Unidos a tu país. Toca a qué país envías, escribe cuántos dólares quieres enviar y te decimos cuánto le llega a tu familia. También puedes comparar otra oferta.", "Send money from the United States to your country. Tap the country, type how many dollars you want to send and we'll tell you how much your family gets. You can also compare another offer.")}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr] lg:gap-6">
        {/* ---------- The calculator ---------- */}
        <Card className="min-w-0 p-5 md:p-7">
          {/* where */}
          <p className="mb-2 flex flex-wrap items-center gap-2 text-lg font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1"><span className="text-xl leading-none">🇺🇸</span> {L(lang, "Desde Estados Unidos", "From the United States")}</span>
            <ArrowRight size={20} className="text-muted" /> {L(lang, "¿A qué país envías?", "Which country?")}
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={L(lang, "¿A dónde envías?", "Where are you sending?")}>
            {COUNTRIES.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={country.id === c.id}
                onClick={() => { setCountry(c); setMode("send"); setAmount(usdBox || "200"); setSaved(null); }}
                className={cx("inline-flex h-12 shrink-0 items-center gap-2 rounded-full border-2 px-4 font-bold whitespace-nowrap", country.id === c.id ? "border-ink bg-ink text-paper" : "border-sand bg-paper hover:border-sand-dark")}
              >
                <span className="text-xl leading-none">{c.flag}</span> {L(lang, c.es, c.en)}
              </button>
            ))}
          </div>

          {/* send → arrives */}
          <div className="mt-6 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <label className="block rounded-3xl border-2 border-sand bg-cream/60 p-4 focus-within:border-clay">
              <span className="block text-base font-bold text-muted">{L(lang, "Tú envías desde EE. UU.", "You send from the US")} 🇺🇸</span>
              <span className="mt-1 flex items-baseline gap-1">
                <span className="font-serif text-3xl text-muted">$</span>
                <input inputMode="decimal" value={usdBox} onFocus={(e) => e.currentTarget.select()} onChange={(e) => { setMode("send"); setAmount(clean(e.target.value)); setSaved(null); }}
                  className="w-full min-w-0 bg-transparent font-serif text-5xl font-semibold outline-none" aria-label={L(lang, "Dólares que envías", "Dollars you send")} />
              </span>
              <span className="text-base text-muted">{L(lang, "dólares", "dollars")}</span>
            </label>

            <span className="flex items-center justify-center text-muted" aria-hidden>
              <span className="flex h-11 w-11 rotate-90 items-center justify-center rounded-full bg-sand/60 sm:rotate-0"><ArrowRight size={22} /></span>
            </span>

            <label className="block rounded-3xl border-2 border-leaf/40 bg-leaf-soft/70 p-4 focus-within:border-leaf">
              <span className="block text-base font-bold text-leaf">{L(lang, `Le llega a tu familia en ${country.es}`, `Your family in ${country.en} gets`)} {country.flag.slice(0, 4)}</span>
              <span className="mt-1 flex items-baseline gap-1">
                {calc ? (
                  <input inputMode="decimal" value={localBox} onFocus={(e) => e.currentTarget.select()} onChange={(e) => { setMode("receive"); setAmount(clean(e.target.value)); setSaved(null); }}
                    className="w-full min-w-0 bg-transparent font-serif text-5xl font-semibold text-ink outline-none" aria-label={L(lang, `${unit} que llegan`, `${unit} that arrive`)} />
                ) : (
                  <RefreshCw size={28} className="my-3 animate-spin text-leaf" />
                )}
              </span>
              <span className="text-base text-muted">{unit} · {L(lang, "más o menos", "about")}</span>
            </label>
          </div>

          {/* quick amounts + details */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[100, 200, 300, 500].map((v) => (
              <button key={v} onClick={() => { setMode("send"); setAmount(String(v)); setSaved(null); }} className={cx("h-11 rounded-full border-2 px-4 font-bold", mode === "send" && Number(amount) === v ? "border-clay bg-clay text-paper" : "border-sand bg-paper hover:border-clay")}>
                ${v}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-sand pt-4">
            <p className="text-base text-muted">
              {L(lang, "Con Tarjeta Finabien", "With Finabien card")} · {L(lang, "comisión", "fee")} {money(FINABIEN_FEE, lang, true)}
              {country.cur !== "USD" && rate && <> · 1 {L(lang, "dólar", "dollar")} = {fmt(fx, lang, 2)} {unit}{rate.approx ? ` (${L(lang, "aprox.", "approx.")})` : ""}</>}
              {country.cur !== "USD" && updatedLabel && <span className="block text-sm"><RefreshCw size={12} className="mr-1 inline" />{L(lang, "Tipo de cambio del mercado", "Market rate")}, {updatedLabel}. {L(lang, "Cada servicio da el suyo.", "Each service sets its own.")}</span>}
            </p>
            <ListenButton compact text={say} />
          </div>
          {(overMax || underMin) && (
            <p className="mt-3 rounded-2xl bg-sun-soft px-4 py-3 text-base">
              {overMax
                ? L(lang, `Con Finabien el máximo es ${money(FINABIEN_MAX, lang)} por envío. Divídelo en dos envíos.`, `Finabien's limit is ${money(FINABIEN_MAX, lang)} per transfer. Split it in two.`)
                : L(lang, "La comisión de $2.99 es para envíos de $100 a $2,500. Pregunta el costo para envíos más chicos.", "The $2.99 fee is for $100 to $2,500. Ask about smaller amounts.")}
            </p>
          )}

          {/* save */}
          {calc && (
            <div className="mt-5 flex flex-wrap gap-2">
              {saved ? (
                <p className="flex items-center gap-2 rounded-2xl bg-leaf-soft px-4 py-3 font-bold text-leaf"><Check size={20} /> {saved === "month" ? L(lang, "Anotado como envío de cada mes", "Added as a monthly transfer") : L(lang, "Anotado como gasto", "Added as an expense")}</p>
              ) : (
                <>
                  <button onClick={() => saveAsExpense("once")} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-clay px-5 font-bold text-paper shadow-[0_3px_0_#8f3a20]"><Send size={18} /> {L(lang, "Anotar este envío", "Add this transfer")}</button>
                  <button onClick={() => saveAsExpense("month")} className="inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-sand bg-paper px-5 font-bold"><RepeatIcon size={18} /> {L(lang, "Lo envío cada mes", "I send it monthly")}</button>
                </>
              )}
            </div>
          )}
        </Card>

        {/* ---------- Recommended safe option ---------- */}
        <div className="min-w-0 rounded-3xl bg-ink p-5 text-paper md:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold tracking-wide text-sun uppercase">{L(lang, "Opción segura", "Safe option")}</p>
              <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold"><CreditCard size={24} /> {L(lang, "Tarjeta Finabien", "Finabien card")}</h2>
            </div>
            <ListenButton compact light text={L(lang, "La Tarjeta Finabien Paisano es del gobierno de México. Es gratis. La pides en cualquier consulado, sin cita, o en línea, con una identificación oficial, un celular y un correo. Cada envío de 100 a 2,500 dólares cuesta 2 dólares con 99 centavos y no paga el impuesto de 1%.", "The Finabien Paisano card is from the Mexican government. It's free. Get it at any consulate, without an appointment, or online, with an official ID, a cell phone and an email. Each transfer from 100 to 2,500 dollars costs 2.99 and doesn't pay the 1% tax.")} />
          </div>
          <p className="mt-2 text-paper/80">{L(lang, "Del gobierno de México, para mandar dinero con menos costo.", "From the Mexican government, to send money for less.")}</p>
          <ul className="mt-4 space-y-2.5">
            {[
              L(lang, "Gratis, en cualquier consulado o en línea", "Free, at any consulate or online"),
              L(lang, "Solo identificación, celular y correo", "Just an ID, a phone and an email"),
              L(lang, "$2.99 por envío", "$2.99 per transfer"),
              L(lang, "Sin el impuesto de 1%", "No 1% tax"),
            ].map((x) => <li key={x} className="flex items-center gap-2.5 text-lg"><Check size={20} className="shrink-0 text-sun" /> {x}</li>)}
          </ul>
          <a href="https://www.finabien.gob.mx" target="_blank" rel="noopener noreferrer" className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-paper font-bold text-ink"><ExternalLink size={18} /> finabien.gob.mx</a>
          <p className="mt-3 text-sm text-paper/60">{L(lang, "Datos de Finabien 2025–2026. Confírmalos en el Consulado.", "Finabien info 2025–2026. Confirm at the Consulate.")}</p>
        </div>
      </div>

      {/* ---------- Compare another offer, in plain sight ---------- */}
      {country.cur !== "USD" && calc && (
        <Card className="mt-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="flex items-center gap-2 text-2xl font-semibold"><Store size={26} className="text-clay" /> {L(lang, "¿Te ofrecieron otro precio? Compáralo", "Got another offer? Compare it")}</h2>
            <ListenButton compact text={L(lang, "Pregunta en la tienda o en la aplicación dos cosas: cuánto te cobran de comisión y cuántos pesos te dan por cada dólar. Escríbelos aquí y te decimos con cuál le llega más dinero a tu familia.", "Ask the store or app two things: the fee and how much local money you get per dollar. Type them here and we'll tell you which one gets more money to your family.")} />
          </div>
          <p className="mt-1 text-lg text-muted">{L(lang, `Pregunta dos cosas en la tienda o la aplicación y escríbelas aquí. Usamos los mismos ${money(calc.sendUsd, lang, true)} que pusiste arriba.`, `Ask two things at the store or app and type them here. We use the same ${money(calc.sendUsd, lang, true)} from above.`)}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-lg font-bold">1. {L(lang, "¿Cuánto te cobran de comisión?", "What's the fee?")}</span>
              <span className="flex items-center rounded-2xl border-2 border-sand bg-paper px-3 focus-within:border-clay">
                <span className="font-serif text-2xl text-muted">$</span>
                <input inputMode="decimal" value={quoteFee} onChange={(e) => setQuoteFee(clean(e.target.value))} placeholder="5.99" className="h-16 w-full min-w-0 bg-transparent px-2 text-2xl font-bold outline-none" />
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block text-lg font-bold">2. {L(lang, `¿Cuántos ${unit} te dan por 1 dólar?`, `How many ${unit} per 1 dollar?`)}</span>
              <input inputMode="decimal" value={quoteRate} onChange={(e) => setQuoteRate(clean(e.target.value))} placeholder={fx ? fmt(fx * 0.97, lang, 2) : ""} className="h-16 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-2xl font-bold outline-none focus:border-clay" />
            </label>
            <div>
              <span className="mb-1 block text-lg font-bold">3. {L(lang, "¿Pagas en efectivo?", "Paying in cash?")}</span>
              <div className="grid grid-cols-2 gap-2">
                {[true, false].map((v) => (
                  <button key={String(v)} onClick={() => setCash(v)} aria-pressed={cash === v} className={cx("h-16 rounded-2xl border-2 text-lg font-bold", cash === v ? "border-ink bg-ink text-paper" : "border-sand bg-paper")}>{v ? L(lang, "Sí", "Yes") : L(lang, "No, con tarjeta", "No, card")}</button>
                ))}
              </div>
              <span className="mt-1 block text-sm text-muted">{L(lang, "En efectivo se paga 1% de impuesto.", "Cash pays a 1% tax.")}</span>
            </div>
          </div>
          {qRate > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={cx("rounded-3xl border-2 p-4", difference < -0.5 ? "border-leaf bg-leaf-soft" : "border-sand bg-cream")}>
                <p className="text-base font-bold text-muted">{L(lang, "Con la otra oferta llegan", "With the other offer")}</p>
                <p className="font-serif text-4xl font-semibold">{fmt(quoteArrives, lang)} <span className="text-xl">{unit}</span></p>
                {difference < -0.5 && <p className="mt-1 font-extrabold text-leaf">✓ {L(lang, "Esta da más", "This gives more")}</p>}
              </div>
              <div className={cx("rounded-3xl border-2 p-4", difference > 0.5 ? "border-leaf bg-leaf-soft" : "border-sand bg-cream")}>
                <p className="text-base font-bold text-muted">{L(lang, "Con Finabien llegan", "With Finabien")}</p>
                <p className="font-serif text-4xl font-semibold">{fmt(finabienArrives, lang)} <span className="text-xl">{unit}</span></p>
                {difference > 0.5 && <p className="mt-1 font-extrabold text-leaf">✓ {L(lang, `Le llegan ${fmt(difference, lang)} ${unit} más`, `${fmt(difference, lang)} ${unit} more`)}</p>}
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-lg text-muted">{L(lang, "Escribe la comisión y el tipo de cambio para ver la comparación.", "Type the fee and rate to see the comparison.")}</p>
          )}
        </Card>
      )}

      {/* ---------- More help, folded so the page stays calm ---------- */}
      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Fold icon={<Lightbulb size={22} className="text-sun" />} title={L(lang, "Para que llegue más", "So more arrives")} sub={L(lang, "3 consejos", "3 tips")}>
          <ul className="space-y-2.5 text-lg">
            <li>• {L(lang, "Mira la comisión y el tipo de cambio: los dos importan.", "Check the fee and the rate: both matter.")}</li>
            <li>• {L(lang, "Envía desde tarjeta o cuenta: el efectivo paga 1% de impuesto.", "Send from a card or account: cash pays a 1% tax.")}</li>
            <li>• {L(lang, "Un envío grande cuesta menos que muchos chiquitos.", "One big transfer costs less than many small ones.")}</li>
          </ul>
        </Fold>

        <Fold icon={<ShieldAlert size={22} className="text-clay" />} title={L(lang, "Cuidado con fraudes", "Avoid scams")} sub={L(lang, "Lo que nunca hacer", "What never to do")}>
          <ul className="space-y-2.5 text-lg">
            {[
              L(lang, "No envíes a quien no conoces en persona", "Don't send to anyone you haven't met"),
              L(lang, "El gobierno nunca pide dinero por teléfono", "The government never asks for money by phone"),
              L(lang, "Nunca des tu clave ni tu número de tarjeta", "Never share your PIN or card number"),
              L(lang, "Pide siempre tu recibo", "Always get a receipt"),
            ].map((x) => <li key={x} className="flex items-start gap-2"><ShieldCheck size={20} className="mt-1 shrink-0 text-clay" /> {x}</li>)}
          </ul>
        </Fold>
      </div>
    </>
  );
}

/** A calm, folded section: title row you tap to open. */
function Fold({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="h-fit rounded-3xl border border-sand bg-paper">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-20 w-full items-center gap-3 px-5 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[1.05rem] leading-tight font-extrabold">{title}</span>
          <span className="block text-base text-muted">{sub}</span>
        </span>
        <ChevronDown size={24} className={cx("shrink-0 text-muted transition", open && "rotate-180")} />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
