"use client";
// Shared money forms: pay editor, category picker, and the sheets used to
// change something already saved (the little pencil).
import { useState } from "react";
import Link from "next/link";
import { Hammer, Trash2, Check, MapPin, Repeat as RepeatIcon } from "lucide-react";
import { AmountInput, Button, Sheet, Tile, cx } from "./ui";
import { Icon } from "./Icon";
import { useResetOn, useT } from "@/lib/hooks";
import { useLang, useRegion, useStore, type Entry, type Work } from "@/lib/store";
import { money } from "@/lib/money";
import { CATEGORIES, GROUPS, INCOME_CATEGORIES, categoryById, incomeCategoryById, pick, type Repeat } from "@/lib/catalog";
import type { ParsedWork } from "@/lib/understand";
import { DEFAULT_TAX, cashSetAsideWeekly, regionLabel, taxHelp, weeklyTaxes, type TaxMode } from "@/lib/taxes";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/MoneyForms";

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
            <Tile key={c.id} icon={<Icon name={c.icon} />} label={pick(c.label, lang)} color="#316a42" onClick={() => onPick(c.id)} className="min-h-18" />
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

  useResetOn(entry, () => {
    if (!entry) return;
    setAmount(String(entry.amount)); setRepeat(entry.repeat); setCategory(entry.category); setNote(entry.note);
  });

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
          <Button variant="soft" onClick={() => { if (window.confirm(tx(lang, TXT.borrarEsto))) { removeEntry(entry.id); onClose(); } }} className="flex-1 text-clay">
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

/** Are taxes taken out of this pay? (Where you live is in Mi perfil.) */
export function TaxPicker({ work, onChange }: { work: ParsedWork; onChange: (w: ParsedWork) => void }) {
  const lang = useLang();
  const region = useRegion();
  const en = lang === "en";
  const mx = region.country === "mx";
  const tax = work.tax ?? DEFAULT_TAX;
  const set = (p: Partial<typeof tax>) => onChange({ ...work, tax: { ...tax, ...p } });
  const modes: { id: TaxMode; title: string; sub: string }[] = [
    { id: "withheld", title: tx(en, TXT.siMeDescuentanImpuestos), sub: mx ? (tx(en, TXT.teDanReciboDeNomina)) : tx(en, TXT.tuTalonDePagoDice) },
    { id: "cash", title: tx(en, TXT.noMePaganCompletoO), sub: mx ? (tx(en, TXT.oTrabajasPorTuCuenta)) : tx(en, TXT.noTeQuitanNada) },
    { id: "net", title: tx(en, TXT.loQueEscribiYaEs), sub: tx(en, TXT.yaSinImpuestos) },
  ];
  return (
    <div className="space-y-3">
      <p className="text-lg font-bold">{tx(en, TXT.teDescuentanImpuestosDeTu)}</p>
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
        <p className="flex items-center gap-2 rounded-2xl bg-cream px-4 py-3 text-base">
          <MapPin size={20} className="shrink-0 text-clay" />
          <span>
            {tx(en, TXT.impuestosDe)}<b>{regionLabel(region, lang)}</b>{region.married ? (tx(en, TXT.casadoA)) : ""}.{" "}
            <Link href="/perfil" className="font-bold text-clay underline underline-offset-4">{tx(en, TXT.cambiarEnMiPerfil)}</Link>
          </span>
        </p>
      )}
    </div>
  );
}

/** Before taxes vs. what really reaches you, with the breakdown on demand. */
export function TakeHome({ weekly, work }: { weekly: number; work: ParsedWork }) {
  const lang = useLang();
  const region = useRegion();
  const en = lang === "en";
  const tax = work.tax ?? DEFAULT_TAX;
  const [open, setOpen] = useState(false);
  if (!(weekly > 0)) return null;
  if (tax.mode === "net") {
    return (
      <div className="rounded-2xl bg-leaf p-4 text-center text-paper">
        <p className="text-base font-bold">{tx(en, TXT.loQueTeLlegaCada)}</p>
        <p className="font-serif text-4xl font-semibold">{money(weekly, lang)}</p>
      </div>
    );
  }
  if (tax.mode === "cash") {
    const aside = cashSetAsideWeekly(weekly, region);
    const mx = region.country === "mx";
    return (
      <div className="space-y-2">
        <div className="rounded-2xl bg-leaf p-4 text-center text-paper">
          <p className="text-base font-bold">{tx(en, TXT.teLlegaCadaSemana)}</p>
          <p className="font-serif text-4xl font-semibold">{money(weekly, lang)}</p>
        </div>
        <p className="rounded-2xl bg-sun-soft px-4 py-3 text-base">
          ⚠️ {mx
            ? (en
              ? <>If you work on your own and register with the SAT (RESICO), you pay 1% to 2.5% of what you charge: about <b>{money(aside, lang)} a week</b>. Being registered lets you give invoices and get IMSS. {taxHelp(region, lang)}</>
              : <>Si trabajas por tu cuenta y te das de alta en el SAT (RESICO), pagas del 1% al 2.5% de lo que cobras: unos <b>{money(aside, lang)} a la semana</b>. Estar dado de alta te deja dar facturas y tener IMSS. {taxHelp(region, lang)}</>)
            : (en
              ? <>Nobody takes taxes out, but you may still owe them when you file. Setting aside about <b>{money(aside, lang)} a week</b> avoids a surprise. {taxHelp(region, lang)}</>
              : <>Nadie te descuenta impuestos, pero puede que los debas al declarar. Apartar unos <b>{money(aside, lang)} a la semana</b> te evita una sorpresa. {taxHelp(region, lang)}</>)}
        </p>
      </div>
    );
  }
  const t = weeklyTaxes(weekly, region);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-cream p-3 text-center">
          <p className="text-base font-bold text-muted">{tx(en, TXT.antesDeImpuestos)}</p>
          <p className="font-serif text-2xl font-semibold text-muted line-through decoration-1">{money(weekly, lang)}</p>
        </div>
        <div className="rounded-2xl bg-leaf p-3 text-center text-paper">
          <p className="text-base font-bold">{tx(en, TXT.teLlegaAprox)}</p>
          <p className="font-serif text-3xl font-semibold">{money(t.net, lang)}</p>
        </div>
      </div>
      <p className="text-center text-base text-muted">{tx(en, TXT.aLaSemana)} · {t.total > 0.5 ? (txf(en, TXT.unosDeImpuestos, [money(t.total, lang)])) : (tx(en, TXT.sinDescuentos))}</p>
      {t.total <= 0.5 && region.country === "mx" && (
        <p className="rounded-2xl bg-leaf-soft px-4 py-3 text-base">{tx(en, TXT.siGanasElSalarioMinimo)}</p>
      )}
      {t.total > 0.5 && (
        <button onClick={() => setOpen(!open)} className="w-full text-center text-base font-bold text-clay underline underline-offset-4">{open ? (tx(en, TXT.ocultar)) : (tx(en, TXT.aDondeSeVanEsos))}</button>
      )}
      {open && t.total > 0.5 && (
        <div className="rounded-2xl border border-sand bg-paper p-4">
          <ul className="space-y-1.5 text-base">
            {t.parts.map((p) => <li key={p.id} className="flex justify-between gap-3"><span>{en ? p.en : p.es}</span><b className="shrink-0 whitespace-nowrap">−{money(p.amount, lang, true)}</b></li>)}
          </ul>
          <p className="mt-3 text-sm text-muted">{region.country === "mx"
            ? (tx(en, TXT.calculoAproximadoConLasTablas))
            : (tx(en, TXT.calculoAproximadoConLasTasas))}</p>
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
  useResetOn(work, () => {
    if (work) setDraft({ name: work.name, pay: work.pay, every: work.every, hoursPerWeek: work.hoursPerWeek, daysPerWeek: work.daysPerWeek, perHour: false, tax: work.tax ?? DEFAULT_TAX });
  });
  if (!work || !draft) return null;
  return (
    <Sheet open onClose={onClose} title={t("incomeKindWork")}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-leaf-soft text-leaf"><Hammer size={26} /></span>
        <p className="text-lg font-extrabold">{draft.name || t("myWork")}</p>
      </div>
      <WorkEditor work={draft} onChange={setDraft} />
      <div className="mt-6 flex gap-3">
        <Button variant="soft" onClick={() => { if (window.confirm(tx(lang, TXT.borrarEsteTrabajo))) { removeWork(work.id); onClose(); } }} className="flex-1 text-clay">
          <Trash2 size={20} /> {t("delete")}
        </Button>
        <Button onClick={() => { const { perHour: _p, ...rest } = toSavedWork(draft); void _p; updateWork(work.id, rest); onClose(); }} disabled={!draft.pay} className="flex-[2]">
          <Check size={22} /> {t("save")}
        </Button>
      </div>
    </Sheet>
  );
}

