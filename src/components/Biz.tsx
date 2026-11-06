"use client";
// Pieces shared by the Mi Negocio pages.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Pencil, Trash2, Repeat as RepeatIcon, HandCoins } from "lucide-react";
import { AmountInput, Button, ListenButton, QuickAmounts, Sheet, cx } from "./ui";
import { Icon } from "./Icon";
import { periodKey, regionOf, useLang, useMe, useStore } from "@/lib/store";
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
  // Money set apart for business goals in the last 30 days, and what's really free
  const goals30 = useMemo(() => {
    const since = Date.now() - 30 * 86400000;
    return (biz?.goals ?? []).flatMap((g) => g.deposits).filter((d) => new Date(d.date).getTime() >= since).reduce((a, d) => a + d.amount, 0);
  }, [biz?.goals]);
  const free = n.profit - n.paidMe - goals30;
  const region = regionOf(me?.profile);
  return { me, biz, n, health, lang, goals30, free, region };
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

/** Move money from the business to the home: an expense here, income in Mi Casita.
 *  It can repeat (weekly, every two weeks, monthly) and you confirm each time you pay yourself. */
export function PayMyselfSheet({ open, onClose, suggested }: { open: boolean; onClose: () => void; suggested: number }) {
  const lang = useLang();
  const { biz } = useBiz();
  const payMyself = useStore((s) => s.payMyself);
  const setMyPay = useStore((s) => s.setMyPay);
  const [amount, setAmount] = useState("");
  const [every, setEvery] = useState<"once" | "week" | "2weeks" | "month">("week");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!open) return;
    const p = biz?.pay;
    setAmount(p ? String(p.amount) : suggested > 0 ? String(Math.round(suggested / 4.33 / 5) * 5 || 5) : "");
    setEvery(p ? p.every : "week");
    setDone(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const per = { once: "", week: L(lang, "cada semana", "every week"), "2weeks": L(lang, "cada quincena", "every two weeks"), month: L(lang, "cada mes", "every month") }[every];
  return (
    <Sheet open={open} onClose={onClose} title={L(lang, "Mi sueldo del negocio", "My salary from the business")}>
      {done ? (
        <div className="py-4 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-leaf text-paper"><Check size={44} /></span>
          <p className="mt-4 text-2xl font-semibold">{L(lang, "¡Listo! Ya está en Mi Casita.", "Done! It's in Mi Casita now.")}</p>
          <p className="mt-1 text-lg text-muted">
            {every === "once" ? L(lang, "Lo verás como “Sueldo de mi negocio”.", "You'll see it as “Pay from my business”.") : L(lang, `Te recordaremos ${per}. Toca “Ya me pagué” cuando lo hagas.`, `We'll remind you ${per}. Tap “I paid myself” when you do.`)}
          </p>
          <Button onClick={onClose} variant="dark" className="mt-6 w-full">{L(lang, "Cerrar", "Close")}</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-lg">{L(lang, "Págate un sueldo fijo, como si fueras tu propio empleado. Este dinero pasa a Mi Casita.", "Pay yourself a fixed salary, as if you were your own employee. This money moves to Mi Casita.")}</p>
          {suggested > 0 && (
            <p className="rounded-2xl bg-sun-soft px-4 py-3 text-base">
              <HandCoins size={18} className="mr-1 inline" /> {L(lang, `Este mes a tu negocio le quedaron ${money(suggested * 2, lang)}. Págate cerca de la mitad y deja lo demás para surtir y para emergencias.`, `Your business kept ${money(suggested * 2, lang)} this month. Pay yourself about half and leave the rest for stock and emergencies.`)}
            </p>
          )}
          <div>
            <p className="mb-2 text-lg font-bold">{L(lang, "¿Cada cuándo te pagas?", "How often do you pay yourself?")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["week", "2weeks", "month", "once"] as const).map((e) => (
                <button key={e} onClick={() => setEvery(e)} aria-pressed={every === e} className={cx("min-h-14 rounded-2xl border-2 px-2 text-base leading-tight font-bold", every === e ? "border-leaf bg-leaf text-paper" : "border-sand bg-paper")}>
                  {{ week: L(lang, "Cada semana", "Weekly"), "2weeks": L(lang, "Cada quincena", "Every 2 weeks"), month: L(lang, "Cada mes", "Monthly"), once: L(lang, "Solo hoy", "Just today") }[e]}
                </button>
              ))}
            </div>
          </div>
          <AmountInput label={L(lang, "¿Cuánto?", "How much?")} value={amount} onChange={setAmount} />
          <QuickAmounts amounts={[100, 200, 300, 500]} onPick={(n) => setAmount(String(n))} />
          <Button variant="green" className="w-full" disabled={!(Number(amount) > 0)} onClick={() => {
            const n = Number(amount);
            if (every === "once") payMyself(n); else setMyPay({ amount: n, every }, true);
            playSaved(); setDone(true);
          }}>
            <Check size={22} /> {every === "once" ? L(lang, "Pagarme hoy", "Pay myself today") : L(lang, `Pagarme ${money(Number(amount) || 0, lang)} ${per}`, `Pay myself ${money(Number(amount) || 0, lang)} ${per}`)}
          </Button>
          {every !== "once" && <p className="text-center text-base text-muted">{L(lang, "Hoy queda pagado el primero.", "The first one is paid today.")}</p>}
          {biz?.pay && (
            <button onClick={() => { setMyPay(null); onClose(); }} className="w-full text-center text-base font-bold text-muted underline underline-offset-4">{L(lang, "Ya no quiero sueldo fijo", "Stop my fixed salary")}</button>
          )}
        </div>
      )}
    </Sheet>
  );
}

/** "It's payday": shows your fixed salary and a button to confirm you paid yourself. */
export function MyPayCard({ onEdit }: { onEdit: () => void }) {
  const { biz, lang } = useBiz();
  const confirm = useStore((s) => s.confirmMyPay);
  if (!biz?.pay) return null;
  const p = biz.pay;
  const paidNow = p.paid.includes(periodKey({ repeat: p.every, date: p.since }));
  const per = { week: L(lang, "esta semana", "this week"), "2weeks": L(lang, "esta quincena", "this pay period"), month: L(lang, "este mes", "this month") }[p.every];
  return (
    <div className={cx("rounded-2xl p-4", paidNow ? "bg-leaf-soft" : "bg-sun-soft")}>
      <div className="flex flex-wrap items-center gap-3">
        <HandCoins size={26} className={paidNow ? "text-leaf" : "text-clay"} />
        <p className="min-w-0 flex-1 text-lg">
          {paidNow
            ? <>{L(lang, "Ya te pagaste", "You paid yourself")} <b>{money(p.amount, lang)}</b> {per} ✓</>
            : <>{L(lang, "Te toca pagarte", "Time to pay yourself")} <b>{money(p.amount, lang)}</b> {per}</>}
        </p>
        <button onClick={onEdit} aria-label={L(lang, "Cambiar mi sueldo", "Change my salary")} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-paper/60"><Pencil size={18} /></button>
      </div>
      {!paidNow && (
        <Button variant="green" className="mt-3 w-full" onClick={() => { confirm(); playSaved(); }}><Check size={22} /> {L(lang, "Ya me pagué", "I paid myself")}</Button>
      )}
    </div>
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

