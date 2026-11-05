"use client";
// Pieces shared by the Mi Negocio pages.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Pencil, Trash2, Repeat as RepeatIcon, HandCoins } from "lucide-react";
import { AmountInput, Button, ListenButton, QuickAmounts, Sheet, cx } from "./ui";
import { Icon } from "./Icon";
import { useLang, useMe, useStore } from "@/lib/store";
import { money, shortDate } from "@/lib/money";
import { pick, type Repeat } from "@/lib/catalog";
import { BIZ_CATEGORIES, bizCategoryById, bizHealth, bizNumbers, type BizEntry, type Light, type Tip } from "@/lib/business";
import { playSaved } from "@/lib/sound";
import type { Lang } from "@/lib/i18n";

export const L = (lang: Lang, es: string, en: string) => (lang === "en" ? en : es);

export function useBiz() {
  const me = useMe();
  const lang = useLang();
  const biz = me?.business ?? null;
  const n = useMemo(() => bizNumbers(biz?.entries ?? []), [biz?.entries]);
  const health = useMemo(() => bizHealth(n, biz?.products ?? [], lang), [n, biz?.products, lang]);
  return { me, biz, n, health, lang };
}

const LIGHT_COLOR: Record<Exclude<Light, "gris">, string> = { rojo: "#d2452c", amarillo: "#e8b23a", verde: "#3e9a57" };

/** A real traffic light: the active lamp glows, the others stay dim. */
export function Semaforo({ light, size = 44, horizontal }: { light: Light; size?: number; horizontal?: boolean }) {
  const order: Exclude<Light, "gris">[] = ["rojo", "amarillo", "verde"];
  return (
    <span
      className={cx("inline-flex shrink-0 items-center gap-2 rounded-[1.4rem] bg-[#141c19] p-2.5", horizontal ? "flex-row" : "flex-col")}
      role="img"
      aria-label={light}
    >
      {order.map((c) => {
        const on = c === light;
        return (
          <span
            key={c}
            className="block rounded-full transition"
            style={{
              width: size, height: size,
              background: on ? LIGHT_COLOR[c] : LIGHT_COLOR[c] + "33",
              boxShadow: on ? `0 0 ${size / 2}px ${LIGHT_COLOR[c]}aa, inset 0 -4px 0 #0003` : "inset 0 -3px 0 #0004",
            }}
          />
        );
      })}
    </span>
  );
}

export function LightDot({ light }: { light: Light }) {
  const c = light === "gris" ? "#b9ad98" : LIGHT_COLOR[light];
  return <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 0 3px ${c}33` }} />;
}

export function repeatLabel(r: Repeat, lang: Lang) {
  return r === "week" ? L(lang, "cada semana", "weekly") : r === "2weeks" ? L(lang, "cada 2 semanas", "every 2 weeks") : r === "month" ? L(lang, "cada mes", "monthly") : "";
}

export function BizEntryRow({ e, onEdit }: { e: BizEntry; onEdit?: () => void }) {
  const lang = useLang();
  const c = bizCategoryById(e.category);
  const isIn = e.kind === "in";
  const mine = e.category === "mi_sueldo";
  return (
    <li className="flex min-w-0 items-center gap-3 py-3">
      <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl", isIn ? "bg-leaf/12 text-leaf" : mine ? "bg-sun-soft text-ink" : "bg-clay/10 text-clay")}>
        <Icon name={c.icon} size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block text-lg leading-tight font-bold break-words">{e.note && !mine ? e.note : pick(c.label, lang)}</span>
        <span className="block truncate text-base text-muted">
          {e.note && !mine ? pick(c.label, lang) + " · " : ""}
          {e.repeat !== "once" ? repeatLabel(e.repeat, lang) : shortDate(e.date, lang)}
        </span>
      </span>
      <span className={cx("shrink-0 text-lg font-extrabold", isIn ? "text-leaf" : "")}>
        {isIn ? "+" : "−"}{money(e.amount, lang)}
      </span>
      {onEdit && (
        <button onClick={onEdit} aria-label={L(lang, "Cambiar", "Edit")} className="-mr-2 flex h-11 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sand/60 hover:text-ink">
          <Pencil size={20} />
        </button>
      )}
    </li>
  );
}

/** The little pencil: change or delete something already saved. */
export function BizEntrySheet({ entry, onClose }: { entry: BizEntry | null; onClose: () => void }) {
  const lang = useLang();
  const update = useStore((s) => s.updateBizEntry);
  const remove = useStore((s) => s.removeBizEntry);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [cat, setCat] = useState("");
  const [repeat, setRepeat] = useState<Repeat>("once");
  useEffect(() => {
    if (!entry) return;
    setAmount(String(entry.amount)); setNote(entry.note); setCat(entry.category); setRepeat(entry.repeat);
  }, [entry]);
  if (!entry) return null;
  const cats = BIZ_CATEGORIES.filter((c) => c.kind === entry.kind && (!c.hidden || c.id === entry.category));
  return (
    <Sheet open={!!entry} onClose={onClose} title={L(lang, "Cambiar", "Edit")}>
      <div className="space-y-4">
        <AmountInput value={amount} onChange={setAmount} />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={L(lang, "Nota (opcional)", "Note (optional)")} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg outline-none focus:border-clay" />
        {entry.category !== "mi_sueldo" && (
          <>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <button key={c.id} onClick={() => setCat(c.id)} className={cx("inline-flex h-11 items-center gap-2 rounded-full border-2 px-3 text-base font-bold", cat === c.id ? "border-ink bg-ink text-paper" : "border-sand bg-paper")}>
                  <Icon name={c.icon} size={18} /> {pick(c.label, lang)}
                </button>
              ))}
            </div>
            <RepeatPicker value={repeat} onChange={setRepeat} kind={entry.kind} />
          </>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="green" onClick={() => { update(entry.id, { amount: Number(amount) || entry.amount, note, category: cat, repeat }); playSaved(); onClose(); }}>
            <Check size={22} /> {L(lang, "Guardar", "Save")}
          </Button>
          <Button variant="soft" onClick={() => { remove(entry.id); onClose(); }}>
            <Trash2 size={20} /> {L(lang, "Borrar", "Delete")}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

export function RepeatPicker({ value, onChange, kind }: { value: Repeat; onChange: (r: Repeat) => void; kind: "in" | "out" }) {
  const lang = useLang();
  const opts: { id: Repeat; label: string }[] = [
    { id: "once", label: kind === "in" ? L(lang, "Solo esta vez", "Just this once") : L(lang, "Solo esta vez", "Just this once") },
    { id: "week", label: L(lang, "Cada semana", "Every week") },
    { id: "month", label: L(lang, "Cada mes", "Every month") },
  ];
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-lg font-bold"><RepeatIcon size={20} /> {kind === "in" ? L(lang, "¿Se repite?", "Does it repeat?") : L(lang, "¿Es un gasto fijo?", "Is it a fixed cost?")}</p>
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => (
          <button key={o.id} onClick={() => onChange(o.id)} className={cx("min-h-14 rounded-2xl border-2 px-2 text-base leading-tight font-bold", value === o.id ? "border-leaf bg-leaf text-paper" : "border-sand bg-paper")}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Move money from the business to the home: an expense here, income in Mi Casita. */
export function PayMyselfSheet({ open, onClose, suggested }: { open: boolean; onClose: () => void; suggested: number }) {
  const lang = useLang();
  const payMyself = useStore((s) => s.payMyself);
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => { if (open) { setAmount(suggested > 0 ? String(Math.round(suggested)) : ""); setDone(false); } }, [open, suggested]);
  return (
    <Sheet open={open} onClose={onClose} title={L(lang, "Pagarme un sueldo", "Pay myself")}>
      {done ? (
        <div className="py-4 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-leaf text-paper"><Check size={44} /></span>
          <p className="mt-4 text-2xl font-semibold">{L(lang, "¡Listo! Ya está en Mi Casita.", "Done! It's in Mi Casita now.")}</p>
          <p className="mt-1 text-lg text-muted">{L(lang, "Lo verás como “Sueldo de mi negocio”.", "You'll see it as “Pay from my business”.")}</p>
          <Button onClick={onClose} variant="dark" className="mt-6 w-full">{L(lang, "Cerrar", "Close")}</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-lg">
            {L(lang, "Págate un sueldo fijo de tu negocio, como si fueras tu propio empleado. Este dinero pasa a Mi Casita.", "Pay yourself a set amount, as if you were your own employee. This money moves to Mi Casita.")}
          </p>
          {suggested > 0 && (
            <p className="rounded-2xl bg-sun-soft px-4 py-3 text-base">
              <HandCoins size={18} className="mr-1 inline" /> {L(lang, `Sugerencia: la mitad de lo que te quedó este mes, ${money(suggested, lang)}. Lo demás se queda para el negocio.`, `Suggestion: half of what you kept this month, ${money(suggested, lang)}. The rest stays in the business.`)}
            </p>
          )}
          <AmountInput value={amount} onChange={setAmount} autoFocus />
          <QuickAmounts amounts={[100, 200, 300, 500]} onPick={(n) => setAmount(String(n))} />
          <Button variant="green" className="w-full" disabled={!(Number(amount) > 0)} onClick={() => { payMyself(Number(amount)); playSaved(); setDone(true); }}>
            <Check size={22} /> {L(lang, "Pagarme", "Pay myself")} {Number(amount) > 0 ? money(Number(amount), lang) : ""}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: "in" | "out" | "big" }) {
  return (
    <div className={cx("min-w-0 rounded-2xl p-4", tone === "big" ? "bg-ink text-paper" : "bg-cream")}>
      <p className={cx("text-base font-bold", tone === "big" ? "text-paper/75" : "text-muted")}>{label}</p>
      <p className={cx("truncate font-serif text-3xl font-semibold", tone === "in" && "text-leaf", tone === "out" && "text-clay")}>{value}</p>
    </div>
  );
}

export function TipList({ tips, lang }: { tips: Tip[]; lang: Lang }) {
  const tone = { good: "bg-leaf/12 text-leaf", warn: "bg-sun-soft text-ink", bad: "bg-clay/12 text-clay", tip: "bg-cream text-clay" } as const;
  return (
    <ul className="divide-y divide-sand">
      {tips.map((t) => (
        <li key={t.id} className="flex min-w-0 items-start gap-3 py-3">
          <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", tone[t.tone])}><Icon name={t.icon} size={22} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-lg leading-snug">{t.text}</p>
            {t.action && (
              <Link href={t.action.href} className="mt-1 inline-flex items-center gap-1 text-base font-extrabold text-clay">
                {t.action.label} <ArrowRight size={18} />
              </Link>
            )}
          </div>
          <ListenButton text={t.text} compact />
        </li>
      ))}
    </ul>
  );
}

