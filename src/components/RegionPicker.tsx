"use client";
// Where do you live? México or the United States, which state, and New York City.
// It decides the taxes on your pay and whether your money shows in dollars or pesos.
import { useState } from "react";
import { Check } from "lucide-react";
import { cx } from "./ui";
import type { Lang } from "@/lib/i18n";
import { STATES_FIRST, US_STATES } from "@/lib/taxes";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/RegionPicker";

export type RegionValue = { country?: "us" | "mx"; usState?: string; nyc?: boolean };

const sorted = Object.entries(US_STATES).sort((a, b) => a[1].name.localeCompare(b[1].name, "es"));

function Choice({ on, onClick, children, big }: { on: boolean; onClick: () => void; children: React.ReactNode; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cx(
        "flex items-center gap-3 rounded-2xl border-2 px-4 text-left font-bold transition",
        big ? "min-h-20 text-xl" : "min-h-14 text-lg",
        on ? "border-clay bg-clay/10 ring-4 ring-clay/15" : "border-sand bg-paper hover:border-sand-dark",
      )}
    >
      <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2", on ? "border-clay bg-clay text-paper" : "border-sand-dark")}>{on && <Check size={16} strokeWidth={3} />}</span>
      <span className="leading-tight">{children}</span>
    </button>
  );
}

export function RegionPicker({ value, onChange, lang }: { value: RegionValue; onChange: (v: RegionValue) => void; lang: Lang }) {
  const en = lang === "en";
  const [showAll, setShowAll] = useState(!!value.usState && !STATES_FIRST.includes(value.usState));
  const pickState = (s: string) => onChange({ ...value, country: "us", usState: s, nyc: s === "NY" ? value.nyc ?? undefined : false });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Choice big on={value.country === "us"} onClick={() => onChange({ country: "us", usState: value.usState, nyc: value.nyc })}>
          <span className="mr-1" aria-hidden>🇺🇸</span> {tx(en, TXT.vivoEnEstadosUnidos)}
        </Choice>
        <Choice big on={value.country === "mx"} onClick={() => onChange({ country: "mx" })}>
          <span className="mr-1" aria-hidden>🇲🇽</span> {tx(en, TXT.vivoEnMexico)}
        </Choice>
      </div>

      {value.country === "mx" && (
        <p className="rounded-2xl bg-leaf-soft px-4 py-3 text-lg">
          {tx(en, TXT.tuDineroSeVeraEn)}
        </p>
      )}

      {value.country === "us" && (
        <div>
          <p className="mb-3 text-xl font-bold">{tx(en, TXT.enQueEstado)}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATES_FIRST.map((s) => (
              <button key={s} type="button" onClick={() => pickState(s)} aria-pressed={value.usState === s}
                className={cx("min-h-14 rounded-2xl border-2 px-2 text-base font-bold leading-tight", value.usState === s ? "border-ink bg-ink text-paper" : "border-sand bg-paper")}>
                {US_STATES[s].name}
              </button>
            ))}
          </div>
          {!showAll ? (
            <button type="button" onClick={() => setShowAll(true)} className="mt-3 text-lg font-bold text-clay underline underline-offset-4">
              {tx(en, TXT.otroEstado)}
            </button>
          ) : (
            <label className="mt-3 block">
              <span className="mb-1 block text-base font-bold text-muted">{tx(en, TXT.todosLosEstados)}</span>
              <select
                value={value.usState ?? ""}
                onChange={(e) => e.target.value && pickState(e.target.value)}
                className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg font-bold outline-none focus:border-clay"
              >
                <option value="">{tx(en, TXT.eligeTuEstado)}</option>
                {sorted.map(([code, s]) => <option key={code} value={code}>{s.name}</option>)}
              </select>
            </label>
          )}
          {value.usState && !US_STATES[value.usState]?.s && (
            <p className="mt-3 rounded-2xl bg-leaf-soft px-4 py-3 text-base">
              {txf(en, TXT.noCobraImpuestoEstatalAl, [US_STATES[value.usState].name])}
            </p>
          )}
        </div>
      )}

      {value.country === "us" && value.usState === "NY" && (
        <div>
          <p className="mb-1 text-xl font-bold">{tx(en, TXT.vivesEnLaCiudadDe)}</p>
          <p className="mb-3 text-base text-muted">Manhattan, Bronx, Brooklyn, Queens {en ? "or" : "o"} Staten Island</p>
          <div className="grid grid-cols-2 gap-3">
            <Choice on={value.nyc === true} onClick={() => onChange({ ...value, nyc: true })}>{tx(en, TXT.si)}</Choice>
            <Choice on={value.nyc === false} onClick={() => onChange({ ...value, nyc: false })}>{tx(en, TXT.noOtraParteDeNy)}</Choice>
          </div>
        </div>
      )}
    </div>
  );
}

/** Ready when the country is chosen, a state too for the US, and the city question for New York. */
export function regionReady(v: RegionValue): boolean {
  if (v.country === "mx") return true;
  if (v.country !== "us" || !v.usState) return false;
  return v.usState !== "NY" || typeof v.nyc === "boolean";
}
