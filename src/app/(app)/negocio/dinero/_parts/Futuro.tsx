"use client";
// Mi Negocio → Mi dinero → ¿Y si…?: what changes if you sell more, charge more or spend less.
import { useMemo, useState } from "react";
import { Telescope } from "lucide-react";
import { Button, Card, ListenButton, cx } from "@/components/ui";
import { useBiz } from "@/components/Biz";
import { goalSaved } from "@/lib/store";
import { money, localAmount, getCurrency } from "@/lib/money";
import { monthlyProfitDollars, productsMonthly, type DollarScenario } from "@/lib/business";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/negocio-dinero";
import { Choice } from "./shared";

// ---------- Looking ahead ----------
export const MORE = [-100, 0, 50, 100, 200, 400];

export const PRICE = [0, 0.25, 0.5, 1];

export const CUT = [0, 25, 50, 100];

export const PRICE_MXN = [0, 2, 5, 10];

export function Futuro() {
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
