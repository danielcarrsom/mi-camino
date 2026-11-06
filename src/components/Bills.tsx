"use client";
// Fixed payments (rent, light, phone…) with a big "I paid it" button, so the
// person sees what's paid and what's still left this month.
import Link from "next/link";
import { Check, RotateCcw, CalendarCheck } from "lucide-react";
import { Card, ListenButton, cx } from "./ui";
import { Icon } from "./Icon";
import { isPaidNow, useLang, useMe, useStore, type Entry } from "@/lib/store";
import { money, moneySpoken } from "@/lib/money";
import { categoryById, pick } from "@/lib/catalog";
import { playSaved } from "@/lib/sound";

const when = (e: Entry, en: boolean) =>
  e.repeat === "month" ? (en ? "this month" : "este mes") : e.repeat === "2weeks" ? (en ? "this pay period" : "esta quincena") : (en ? "this week" : "esta semana");

export function BillsCard({ compact, keep }: { compact?: boolean; keep?: number }) {
  const lang = useLang();
  const en = lang === "en";
  const me = useMe();
  const togglePaid = useStore((s) => s.togglePaid);
  if (!me) return null;
  const bills = me.entries.filter((e) => e.kind === "out" && e.repeat !== "once");
  if (!bills.length) {
    return compact ? null : (
      <Card>
        <p className="text-xl font-semibold">{en ? "Your fixed payments" : "Tus pagos fijos"}</p>
        <p className="mt-2 text-lg text-muted">{en ? "Add your rent, light or phone once and we'll remind you each month." : "Anota una vez tu renta, luz o teléfono y aquí te los recordamos cada mes."}</p>
        <Link href="/casita/anotar?tipo=gaste" className="mt-3 inline-flex h-12 items-center rounded-2xl bg-clay px-5 font-bold text-paper">{en ? "Add a payment" : "Anotar un pago"}</Link>
      </Card>
    );
  }
  const paid = bills.filter(isPaidNow);
  const pending = bills.filter((e) => !isPaidNow(e));
  const total = bills.reduce((a, e) => a + e.amount, 0);
  const paidTotal = paid.reduce((a, e) => a + e.amount, 0);
  const left = total - paidTotal;
  const list = compact ? pending : [...pending, ...paid];
  if (compact && !pending.length) return null;

  const say = en
    ? `You've paid ${moneySpoken(paidTotal, lang)} of ${moneySpoken(total, lang)}. ${left > 0 ? `${moneySpoken(left, lang)} left to pay: ${pending.map((e) => pick(categoryById(e.category).label, lang)).join(", ")}.` : "Everything is paid."}`
    : `Has pagado ${moneySpoken(paidTotal, lang)} de ${moneySpoken(total, lang)}. ${left > 0 ? `Te falta pagar ${moneySpoken(left, lang)}: ${pending.map((e) => pick(categoryById(e.category).label, lang)).join(", ")}.` : "Ya pagaste todo."}`;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold"><CalendarCheck size={24} className="text-clay" /> {compact ? (en ? "Still to pay" : "Te falta pagar") : (en ? "Your payments this month" : "Tus pagos de este mes")}</h2>
          {!compact && <p className="text-base text-muted">{en ? "Tap “I paid it” when you pay each one." : "Toca “Ya lo pagué” cuando pagues cada uno."}</p>}
        </div>
        <ListenButton compact text={say} />
      </div>

      {!compact && (
        <>
          <div className="mt-4 h-5 overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${total ? (paidTotal / total) * 100 : 0}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-leaf-soft p-3">
              <p className="text-base font-bold text-leaf">{en ? "Already paid" : "Ya pagaste"}</p>
              <p className="font-serif text-3xl font-semibold">{money(paidTotal, lang)}</p>
            </div>
            <div className={cx("rounded-2xl p-3", left > 0 ? "bg-sun-soft" : "bg-leaf-soft")}>
              <p className="text-base font-bold">{en ? "Still to pay" : "Te falta pagar"}</p>
              <p className="font-serif text-3xl font-semibold">{money(left, lang)}</p>
            </div>
          </div>
          {keep != null && (
            <p className={cx("mt-3 rounded-2xl px-4 py-3 text-lg", keep < 0 ? "bg-sun-soft" : "bg-cream")}>
              {keep >= 0
                ? (en ? <>After all your payments and savings, you have <b>{money(keep, lang)}</b> left this month to live on.</> : <>Después de todos tus pagos y ahorros, te quedan <b>{money(keep, lang)}</b> este mes para vivir.</>)
                : (en ? <>You spend <b>{money(-keep, lang)}</b> more than you earn this month. Look at your biggest expense below.</> : <>Este mes gastas <b>{money(-keep, lang)}</b> más de lo que ganas. Mira abajo tu gasto más grande.</>)}
            </p>
          )}
        </>
      )}

      <ul className="mt-3 divide-y divide-sand">
        {list.map((e) => {
          const c = categoryById(e.category);
          const done = isPaidNow(e);
          return (
            <li key={e.id} className="flex min-w-0 flex-wrap items-center gap-3 py-3">
              <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", done ? "bg-leaf text-paper" : "bg-sand/70 text-clay")}>
                {done ? <Check size={22} /> : <Icon name={c.icon} size={22} />}
              </span>
              <span className="min-w-[8rem] flex-1">
                <span className={cx("block text-lg font-bold", done && "text-muted line-through")}>{pick(c.label, lang)}{e.note ? ` · ${e.note}` : ""}</span>
                <span className="block text-base text-muted">{money(e.amount, lang)} · {when(e, en)}</span>
              </span>
              {done ? (
                <button onClick={() => togglePaid(e.id)} className="ml-auto inline-flex h-12 items-center gap-1.5 rounded-2xl px-3 text-base font-bold text-muted hover:bg-sand/60">
                  <RotateCcw size={16} /> {en ? "Undo" : "Deshacer"}
                </button>
              ) : (
                <button onClick={() => { togglePaid(e.id); playSaved(); }} className="ml-auto inline-flex h-12 items-center gap-2 rounded-2xl bg-leaf px-4 text-base font-extrabold text-paper shadow-[0_3px_0_#2d5c3a] active:translate-y-0.5">
                  <Check size={20} /> {en ? "I paid it" : "Ya lo pagué"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
