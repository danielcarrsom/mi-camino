"use client";
// Phone box with a big US / Mexico choice. Typing +52… or +1… picks the country by itself.
import { cx } from "./ui";
import { useLang } from "@/lib/store";
import { PHONE_COUNTRIES, detectCountry, type PhoneCountry } from "@/lib/phone";

export function PhoneInput({ value, onChange, country, onCountry, label }: {
  value: string; onChange: (v: string) => void; country: PhoneCountry; onCountry: (c: PhoneCountry) => void; label: string;
}) {
  const lang = useLang();
  const c = PHONE_COUNTRIES.find((x) => x.id === country)!;
  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={lang === "en" ? "Country of your number" : "País de tu número"}>
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
      <div className="flex items-center rounded-2xl border-2 border-sand bg-paper focus-within:border-clay">
        <span className="shrink-0 pl-4 font-serif text-2xl font-semibold text-muted">{c.code}</span>
        <input
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d\s()+-]/g, "");
            onChange(v);
            const d = detectCountry(v, country);
            if (d !== country) onCountry(d);
          }}
          inputMode="tel"
          autoComplete="tel"
          placeholder={c.placeholder}
          className="h-20 w-full min-w-0 bg-transparent px-3 text-center font-serif text-[2rem] font-semibold tracking-wide outline-none placeholder:text-sand-dark sm:text-4xl"
          aria-label={label}
        />
      </div>
    </div>
  );
}
