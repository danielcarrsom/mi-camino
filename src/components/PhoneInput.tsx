"use client";
// Phone box with a big US / Mexico choice. Typing +52… or +1… picks the country by itself.
import { cx } from "./ui";
import { useLang } from "@/lib/store";
import { PHONE_COUNTRIES, detectCountry, formatPhoneKey, phoneKey, type PhoneCountry } from "@/lib/phone";
import { tx } from "@/lib/i18n";
import TXT from "@/messages/PhoneInput";

export function PhoneInput({ value, onChange, country, onCountry, label }: {
  value: string; onChange: (v: string) => void; country: PhoneCountry | null; onCountry: (c: PhoneCountry) => void; label: string;
}) {
  const lang = useLang();
  const c = PHONE_COUNTRIES.find((x) => x.id === country);
  const key = country ? phoneKey(value, country) : null;
  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={tx(lang, TXT.paisDeTuNumero)}>
        {PHONE_COUNTRIES.map((x) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={country === x.id}
            onClick={() => onCountry(x.id)}
            className={cx("flex min-h-16 min-w-0 items-center justify-center gap-2 rounded-2xl border-2 px-2 text-base leading-tight font-extrabold", country === x.id ? "border-clay bg-clay/10 ring-4 ring-clay/15" : "border-sand bg-paper")}
          >
            <span className="text-2xl" aria-hidden>{x.flag}</span>
            <span className="min-w-0 text-left">{lang === "en" ? x.en : x.es}<span className="block text-sm font-bold text-muted">{x.code}</span></span>
          </button>
        ))}
      </div>
      {!c && <p className="mb-3 rounded-2xl bg-sun-soft px-4 py-3 text-lg font-bold">{tx(lang, TXT.primeroTocaDeQuePais)}</p>}
      <div className={cx("flex items-center rounded-2xl border-2 border-sand bg-paper focus-within:border-clay", !c && "opacity-50")}>
        {c && <span className="shrink-0 pl-4 font-serif text-2xl font-semibold text-muted">{c.code}</span>}
        <input
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d\s()+-]/g, "");
            onChange(v);
            if (!country) return;
            const d = detectCountry(v, country);
            if (d !== country) onCountry(d);
          }}
          inputMode="tel"
          autoComplete="tel"
          disabled={!c}
          placeholder={c?.placeholder ?? ""}
          className="h-20 w-full min-w-0 bg-transparent px-3 text-center font-serif text-[2rem] font-semibold tracking-wide outline-none placeholder:text-sand-dark sm:text-4xl"
          aria-label={label}
        />
      </div>
      {key && c && (
        <p className="mt-3 text-center text-lg">
          {tx(lang, TXT.tuNumero)} <b className="whitespace-nowrap">{key.startsWith("52") && key.length === 12 ? formatPhoneKey(key) : `+1 ${formatPhoneKey(key)}`}</b> {c.flag}
        </p>
      )}
    </div>
  );
}
