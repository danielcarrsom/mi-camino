"use client";
// Shared money forms: pay editor, category picker, and the sheets used to
// change something already saved (the little pencil).
import { useEffect, useState } from "react";
import { Hammer, Trash2, Check, Repeat as RepeatIcon } from "lucide-react";
import { AmountInput, Button, Sheet, Tile, cx } from "./ui";
import { Icon } from "./Icon";
import { useT } from "@/lib/hooks";
import { useLang, useStore, type Entry, type Work } from "@/lib/store";
import { money } from "@/lib/money";
import { CATEGORIES, GROUPS, INCOME_CATEGORIES, categoryById, incomeCategoryById, pick, type Repeat } from "@/lib/catalog";
import type { ParsedWork } from "@/lib/understand";
import { DEFAULT_TAX, cashSetAsideWeekly, weeklyTaxes, type TaxMode, type TaxPlace } from "@/lib/taxes";

type Kind = "in" | "out";

export const REPEATS: { id: Repeat; key: "once" | "weekly" | "biweekly" | "monthly" }[] = [
  { id: "once", key: "once" }, { id: "week", key: "weekly" }, { id: "2weeks", key: "biweekly" }, { id: "month", key: "monthly" },
];

/** What a job pays in one week, whether it's quoted per hour or per pay period. */
export function weeklyPay(w: ParsedWork): number {
  if (w.perHour) return w.pay * w.hoursPerWeek;
  return w.every === "week" ? w.pay : w.every === "2weeks" ? w.pay / 2 : (w.pay * 12) / 52;
}

/** Saved jobs always store pay per period, so an hourly rate becomes a weekly paycheck. */
export function toSavedWork(w: ParsedWork): ParsedWork {
  if (!w.perHour) return w;
  return { ...w, pay: Math.round(w.pay * w.hoursPerWeek * 100) / 100, every: "week", perHour: false };
}

export function WorkEditor({ work, onChange }: { work: ParsedWork; onChange: (w: ParsedWork) => void }) {
  const t = useT();
  const lang = useLang();
  const weekly = weeklyPay(work);
  const perHour = work.hoursPerWeek ? weekly / work.hoursPerWeek : 0;
  const perDay = work.daysPerWeek ? weekly / work.daysPerWeek : 0;
  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="mb-2 text-lg font-bold">{t("payEvery")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button onClick={() => onChange({ ...work, perHour: true, every: "week" })} className={cx("min-h-14 rounded-2xl border-2 px-2 text-base font-bold", work.perHour ? "border-leaf bg-leaf text-paper" : "border-sand bg-paper")}>
            {t("hourly")}
          </button>
          {REPEATS.slice(1).map((r) => (
            <button key={r.id} onClick={() => onChange({ ...work, perHour: false, every: r.id })} className={cx("min-h-14 rounded-2xl border-2 px-2 text-base font-bold", !work.perHour && work.every === r.id ? "border-leaf bg-leaf text-paper" : "border-sand bg-paper")}>
              {t(r.key)}
            </button>
          ))}
        </div>
      </div>
      <AmountInput label={work.perHour ? t("payPerHourQ") : t("payWhat")} value={String(work.pay)} onChange={(v) => onChange({ ...work, pay: Number(v) || 0 })} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stepper label={t("payHours")} value={work.hoursPerWeek} min={1} max={100} step={1} onChange={(v) => onChange({ ...work, hoursPerWeek: v })} />
        <Stepper label={t("payDays")} value={work.daysPerWeek} min={1} max={7} step={1} onChange={(v) => onChange({ ...work, daysPerWeek: v })} />
      </div>
      <TaxPicker work={work} onChange={onChange} />
      <TakeHome weekly={weekly} work={work} />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-leaf-soft p-4 text-center">
          <p className="font-serif text-3xl font-semibold text-leaf">{money(perHour, lang, true)}</p>
          <p className="text-base font-bold">{t("perHour")}</p>
        </div>
        <div className="rounded-2xl bg-leaf-soft p-4 text-center">
          <p className="font-serif text-3xl font-semibold text-leaf">{money(perDay, lang)}</p>
          <p className="text-base font-bold">{t("perDay")}</p>
        </div>
      </div>
      <input value={work.name} onChange={(e) => onChange({ ...work, name: e.target.value })} placeholder={t("workName")} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg outline-none focus:border-clay" />
    </div>
  );
}

export function Stepper({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="mb-2 text-lg font-bold">{label}</p>
      <div className="flex items-center justify-between rounded-2xl border-2 border-sand bg-paper p-1.5">
        <button onClick={() => onChange(Math.max(min, value - step))} className="h-12 w-12 rounded-xl bg-sand/70 text-2xl font-bold" aria-label="−">−</button>
        <span className="font-serif text-3xl font-semibold">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + step))} className="h-12 w-12 rounded-xl bg-sand/70 text-2xl font-bold" aria-label="+">+</button>
      </div>
    </div>
  );
}

export function CategorySheet({ open, kind, onClose, onPick }: { open: boolean; kind: Kind; onClose: () => void; onPick: (id: string) => void }) {
  const t = useT();
  const lang = useLang();
  return (
    <Sheet open={open} onClose={onClose} title={t("category")}>
      {kind === "in" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {INCOME_CATEGORIES.map((c) => (
            <Tile key={c.id} icon={<Icon name={c.icon} />} label={pick(c.label, lang)} color="#3e7d4f" onClick={() => onPick(c.id)} className="min-h-18" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {GROUPS.map((g) => (
            <div key={g.id}>
              <p className="mb-2 flex items-center gap-2 text-base font-extrabold tracking-wide text-muted uppercase"><Icon name={g.icon} size={18} /> {pick(g.label, lang)}</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.filter((c) => c.group === g.id).map((c) => (
                  <button key={c.id} onClick={() => onPick(c.id)} className="flex min-h-16 items-center gap-2 rounded-2xl border-2 border-sand bg-paper px-3 text-left font-bold hover:border-clay">
                    <Icon name={c.icon} size={22} className="shrink-0" /> <span className="leading-tight">{pick(c.label, lang)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}


/** Buttons for "once / every week / every 2 weeks / every month". */
export function RepeatPicker({ value, onChange }: { value: Repeat; onChange: (r: Repeat) => void }) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {REPEATS.map((r) => (
        <button key={r.id} onClick={() => onChange(r.id)} className={cx("min-h-14 rounded-2xl border-2 px-2 text-base font-bold", value === r.id ? "border-clay bg-clay text-paper" : "border-sand bg-paper")}>
          {t(r.key)}
        </button>
      ))}
    </div>
  );
}

/** Change or delete something already saved. */
export function EntryEditSheet({ entry, onClose }: { entry: Entry | null; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const updateEntry = useStore((s) => s.updateEntry);
  const removeEntry = useStore((s) => s.removeEntry);
  const [amount, setAmount] = useState("");
  const [repeat, setRepeat] = useState<Repeat>("once");
  const [category, setCategory] = useState("otro");
  const [note, setNote] = useState("");
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    if (!entry) return;
    setAmount(String(entry.amount)); setRepeat(entry.repeat); setCategory(entry.category); setNote(entry.note);
  }, [entry]);

  if (!entry) return null;
  const c = entry.kind === "in" ? incomeCategoryById(category) : categoryById(category);
  return (
    <>
      <Sheet open={!!entry && !catOpen} onClose={onClose} title={t("editEntry")}>
        <button onClick={() => setCatOpen(true)} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-sand bg-paper px-3 text-left hover:border-clay">
          <span className={cx("flex h-11 w-11 items-center justify-center rounded-xl", entry.kind === "in" ? "bg-leaf-soft text-leaf" : "bg-clay/10 text-clay")}><Icon name={c.icon} size={24} /></span>
          <span className="text-lg font-extrabold">{pick(c.label, lang)}</span>
          <span className="ml-auto pr-1 text-sm font-bold text-clay">{t("edit")}</span>
        </button>
        <div className="mt-4"><AmountInput value={amount} onChange={setAmount} /></div>
        <p className="mt-4 mb-2 text-lg font-bold">{t("howOften")}</p>
        <RepeatPicker value={repeat} onChange={setRepeat} />
        {repeat !== "once" && <p className="mt-3 flex items-center gap-2 text-base text-leaf"><RepeatIcon size={18} /> {t("repeatsAlone")}</p>}
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("note")} className="mt-4 h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg outline-none focus:border-clay" />
        <div className="mt-6 flex gap-3">
          <Button variant="soft" onClick={() => { if (window.confirm(lang === "en" ? "Delete this?" : "¿Borrar esto?")) { removeEntry(entry.id); onClose(); } }} className="flex-1 text-clay">
            <Trash2 size={20} /> {t("delete")}
          </Button>
          <Button onClick={() => { updateEntry(entry.id, { amount: Number(amount), repeat, category, note: note.trim() }); onClose(); }} disabled={!Number(amount)} className="flex-[2]">
            <Check size={22} /> {t("save")}
          </Button>
        </div>
      </Sheet>
      <CategorySheet open={catOpen} kind={entry.kind} onClose={() => setCatOpen(false)} onPick={(id) => { setCategory(id); setCatOpen(false); }} />
    </>
  );
}

/** Change or delete a saved job. */
/** Are taxes taken out of this pay? Where do you live? */
export function TaxPicker({ work, onChange }: { work: ParsedWork; onChange: (w: ParsedWork) => void }) {
  const lang = useLang();
  const en = lang === "en";
  const tax = work.tax ?? DEFAULT_TAX;
  const set = (p: Partial<typeof tax>) => onChange({ ...work, tax: { ...tax, ...p } });
  const modes: { id: TaxMode; title: string; sub: string }[] = [
    { id: "withheld", title: en ? "Yes, taxes are taken out" : "Sí, me descuentan impuestos", sub: en ? "Your paystub shows taxes" : "Tu talón de pago dice “taxes”" },
    { id: "cash", title: en ? "No, I'm paid in full or in cash" : "No, me pagan completo o en efectivo", sub: en ? "Nothing is taken out" : "No te quitan nada" },
    { id: "net", title: en ? "The amount I wrote is what I get" : "Lo que escribí ya es lo que me llega", sub: en ? "After taxes" : "Ya sin impuestos" },
  ];
  const places: { id: TaxPlace; label: string }[] = [
    { id: "nyc", label: en ? "New York City" : "Ciudad de Nueva York" },
    { id: "ny", label: en ? "Elsewhere in NY State" : "Otra parte del estado de NY" },
    { id: "other", label: en ? "Another state" : "Otro estado" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-lg font-bold">{en ? "Do they take taxes out of your pay?" : "¿Te descuentan impuestos de tu pago?"}</p>
      <div className="grid grid-cols-1 gap-2">
        {modes.map((m) => (
          <button key={m.id} onClick={() => set({ mode: m.id })} aria-pressed={tax.mode === m.id}
            className={cx("flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-2 text-left", tax.mode === m.id ? "border-leaf bg-leaf/10" : "border-sand bg-paper")}>
            <span className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", tax.mode === m.id ? "border-leaf bg-leaf text-paper" : "border-sand-dark")}>{tax.mode === m.id && <Check size={14} strokeWidth={3} />}</span>
            <span><span className="block text-lg font-bold leading-tight">{m.title}</span><span className="block text-base text-muted">{m.sub}</span></span>
          </button>
        ))}
      </div>
      {tax.mode !== "net" && (
        <>
          <p className="pt-1 text-lg font-bold">{en ? "Where do you live?" : "¿Dónde vives?"}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {places.map((p) => (
              <button key={p.id} onClick={() => set({ place: p.id })} aria-pressed={tax.place === p.id} className={cx("min-h-14 rounded-2xl border-2 px-3 text-base font-bold leading-tight", tax.place === p.id ? "border-ink bg-ink text-paper" : "border-sand bg-paper")}>{p.label}</button>
            ))}
          </div>
          <button onClick={() => set({ married: !tax.married })} aria-pressed={!!tax.married} className={cx("flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left text-base font-bold", tax.married ? "border-leaf bg-leaf/10" : "border-sand")}>
            <span className={cx("flex h-6 w-6 items-center justify-center rounded-md border-2", tax.married ? "border-leaf bg-leaf text-paper" : "border-sand-dark")}>{tax.married && <Check size={14} strokeWidth={3} />}</span>
            {en ? "I file taxes together with my spouse" : "Hago mis impuestos junto con mi esposo(a)"}
          </button>
        </>
      )}
    </div>
  );
}

/** Before taxes vs. what really reaches you, with the breakdown on demand. */
export function TakeHome({ weekly, work }: { weekly: number; work: ParsedWork }) {
  const lang = useLang();
  const en = lang === "en";
  const tax = work.tax ?? DEFAULT_TAX;
  const [open, setOpen] = useState(false);
  if (!(weekly > 0)) return null;
  if (tax.mode === "net") {
    return (
      <div className="rounded-2xl bg-leaf p-4 text-center text-paper">
        <p className="text-base font-bold">{en ? "What reaches you each week" : "Lo que te llega cada semana"}</p>
        <p className="font-serif text-4xl font-semibold">{money(weekly, lang)}</p>
      </div>
    );
  }
  if (tax.mode === "cash") {
    const aside = cashSetAsideWeekly(weekly, tax);
    return (
      <div className="space-y-2">
        <div className="rounded-2xl bg-leaf p-4 text-center text-paper">
          <p className="text-base font-bold">{en ? "You get each week" : "Te llega cada semana"}</p>
          <p className="font-serif text-4xl font-semibold">{money(weekly, lang)}</p>
        </div>
        <p className="rounded-2xl bg-sun-soft px-4 py-3 text-base">
          ⚠️ {en
            ? <>Nobody takes taxes out, but you may still owe them when you file. Setting aside about <b>{money(aside, lang)} a week</b> avoids a surprise. Free tax help: call 311.</>
            : <>Nadie te descuenta impuestos, pero puede que los debas al declarar. Apartar unos <b>{money(aside, lang)} a la semana</b> te evita una sorpresa. Ayuda gratis con impuestos: llama al 311.</>}
        </p>
      </div>
    );
  }
  const t = weeklyTaxes(weekly, tax);
  const rows: [string, number][] = [
    [en ? "Federal tax" : "Impuesto federal", t.federal],
    [en ? "Social Security" : "Seguro Social", t.socialSecurity],
    ["Medicare", t.medicare],
    ...(t.state > 0 ? [[en ? "New York State" : "Estado de Nueva York", t.state] as [string, number]] : []),
    ...(t.city > 0 ? [[en ? "New York City" : "Ciudad de Nueva York", t.city] as [string, number]] : []),
  ];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-cream p-3 text-center">
          <p className="text-base font-bold text-muted">{en ? "Before taxes" : "Antes de impuestos"}</p>
          <p className="font-serif text-2xl font-semibold text-muted line-through decoration-1">{money(weekly, lang)}</p>
        </div>
        <div className="rounded-2xl bg-leaf p-3 text-center text-paper">
          <p className="text-base font-bold">{en ? "Reaches you, approx." : "Te llega, aprox."}</p>
          <p className="font-serif text-3xl font-semibold">{money(t.net, lang)}</p>
        </div>
      </div>
      <p className="text-center text-base text-muted">{en ? "a week" : "a la semana"} · {en ? `about ${money(t.total, lang)} in taxes` : `unos ${money(t.total, lang)} de impuestos`}</p>
      <button onClick={() => setOpen(!open)} className="w-full text-center text-base font-bold text-clay underline underline-offset-4">{open ? (en ? "Hide" : "Ocultar") : (en ? "Where do those taxes go?" : "¿A dónde se van esos impuestos?")}</button>
      {open && (
        <div className="rounded-2xl border border-sand bg-paper p-4">
          <ul className="space-y-1.5 text-base">
            {rows.map(([k, v]) => <li key={k} className="flex justify-between gap-2"><span>{k}</span><b>−{money(v, lang, true)}</b></li>)}
          </ul>
          <p className="mt-3 text-sm text-muted">{en ? "Estimate with 2026 rates, one job, standard deduction. Your paystub has the exact amount: if it's different, choose “The amount I wrote is what I get” and type what reaches you." : "Cálculo aproximado con las tasas de 2026, un solo trabajo y deducción estándar. Tu talón de pago tiene la cantidad exacta: si es distinta, elige “Lo que escribí ya es lo que me llega” y escribe lo que te llega."}</p>
        </div>
      )}
    </div>
  );
}

export function WorkEditSheet({ work, onClose }: { work: Work | null; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const updateWork = useStore((s) => s.updateWork);
  const removeWork = useStore((s) => s.removeWork);
  const [draft, setDraft] = useState<ParsedWork | null>(null);
  useEffect(() => {
    if (work) setDraft({ name: work.name, pay: work.pay, every: work.every, hoursPerWeek: work.hoursPerWeek, daysPerWeek: work.daysPerWeek, perHour: false, tax: work.tax ?? DEFAULT_TAX });
  }, [work]);
  if (!work || !draft) return null;
  return (
    <Sheet open onClose={onClose} title={t("incomeKindWork")}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-leaf-soft text-leaf"><Hammer size={26} /></span>
        <p className="text-lg font-extrabold">{draft.name || t("myWork")}</p>
      </div>
      <WorkEditor work={draft} onChange={setDraft} />
      <div className="mt-6 flex gap-3">
        <Button variant="soft" onClick={() => { if (window.confirm(lang === "en" ? "Delete this job?" : "¿Borrar este trabajo?")) { removeWork(work.id); onClose(); } }} className="flex-1 text-clay">
          <Trash2 size={20} /> {t("delete")}
        </Button>
        <Button onClick={() => { const { perHour: _p, ...rest } = toSavedWork(draft); void _p; updateWork(work.id, rest); onClose(); }} disabled={!draft.pay} className="flex-[2]">
          <Check size={22} /> {t("save")}
        </Button>
      </div>
    </Sheet>
  );
}

