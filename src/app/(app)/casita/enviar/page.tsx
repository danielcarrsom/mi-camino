"use client";
import { useNow } from "@/lib/hooks";
import { useEffect, useMemo, useState } from "react";
import { Send, RefreshCw, ShieldAlert, ShieldCheck, CreditCard, Lightbulb, Check, ExternalLink, ArrowRight, Store, ChevronDown, Repeat as RepeatIcon } from "lucide-react";
import { Card, ListenButton, PageHeader, cx } from "@/components/ui";
import { useLang, useMe, useRegion, useStore } from "@/lib/store";
import { money } from "@/lib/money";
import { speak } from "@/lib/voice";
import { playSaved } from "@/lib/sound";
import type { Lang } from "@/lib/i18n";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/casita-enviar";

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
  // People who live in México use this to see what arrives when family sends money
  const receiving = useRegion().country === "mx";
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
  const now = useNow(30000);
  const updatedLabel = rate?.updated ? (() => {
    const mins = Math.max(0, Math.round((now - new Date(rate.updated!).getTime()) / 60000));
    return mins < 1 ? tx(lang, TXT.actualizadoHaceUnMomento) : txf(lang, TXT.actualizadoHaceMin, [mins]);
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
      ? txf(lang, TXT.siEnviasDolaresConLa, [fmt(n, lang), fmt(calc.arrives, lang), unit])
      : txf(lang, TXT.paraQueLleguenEnviaMas, [fmt(n, lang), unit, fmt(calc.sendUsd, lang, 2)])
    : tx(lang, TXT.cargandoElTipoDeCambio);

  const saveAsExpense = (repeat: "once" | "month") => {
    if (!calc) return;
    const total = Math.round(calc.sendUsd * 100) / 100;
    const note = `${country.flag} ${tx(lang, TXT.a)} ${L(lang, country.es, country.en)}`;
    const existing = repeat === "month" ? me.entries.find((e) => e.kind === "out" && e.category === "envio" && e.repeat !== "once") : undefined;
    if (existing) updateEntry(existing.id, { amount: total, repeat: "month", note });
    else addEntries([{ kind: "out", category: "envio", amount: total, repeat, note, date: new Date().toISOString(), source: "manual" }]);
    playSaved();
    setSaved(repeat);
    speak(repeat === "month" ? tx(lang, TXT.listoLoAnotamosComoEnvio) : tx(lang, TXT.listoLoAnotamosComoGasto), lang);
  };

  // Two linked boxes: what you send (dollars) and what arrives (local money).
  const usdBox = mode === "send" ? amount : calc ? String(Math.round(calc.sendUsd * 100) / 100) : "";
  const localBox = mode === "receive" ? amount : calc ? fmt(Math.round(calc.arrives), lang) : "";
  const clean = (v: string) => v.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"); // also drops thousands commas

  return (
    <>
      <PageHeader
        title={receiving ? tx(lang, TXT.dineroQueTeMandan) : tx(lang, TXT.enviarDinero)}
        sub={receiving
          ? txf(lang, TXT.deEstadosUnidosACuanto, [country.es, country.en])
          : txf(lang, TXT.deEstadosUnidosACuanto2, [country.es, country.en])}
        say={receiving
          ? tx(lang, TXT.siTuFamiliaTeManda)
          : tx(lang, TXT.enviarDineroDeEstadosUnidos)}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr] lg:gap-6">
        {/* ---------- The calculator ---------- */}
        <Card className="min-w-0 p-5 md:p-7" data-tour="enviar">
          {/* where */}
          <p className="mb-2 flex flex-wrap items-center gap-2 text-lg font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1"><span className="text-xl leading-none">🇺🇸</span> {tx(lang, TXT.desdeEstadosUnidos)}</span>
            <ArrowRight size={20} className="text-muted" /> {tx(lang, TXT.aQuePaisEnvias)}
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tx(lang, TXT.aDondeEnvias)}>
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
              <span className="block text-base font-bold text-muted">{tx(lang, TXT.tuEnviasDesdeEeUu)} 🇺🇸</span>
              <span className="mt-1 flex items-baseline gap-1">
                <span className="font-serif text-3xl text-muted">$</span>
                <input inputMode="decimal" value={usdBox} onFocus={(e) => e.currentTarget.select()} onChange={(e) => { setMode("send"); setAmount(clean(e.target.value)); setSaved(null); }}
                  className="w-full min-w-0 bg-transparent font-serif text-5xl font-semibold outline-none" aria-label={tx(lang, TXT.dolaresQueEnvias)} />
              </span>
              <span className="text-base text-muted">{tx(lang, TXT.dolares)}</span>
            </label>

            <span className="flex items-center justify-center text-muted" aria-hidden>
              <span className="flex h-11 w-11 rotate-90 items-center justify-center rounded-full bg-sand/60 sm:rotate-0"><ArrowRight size={22} /></span>
            </span>

            <label className="block rounded-3xl border-2 border-leaf/40 bg-leaf-soft/70 p-4 focus-within:border-leaf">
              <span className="block text-base font-bold text-leaf">{txf(lang, TXT.leLlegaATuFamilia, [country.es, country.en])} {country.flag.slice(0, 4)}</span>
              <span className="mt-1 flex items-baseline gap-1">
                {calc ? (
                  <input inputMode="decimal" value={localBox} onFocus={(e) => e.currentTarget.select()} onChange={(e) => { setMode("receive"); setAmount(clean(e.target.value)); setSaved(null); }}
                    className="w-full min-w-0 bg-transparent font-serif text-5xl font-semibold text-ink outline-none" aria-label={txf(lang, TXT.queLlegan, [unit])} />
                ) : (
                  <RefreshCw size={28} className="my-3 animate-spin text-leaf" />
                )}
              </span>
              <span className="text-base text-muted">{unit} · {tx(lang, TXT.masOMenos)}</span>
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
              {tx(lang, TXT.conTarjetaFinabien)} · {tx(lang, TXT.comision)} {money(FINABIEN_FEE, lang, true)}
              {country.cur !== "USD" && rate && <> · 1 {tx(lang, TXT.dolar)} = {fmt(fx, lang, 2)} {unit}{rate.approx ? ` (${tx(lang, TXT.aprox)})` : ""}</>}
              {country.cur !== "USD" && updatedLabel && <span className="block text-sm"><RefreshCw size={12} className="mr-1 inline" />{tx(lang, TXT.tipoDeCambioDelMercado)}, {updatedLabel}. {tx(lang, TXT.cadaServicioDaElSuyo)}</span>}
            </p>
            <ListenButton compact text={say} />
          </div>
          {(overMax || underMin) && (
            <p className="mt-3 rounded-2xl bg-sun-soft px-4 py-3 text-base">
              {overMax
                ? txf(lang, TXT.conFinabienElMaximoEs, [money(FINABIEN_MAX, lang)])
                : tx(lang, TXT.laComisionDe299)}
            </p>
          )}

          {/* save */}
          {calc && (
            <div className="mt-5 flex flex-wrap gap-2">
              {saved ? (
                <p className="flex items-center gap-2 rounded-2xl bg-leaf-soft px-4 py-3 font-bold text-leaf"><Check size={20} /> {saved === "month" ? tx(lang, TXT.anotadoComoEnvioDeCada) : tx(lang, TXT.anotadoComoGasto)}</p>
              ) : (
                <>
                  <button onClick={() => saveAsExpense("once")} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-clay px-5 font-bold text-paper shadow-[0_3px_0_#8f3a20]"><Send size={18} /> {tx(lang, TXT.anotarEsteEnvio)}</button>
                  <button onClick={() => saveAsExpense("month")} className="inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-sand bg-paper px-5 font-bold"><RepeatIcon size={18} /> {tx(lang, TXT.loEnvioCadaMes)}</button>
                </>
              )}
            </div>
          )}
        </Card>

        {/* ---------- Recommended safe option ---------- */}
        <div className="min-w-0 rounded-3xl bg-ink p-5 text-paper md:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold tracking-wide text-sun uppercase">{tx(lang, TXT.opcionSegura)}</p>
              <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold"><CreditCard size={24} /> {tx(lang, TXT.tarjetaFinabien)}</h2>
            </div>
            <ListenButton compact light text={tx(lang, TXT.laTarjetaFinabienPaisanoEs)} />
          </div>
          <p className="mt-2 text-paper/80">{tx(lang, TXT.delGobiernoDeMexicoPara)}</p>
          <ul className="mt-4 space-y-2.5">
            {[
              tx(lang, TXT.gratisEnCualquierConsuladoO),
              tx(lang, TXT.soloIdentificacionCelularYCorreo),
              tx(lang, TXT.t299PorEnvio),
              tx(lang, TXT.sinElImpuestoDe1),
            ].map((x) => <li key={x} className="flex items-center gap-2.5 text-lg"><Check size={20} className="shrink-0 text-sun" /> {x}</li>)}
          </ul>
          <a href="https://www.finabien.gob.mx" target="_blank" rel="noopener noreferrer" className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-paper font-bold text-ink"><ExternalLink size={18} /> finabien.gob.mx</a>
          <p className="mt-3 text-sm text-paper/60">{tx(lang, TXT.datosDeFinabien20252026)}</p>
        </div>
      </div>

      {/* ---------- Compare another offer, in plain sight ---------- */}
      {country.cur !== "USD" && calc && (
        <Card className="mt-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="flex items-center gap-2 text-2xl font-semibold"><Store size={26} className="text-clay" /> {tx(lang, TXT.teOfrecieronOtroPrecioComparalo)}</h2>
            <ListenButton compact text={tx(lang, TXT.preguntaEnLaTiendaO)} />
          </div>
          <p className="mt-1 text-lg text-muted">{txf(lang, TXT.preguntaDosCosasEnLa, [money(calc.sendUsd, lang, true)])}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-lg font-bold">1. {tx(lang, TXT.cuantoTeCobranDeComision)}</span>
              <span className="flex items-center rounded-2xl border-2 border-sand bg-paper px-3 focus-within:border-clay">
                <span className="font-serif text-2xl text-muted">$</span>
                <input inputMode="decimal" value={quoteFee} onChange={(e) => setQuoteFee(clean(e.target.value))} placeholder="5.99" className="h-16 w-full min-w-0 bg-transparent px-2 text-2xl font-bold outline-none" />
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block text-lg font-bold">2. {txf(lang, TXT.cuantosTeDanPor1, [unit])}</span>
              <input inputMode="decimal" value={quoteRate} onChange={(e) => setQuoteRate(clean(e.target.value))} placeholder={fx ? fmt(fx * 0.97, lang, 2) : ""} className="h-16 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-2xl font-bold outline-none focus:border-clay" />
            </label>
            <div>
              <span className="mb-1 block text-lg font-bold">3. {tx(lang, TXT.pagasEnEfectivo)}</span>
              <div className="grid grid-cols-2 gap-2">
                {[true, false].map((v) => (
                  <button key={String(v)} onClick={() => setCash(v)} aria-pressed={cash === v} className={cx("h-16 rounded-2xl border-2 text-lg font-bold", cash === v ? "border-ink bg-ink text-paper" : "border-sand bg-paper")}>{v ? tx(lang, TXT.si) : tx(lang, TXT.noConTarjeta)}</button>
                ))}
              </div>
              <span className="mt-1 block text-sm text-muted">{tx(lang, TXT.enEfectivoSePaga1)}</span>
            </div>
          </div>
          {qRate > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={cx("rounded-3xl border-2 p-4", difference < -0.5 ? "border-leaf bg-leaf-soft" : "border-sand bg-cream")}>
                <p className="text-base font-bold text-muted">{tx(lang, TXT.conLaOtraOfertaLlegan)}</p>
                <p className="font-serif text-4xl font-semibold">{fmt(quoteArrives, lang)} <span className="text-xl">{unit}</span></p>
                {difference < -0.5 && <p className="mt-1 font-extrabold text-leaf">✓ {tx(lang, TXT.estaDaMas)}</p>}
              </div>
              <div className={cx("rounded-3xl border-2 p-4", difference > 0.5 ? "border-leaf bg-leaf-soft" : "border-sand bg-cream")}>
                <p className="text-base font-bold text-muted">{tx(lang, TXT.conFinabienLlegan)}</p>
                <p className="font-serif text-4xl font-semibold">{fmt(finabienArrives, lang)} <span className="text-xl">{unit}</span></p>
                {difference > 0.5 && <p className="mt-1 font-extrabold text-leaf">✓ {txf(lang, TXT.leLleganMas, [fmt(difference, lang), unit])}</p>}
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-lg text-muted">{tx(lang, TXT.escribeLaComisionYEl)}</p>
          )}
        </Card>
      )}

      {/* ---------- More help, folded so the page stays calm ---------- */}
      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Fold icon={<Lightbulb size={22} className="text-sun" />} title={tx(lang, TXT.paraQueLlegueMas)} sub={tx(lang, TXT.t3Consejos)}>
          <ul className="space-y-2.5 text-lg">
            <li>• {tx(lang, TXT.miraLaComisionYEl)}</li>
            <li>• {tx(lang, TXT.enviaDesdeTarjetaOCuenta)}</li>
            <li>• {tx(lang, TXT.unEnvioGrandeCuestaMenos)}</li>
          </ul>
        </Fold>

        <Fold icon={<ShieldAlert size={22} className="text-clay" />} title={tx(lang, TXT.cuidadoConFraudes)} sub={tx(lang, TXT.loQueNuncaHacer)}>
          <ul className="space-y-2.5 text-lg">
            {[
              tx(lang, TXT.noEnviesAQuienNo),
              tx(lang, TXT.elGobiernoNuncaPideDinero),
              tx(lang, TXT.nuncaDesTuClaveNi),
              tx(lang, TXT.pideSiempreTuRecibo),
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
