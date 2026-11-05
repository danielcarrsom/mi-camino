"use client";
import { useEffect, useMemo, useState } from "react";
import { Send, RefreshCw, ShieldAlert, ShieldCheck, Building2, CreditCard, Lightbulb, Check, ExternalLink, ArrowDownUp, Store } from "lucide-react";
import { AmountInput, Card, ListenButton, PageHeader, QuickAmounts, cx } from "@/components/ui";
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
  const [saved, setSaved] = useState<null | "once" | "month">(null);

  useEffect(() => {
    fetch("/api/tipo-de-cambio").then((r) => r.json()).then(setRate).catch(() => setRate({ rates: { MXN: 18.5, GTQ: 7.7, HNL: 26 }, updated: null, approx: true }));
  }, []);

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
  const quoteArrives = qRate ? Math.max(0, usdForQuote - qFee - usdForQuote * CASH_TAX) * qRate : 0;
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

  return (
    <>
      <PageHeader
        title={L(lang, "Enviar dinero", "Send money")}
        sub={L(lang, "Cuánto le llega a tu familia, sin sorpresas", "How much your family gets, no surprises")}
        say={L(lang, "Enviar dinero. Escribe cuánto quieres enviar y te decimos cuánto le llega a tu familia. También te mostramos opciones seguras.", "Send money. Type how much you want to send and we'll tell you how much your family gets. We also show you safe options.")}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
        {/* ---------- Calculator ---------- */}
        <div className="min-w-0 space-y-5">
          <Card>
            <p className="mb-2 text-lg font-bold">{L(lang, "¿A dónde envías?", "Where are you sending?")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {COUNTRIES.map((c) => (
                <button key={c.id} onClick={() => setCountry(c)} className={cx("flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 px-2 text-center text-base font-bold", country.id === c.id ? "border-clay bg-clay text-paper" : "border-sand bg-paper")}>
                  <span className="text-2xl leading-none">{c.flag}</span>
                  <span className="mt-1 leading-tight">{L(lang, c.es, c.en)}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-lg font-bold">
                {mode === "send" ? L(lang, "¿Cuántos dólares vas a enviar?", "How many dollars will you send?") : L(lang, `¿Cuántos ${unit} quieres que lleguen?`, `How many ${unit} should arrive?`)}
              </p>
              {country.cur !== "USD" && (
                <button onClick={() => { setMode(mode === "send" ? "receive" : "send"); setAmount(mode === "send" ? String(Math.round((calc?.arrives ?? 0) / 100) * 100 || 3000) : "200"); }} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-sand/60 px-3 text-sm font-bold hover:bg-sun-soft">
                  <ArrowDownUp size={16} /> {mode === "send" ? L(lang, `Pensar en ${unit}`, `Think in ${unit}`) : L(lang, "Pensar en dólares", "Think in dollars")}
                </button>
              )}
            </div>
            <div className="mt-2">
              {mode === "send" ? (
                <AmountInput value={amount} onChange={setAmount} />
              ) : (
                <label className="flex items-center rounded-2xl border-2 border-sand bg-paper px-4 focus-within:border-clay">
                  <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} onFocus={(e) => e.currentTarget.select()} className="h-20 w-full min-w-0 bg-transparent px-2 font-serif text-5xl font-semibold outline-none" aria-label={unit} />
                  <span className="text-xl font-bold text-muted">{unit}</span>
                </label>
              )}
              <QuickAmounts amounts={mode === "send" ? [100, 200, 300, 500] : [2000, 3000, 5000, 10000]} onPick={(v) => setAmount(String(v))} />
            </div>
          </Card>

          {/* Result */}
          <Card dark className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-bold text-paper/75">
                {mode === "send" ? L(lang, "A tu familia le llegan más o menos", "Your family gets about") : L(lang, "Necesitas enviar más o menos", "You need to send about")}
              </p>
              <ListenButton compact light text={say} />
            </div>
            {calc ? (
              <p className="mt-1 font-serif text-[3.2rem] leading-none font-semibold md:text-[4rem]">
                {mode === "send" ? <>{fmt(calc.arrives, lang)} <span className="text-2xl text-paper/70">{unit}</span></> : <>{money(calc.sendUsd, lang, true)} <span className="text-2xl text-paper/70">{L(lang, "dólares", "dollars")}</span></>}
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-2 text-xl"><RefreshCw size={20} className="animate-spin" /> …</p>
            )}
            <p className="mt-4 text-base text-paper/75">
              {L(lang, "Con la Tarjeta Finabien: comisión de", "With the Finabien card: fee of")} {money(FINABIEN_FEE, lang, true)}
              {country.cur !== "USD" && rate && <> · {L(lang, "hoy 1 dólar ≈", "today 1 dollar ≈")} {fmt(fx, lang, 2)} {unit}</>}
            </p>
            {rate?.approx && <p className="mt-2 rounded-xl bg-paper/10 px-3 py-2 text-sm">{L(lang, "No pudimos traer el tipo de cambio de hoy; este número es aproximado.", "We couldn't load today's rate; this number is approximate.")}</p>}
            {overMax && <p className="mt-2 rounded-xl bg-sun px-3 py-2 text-sm font-bold text-ink">{L(lang, `Con Finabien puedes enviar hasta ${money(FINABIEN_MAX, lang)} por envío. Divídelo en dos envíos.`, `With Finabien you can send up to ${money(FINABIEN_MAX, lang)} per transfer. Split it into two.`)}</p>}
            {underMin && <p className="mt-2 rounded-xl bg-paper/10 px-3 py-2 text-sm">{L(lang, "La comisión de $2.99 aplica para envíos de $100 a $2,500. Pregunta el costo para envíos más chicos.", "The $2.99 fee applies to transfers from $100 to $2,500. Ask about smaller amounts.")}</p>}

            {calc && (
              <div className="mt-6 flex flex-wrap gap-2">
                {saved ? (
                  <p className="flex items-center gap-2 rounded-2xl bg-leaf px-4 py-3 font-bold"><Check size={20} /> {saved === "month" ? L(lang, "Anotado como envío de cada mes", "Added as a monthly transfer") : L(lang, "Anotado como gasto", "Added as an expense")}</p>
                ) : (
                  <>
                    <button onClick={() => saveAsExpense("once")} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-paper px-4 font-bold text-ink"><Send size={18} /> {L(lang, "Anotar este envío", "Add this transfer")}</button>
                    <button onClick={() => saveAsExpense("month")} className="inline-flex h-12 items-center gap-2 rounded-2xl px-4 font-bold text-paper/85 hover:bg-paper/10">{L(lang, "Lo envío cada mes", "I send this every month")}</button>
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Compare with a quote */}
          {country.cur !== "USD" && (
            <Card>
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-semibold"><Store size={24} className="text-clay" /> {L(lang, "Compara con lo que te ofrecen", "Compare with what you're offered")}</h2>
                <ListenButton compact text={L(lang, "Si una tienda o una app te ofrece enviar dinero, escribe la comisión y el tipo de cambio que te dan, y te decimos cuánto pierdes o ganas.", "If a store or app offers to send money, type the fee and the exchange rate they give you, and we'll tell you how much you lose or gain.")} />
              </div>
              <p className="mt-1 text-base text-muted">{L(lang, "Pregunta en la tienda o en la app y escribe lo que te dicen.", "Ask at the store or app and type what they tell you.")}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block font-bold">{L(lang, "Comisión (dólares)", "Fee (dollars)")}</span>
                  <input inputMode="decimal" value={quoteFee} onChange={(e) => setQuoteFee(e.target.value.replace(/[^\d.]/g, ""))} placeholder="5.99" className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-xl font-bold outline-none focus:border-clay" />
                </label>
                <label className="block">
                  <span className="mb-1 block font-bold">{L(lang, `1 dólar = ¿cuántos ${unit}?`, `1 dollar = how many ${unit}?`)}</span>
                  <input inputMode="decimal" value={quoteRate} onChange={(e) => setQuoteRate(e.target.value.replace(/[^\d.]/g, ""))} placeholder={fx ? fmt(fx * 0.97, lang, 2) : ""} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-xl font-bold outline-none focus:border-clay" />
                </label>
              </div>
              <p className="mt-2 text-sm text-muted">{L(lang, "Si pagas en efectivo, sumamos el impuesto de 1% que existe desde enero de 2026.", "If you pay cash, we add the 1% tax that exists since January 2026.")}</p>
              {qRate > 0 && calc && (
                <div className={cx("mt-4 rounded-2xl p-4 text-lg", difference > 0.5 ? "bg-sun-soft" : "bg-leaf-soft")}>
                  <p>{L(lang, "Con esa oferta llegan", "With that offer")} <b>{fmt(quoteArrives, lang)} {unit}</b>{lang === "en" ? " arrive" : ""}.</p>
                  <p className="mt-1">
                    {difference > 0.5
                      ? <>{L(lang, "Con Finabien llegarían", "With Finabien")} <b>{fmt(difference, lang)} {unit} {L(lang, "más", "more")}</b>{lang === "en" ? " would arrive" : ""}.</>
                      : L(lang, "Esa oferta es igual o mejor que Finabien hoy.", "That offer is as good as or better than Finabien today.")}
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ---------- Safe options & tips ---------- */}
        <div className="min-w-0 space-y-5">
          <div className="rounded-3xl border-2 border-leaf bg-leaf-soft/60 p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-2xl font-semibold"><CreditCard size={24} className="text-leaf" /> {L(lang, "Tarjeta Finabien Paisano", "Finabien Paisano card")}</h2>
              <ListenButton compact text={L(lang, "La Tarjeta Finabien Paisano es del gobierno de México. Es gratis. La pides en cualquier consulado, sin cita, o en línea. Necesitas una identificación oficial, un número de celular y un correo. Cada envío de 100 a 2,500 dólares cuesta 2 dólares con 99 centavos, y los envíos desde la tarjeta no pagan el impuesto de 1%.", "The Finabien Paisano card is from the Mexican government. It's free. You can get it at any consulate, without an appointment, or online. You need an official ID, a cell phone number and an email. Each transfer from 100 to 2,500 dollars costs 2.99, and transfers from the card don't pay the 1% tax.")} />
            </div>
            <p className="mt-2 text-lg">{L(lang, "Del gobierno de México, para mandar dinero a tu familia con menos costo.", "From the Mexican government, to send money home for less.")}</p>
            <ul className="mt-4 space-y-2 text-lg">
              {[
                L(lang, "La tarjeta es gratis", "The card is free"),
                L(lang, "La pides en cualquier consulado, sin cita, o en línea", "Get it at any consulate, no appointment, or online"),
                L(lang, "Necesitas identificación oficial, celular y correo", "You need an official ID, a cell phone and an email"),
                L(lang, "$2.99 por envío de $100 a $2,500", "$2.99 per transfer from $100 to $2,500"),
                L(lang, "Los envíos desde la tarjeta no pagan el impuesto de 1%", "Transfers from the card don't pay the 1% tax"),
              ].map((x) => <li key={x} className="flex items-start gap-2"><Check size={22} className="mt-0.5 shrink-0 text-leaf" /> {x}</li>)}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="https://www.finabien.gob.mx" target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-leaf px-4 font-bold text-paper"><ExternalLink size={18} /> finabien.gob.mx</a>
              <span className="inline-flex h-12 items-center gap-2 rounded-2xl bg-paper px-4 font-bold"><Building2 size={18} /> {L(lang, "Pregunta en el Consulado", "Ask at the Consulate")}</span>
            </div>
            <p className="mt-3 text-sm text-muted">{L(lang, "Datos de Finabien (2025–2026). Pueden cambiar: confírmalos en el Consulado.", "Finabien information (2025–2026). It can change: confirm at the Consulate.")}</p>
          </div>

          <Card>
            <h2 className="flex items-center gap-2 text-xl font-semibold"><Lightbulb size={22} className="text-sun" /> {L(lang, "Para que llegue más dinero", "So more money arrives")}</h2>
            <ul className="mt-3 space-y-3 text-lg">
              <li>{L(lang, "Fíjate en dos cosas: la comisión y el tipo de cambio. A veces la comisión es baja pero te dan menos pesos por dólar.", "Look at two things: the fee and the exchange rate. Sometimes the fee is low but you get fewer pesos per dollar.")}</li>
              <li>{L(lang, "Enviar desde una tarjeta o cuenta es más barato que en efectivo: el efectivo paga un impuesto de 1%.", "Sending from a card or account is cheaper than cash: cash pays a 1% tax.")}</li>
              <li>{L(lang, "Mejor un envío grande que muchos chiquitos: pagas menos comisiones.", "One big transfer is better than many small ones: you pay fewer fees.")}</li>
            </ul>
          </Card>

          <div className="rounded-3xl border-2 border-sun bg-sun-soft/60 p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldAlert size={22} className="text-clay" /> {L(lang, "Cuidado con los fraudes", "Watch out for scams")}</h2>
              <ListenButton compact text={L(lang, "Cuidado con los fraudes. Nunca envíes dinero a alguien que no conoces en persona. Nadie del gobierno te va a pedir dinero por teléfono. Nunca compartas tu clave ni los números de tu tarjeta. Pide siempre tu recibo con el número de envío.", "Watch out for scams. Never send money to someone you haven't met in person. No one from the government will ask you for money by phone. Never share your PIN or card numbers. Always ask for a receipt with the transfer number.")} />
            </div>
            <ul className="mt-3 space-y-2 text-lg">
              {[
                L(lang, "Nunca envíes dinero a alguien que no conoces en persona", "Never send money to someone you haven't met in person"),
                L(lang, "Nadie del gobierno te va a pedir dinero por teléfono", "No one from the government will ask for money by phone"),
                L(lang, "Nunca compartas tu clave ni los números de tu tarjeta", "Never share your PIN or card numbers"),
                L(lang, "Pide siempre tu recibo con el número de envío", "Always get a receipt with the transfer number"),
              ].map((x) => <li key={x} className="flex items-start gap-2"><ShieldCheck size={22} className="mt-0.5 shrink-0 text-clay" /> {x}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
