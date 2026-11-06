"use client";
import { useState } from "react";
import { Hammer, Plus, Pencil, ArrowDownCircle, ArrowUpCircle, Repeat as RepeatIcon, PiggyBank, Users } from "lucide-react";
import { Button, Card, ListenButton, PageHeader, cx } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useT } from "@/lib/hooks";
import { planActive, tandaEnded, tandaPot, useLang, useMe, type Entry, type Work } from "@/lib/store";
import Link from "next/link";
import { EntryEditSheet, WorkEditSheet } from "@/components/MoneyForms";
import { BillsCard } from "@/components/Bills";
import { useSummary } from "@/lib/useSummary";
import { money, moneySpoken, shortDate, toMonthly } from "@/lib/money";
import { GROUPS, categoryById, incomeCategoryById, pick } from "@/lib/catalog";
import type { TKey } from "@/lib/i18n";

const REPEAT_KEY: Record<string, TKey> = { once: "once", week: "weekly", "2weeks": "biweekly", month: "monthly" };

export default function MoneyPage() {
  const t = useT();
  const lang = useLang();
  const me = useMe()!;
  const s = useSummary()!;
  const [view, setView] = useState<"month" | "week">("month");
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editWork, setEditWork] = useState<Work | null>(null);

  const fixedOut = me.entries.filter((e) => e.kind === "out" && e.repeat !== "once");
  const fixedIn = me.entries.filter((e) => e.kind === "in" && e.repeat !== "once");
  const onceOut = me.entries.filter((e) => e.kind === "out" && e.repeat === "once");
  const onceIn = me.entries.filter((e) => e.kind === "in" && e.repeat === "once");
  const fixedOutMonthly = fixedOut.reduce((a, e) => a + toMonthly(e.amount, e.repeat), 0);
  const activePlans = me.goals.filter(planActive);
  const activeTandas = (me.tandas ?? []).filter((tn) => !tandaEnded(tn));

  const earn = view === "month" ? s.monthIn : s.weekIn;
  const spend = view === "month" ? s.monthOut : s.weekOut;
  const save = view === "month" ? s.monthGoals : s.weekGoals;
  const keep = earn - spend - save;
  const factor = view === "month" ? 1 : 12 / 52;

  const groups = GROUPS.map((g) => ({ g, amount: (s.byGroup[g.id] ?? 0) * factor }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const maxGroup = Math.max(1, ...groups.map((x) => x.amount));

  const say = `${view === "month" ? t("perMonth") : t("perWeek")}: ${t("youEarn")} ${moneySpoken(earn, lang)}. ${t("youSpend")} ${moneySpoken(spend, lang)}. ${t("youSave")} ${moneySpoken(save, lang)}. ${t("youKeep")} ${moneySpoken(keep, lang)}.`;


  return (
    <>
      <PageHeader title={t("moneyTitle")} say={`${t("moneySay")} ${say}`} />

      <div className="mb-5 inline-grid grid-cols-2 gap-1 rounded-2xl bg-sand/50 p-1">
        {(["month", "week"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={cx("h-12 rounded-xl px-5 text-lg font-extrabold", view === v ? "bg-paper text-ink shadow-sm" : "text-ink/60")}>
            {v === "month" ? t("perMonth") : t("perWeek")}
          </button>
        ))}
      </div>

      {/* The plain-language balance sheet */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Big label={t("youEarn")} value={money(earn, lang)} tone="green" icon={<ArrowDownCircle size={24} />} />
        <Big label={t("youSpend")} value={money(spend, lang)} tone="clay" icon={<ArrowUpCircle size={24} />} />
        <Big label={t("youSave")} value={money(save, lang)} tone="sun" icon={<Icon name="house" size={24} />} />
        <Big label={t("youKeep")} value={money(keep, lang)} tone={keep < 0 ? "warn" : "ink"} icon={<Icon name="wallet" size={24} />} />
      </div>

      <div className="mt-4"><BillsCard keep={s.monthKeep} /></div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        {/* Work and pay */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("myWork")}</h2>
            <Button href="/casita/anotar?tipo=gane" variant="soft" className="min-h-12 px-4 text-base"><Plus size={20} /> {t("addWork")}</Button>
          </div>
          {me.work.length === 0 ? (
            <Card><p className="text-lg text-muted">{t("noIncomeYet")}</p></Card>
          ) : (
            <div className="space-y-3">
              {me.work.map((w) => {
                const weekly = w.every === "week" ? w.pay : w.every === "2weeks" ? w.pay / 2 : (w.pay * 12) / 52;
                return (
                  <Card key={w.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-leaf-soft text-leaf"><Hammer size={24} /></span>
                        <div>
                          <p className="text-lg font-extrabold">{w.name || t("incomeKindWork")}</p>
                          <p className="text-base text-muted">{money(w.pay, lang)} · {t(REPEAT_KEY[w.every])}</p>
                        </div>
                      </div>
                      <PencilButton onClick={() => setEditWork(w)} label={t("editEntry")} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Stat value={money(weekly / Math.max(1, w.hoursPerWeek), lang, true)} label={t("perHour")} />
                      <Stat value={money(weekly / Math.max(1, w.daysPerWeek), lang)} label={t("perDay")} />
                      <Stat value={String(w.hoursPerWeek)} label={t("hoursWeek")} />
                      <Stat value={String(w.daysPerWeek)} label={t("daysWeek")} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Where the money goes */}
        <section>
          <h2 className="mb-3 text-2xl font-semibold">{t("whereMoneyGoes")}</h2>
          <Card>
            {groups.length === 0 ? (
              <p className="text-lg text-muted">{t("noEntries")}</p>
            ) : (
              <ul className="space-y-4">
                {groups.map(({ g, amount }) => (
                  <li key={g.id}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-lg font-bold"><span style={{ color: g.color }}><Icon name={g.icon} size={22} /></span> {pick(g.label, lang)}</span>
                      <span className="font-serif text-xl font-semibold">{money(amount, lang)}</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-sand/70">
                      <div className="h-full rounded-full" style={{ width: `${(amount / maxGroup) * 100}%`, background: g.color }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>

      {/* Fixed expenses: added once, they repeat by themselves */}
      <section className="mt-6">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">{t("fixedExpenses")}</h2>
          <Button href="/casita/anotar?tipo=gaste" variant="soft" className="min-h-12 px-4 text-base"><Plus size={20} /> {t("addSpent")}</Button>
        </div>
        <p className="mb-3 flex items-center gap-2 text-base text-muted"><RepeatIcon size={18} className="shrink-0 text-leaf" /> {t("fixedHint")}</p>
        <EntryList items={fixedOut} onEdit={setEditEntry} total={fixedOutMonthly} empty={t("noEntries")} />
        {activeTandas.length > 0 && (
          <Card className="mt-3 p-2 md:p-2">
            <ul className="divide-y divide-sand">
              {activeTandas.map((tn) => (
                <li key={tn.id}>
                  <Link href="/casita/tanda" className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 hover:bg-cream">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand/70 text-clay"><Users size={22} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{t("myTanda")}: {tn.name}</span>
                      <span className="block text-sm text-muted">{t(REPEAT_KEY[tn.every])} · {lang === "en" ? "you receive" : "recibes"} {money(tandaPot(tn), lang)}</span>
                    </span>
                    <span className="font-serif text-xl font-semibold">−{money(tn.amount, lang)}</span>
                    <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand/60"><Pencil size={19} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {activePlans.length > 0 && (
          <Card className="mt-3 p-2 md:p-2">
            <ul className="divide-y divide-sand">
              {activePlans.map((g) => (
                <li key={g.id}>
                  <Link href={`/casita/metas/${g.id}`} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 hover:bg-cream">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sun-soft text-clay"><PiggyBank size={22} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{t("savingFor")} {g.name}</span>
                      <span className="block text-sm text-muted">{t(REPEAT_KEY[g.plan!.every])} · {lang === "en" ? "set apart automatically" : "se aparta solo"}</span>
                    </span>
                    <span className="font-serif text-xl font-semibold">−{money(g.plan!.amount, lang)}</span>
                    <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand/60"><Pencil size={19} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {fixedIn.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-2xl font-semibold">{t("fixedIncome")}</h2>
          <EntryList items={fixedIn} onEdit={setEditEntry} />
        </section>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <section>
          <h2 className="mb-3 text-2xl font-semibold">{t("oneTimeExpenses")}</h2>
          <EntryList items={onceOut} onEdit={setEditEntry} empty={t("noEntries")} />
        </section>
        {onceIn.length > 0 && (
          <section>
            <h2 className="mb-3 text-2xl font-semibold">{t("oneTimeIncome")}</h2>
            <EntryList items={onceIn} onEdit={setEditEntry} />
          </section>
        )}
      </div>

      <EntryEditSheet entry={editEntry} onClose={() => setEditEntry(null)} />
      <WorkEditSheet work={editWork} onClose={() => setEditWork(null)} />
    </>
  );
}

function Big({ label, value, tone, icon }: { label: string; value: string; tone: "green" | "clay" | "sun" | "ink" | "warn"; icon: React.ReactNode }) {
  const styles = {
    green: "bg-leaf text-paper",
    clay: "bg-clay text-paper",
    sun: "bg-sun text-ink",
    ink: "bg-ink text-paper",
    warn: "bg-sun-soft text-ink border-2 border-warn",
  }[tone];
  return (
    <div className={cx("rounded-3xl p-5", styles)}>
      <p className="flex items-center gap-2 text-lg font-bold opacity-90">{icon} {label}</p>
      <p className="mt-2 font-serif text-[2.4rem] leading-none font-semibold">{value}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-cream p-3 text-center">
      <p className="font-serif text-2xl font-semibold">{value}</p>
      <p className="text-sm font-bold text-muted">{label}</p>
    </div>
  );
}


function PencilButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand/60 text-ink hover:bg-sun-soft hover:text-clay">
      <Pencil size={19} />
    </button>
  );
}

/** A list of saved money, each row with a pencil to change it. */
function EntryList({ items, onEdit, total, empty }: { items: Entry[]; onEdit: (e: Entry) => void; total?: number; empty?: string }) {
  const t = useT();
  const lang = useLang();
  if (!items.length) return <Card><p className="text-lg text-muted">{empty ?? t("noEntries")}</p></Card>;
  return (
    <Card className="p-2 md:p-2">
      <ul className="divide-y divide-sand">
        {items.map((e) => {
          const c = e.kind === "in" ? incomeCategoryById(e.category) : categoryById(e.category);
          return (
            <li key={e.id}>
              <button onClick={() => onEdit(e)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-cream">
                <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", e.kind === "in" ? "bg-leaf-soft text-leaf" : "bg-sand/70 text-clay")}><Icon name={c.icon} size={22} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{pick(c.label, lang)}{e.note ? ` · ${e.note}` : ""}</span>
                  <span className="block text-sm text-muted">{e.repeat === "once" ? shortDate(e.date, lang) : t(REPEAT_KEY[e.repeat])}</span>
                </span>
                <span className={cx("font-serif text-xl font-semibold", e.kind === "in" && "text-leaf")}>{e.kind === "in" ? "+" : "−"}{money(e.amount, lang)}</span>
                <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand/60 text-ink"><Pencil size={19} /></span>
                <span className="sr-only">{t("editEntry")}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {total != null && (
        <div className="flex items-center justify-between border-t-2 border-sand px-3 pt-3 pb-2">
          <span className="text-lg font-extrabold">{lang === "en" ? "Total" : "En total"}</span>
          <span className="font-serif text-2xl font-semibold">{money(total, lang)} <span className="text-base text-muted">{t("perMonthShort")}</span></span>
        </div>
      )}
    </Card>
  );
}
