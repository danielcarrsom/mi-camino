"use client";
import { BillsCard } from "@/components/Bills";
import { FirstSteps } from "@/components/FirstSteps";
import Link from "next/link";
import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, PiggyBank, Plus, ChevronRight, Pencil, Users } from "lucide-react";
import { EntryEditSheet } from "@/components/MoneyForms";
import { Button, Card, ListenButton, PageHeader, Tile } from "@/components/ui";
import { GoalVisual } from "@/components/GoalVisual";
import { Icon } from "@/components/Icon";
import { useT } from "@/lib/hooks";
import { goalSaved, tandaEnded, tandaPayoutDate, tandaPot, useLang, useMe, type Entry } from "@/lib/store";
import { useSummary } from "@/lib/useSummary";
import { money, moneySpoken, shortDate } from "@/lib/money";
import { categoryById, goalPresetById, incomeCategoryById, pick } from "@/lib/catalog";

export default function CasitaHome() {
  const t = useT();
  const lang = useLang();
  const me = useMe()!;
  const s = useSummary()!;
  const hasIncome = s.weekIn > 0;
  const over = s.weekLeft < 0;

  const weekSay = hasIncome
    ? over
      ? `${t("overThisWeek")}: ${moneySpoken(-s.weekLeft, lang)}.`
      : `${t("leftThisWeekSay")} ${moneySpoken(s.weekLeft, lang)}. ${lang === "en" ? "After taxes you take home" : "Después de impuestos te llegan"} ${moneySpoken(s.weekIn, lang)}, ${t("youSpend").toLowerCase()} ${moneySpoken(s.weekOut, lang)}.`
    : t("noIncomeYet");

  // Everything recorded lately: spending, income and money set apart for goals.
  type Row = { kind: "entry"; date: string; entry: Entry } | { kind: "goal"; date: string; goalId: string; goalName: string; amount: number; auto: boolean; fromTanda: boolean; id: string };
  const recent: Row[] = [
    ...me.entries.map((e) => ({ kind: "entry" as const, date: e.date, entry: e })),
    ...me.goals.flatMap((g) => g.deposits.map((d) => ({ kind: "goal" as const, date: d.date, goalId: g.id, goalName: g.name, amount: d.amount, auto: !!d.auto, fromTanda: d.from === "tanda", id: d.id }))),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const [editing, setEditing] = useState<Entry | null>(null);
  const tandas = (me.tandas ?? []).filter((tn) => !tandaEnded(tn));

  return (
    <>
      <PageHeader title={`${t("hello")}, ${me.profile.name}`} sub={t("casitaWhat")} say={`${t("hello")}, ${me.profile.name}. ${weekSay}`} />
      <FirstSteps where="casita" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr] lg:gap-6">
        <div className="min-w-0 space-y-5">
          {/* The one number that matters this week */}
          <Card dark className="relative overflow-hidden p-6 md:p-8" data-tour="resumen">
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-bold text-paper/75">{hasIncome && over ? t("overThisWeek") : t("leftThisWeek")}</p>
              <ListenButton text={weekSay} compact light />
            </div>
            {hasIncome ? (
              <>
                <p className={`mt-1 font-serif text-[3.6rem] leading-none font-semibold md:text-[4.5rem] ${over ? "text-sun" : "text-paper"}`}>
                  {money(Math.abs(s.weekLeft), lang)}
                </p>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  <Mini label={lang === "en" ? "You take home" : "Te llega"} value={money(s.weekIn, lang)} color="text-leaf-soft" />
                  <Mini label={t("youSpend")} value={money(s.weekOut, lang)} color="text-sun-soft" />
                  <Mini label={t("youSave")} value={money(s.weekGoals, lang)} color="text-paper" />
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 max-w-sm text-xl">{t("noIncomeYet")}</p>
                <Button href="/casita/anotar?tipo=gane" className="mt-5">{t("addWork")}</Button>
              </>
            )}
          </Card>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">{t("quickActions")}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Tile vertical href="/casita/anotar?tipo=gane" icon={<ArrowDownCircle size={30} />} label={t("addEarned")} color="#3e7d4f" />
              <Tile vertical href="/casita/anotar?tipo=gaste" icon={<ArrowUpCircle size={30} />} label={t("addSpent")} color="#b34a2a" />
              <Tile vertical href="/casita/metas" icon={<PiggyBank size={30} />} label={t("addToGoal")} color="#e0a33a" />
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{t("myGoals")}</h2>
              <Link href="/casita/metas" className="flex h-11 items-center gap-1 rounded-full px-3 font-bold text-clay hover:bg-sand/60">
                {lang === "en" ? "See all" : "Ver todas"} <ChevronRight size={20} />
              </Link>
            </div>
            {me.goals.length === 0 ? (
              <Card className="text-center">
                <p className="text-lg text-muted">{t("noGoals")}</p>
                <Button href="/casita/metas?nueva=1" className="mt-4"><Plus size={22} /> {t("newGoal")}</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {me.goals.slice(0, 3).map((g) => {
                  const preset = goalPresetById(g.preset);
                  const saved = goalSaved(g);
                  const p = Math.min(1, saved / g.target);
                  return (
                    <Link key={g.id} href={`/casita/metas/${g.id}`} className="flex items-center gap-4 rounded-3xl border border-sand bg-paper p-4 hover:border-sand-dark">
                      <GoalVisual visual={preset.visual} progress={p} size={84} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-extrabold">{g.name}</span>
                        <span className="block text-base text-muted">{money(saved, lang)} {t("of")} {money(g.target, lang)}</span>
                        <span className="mt-2 block h-3 overflow-hidden rounded-full bg-sand">
                          <span className="block h-full rounded-full bg-clay" style={{ width: `${p * 100}%` }} />
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {tandas.length > 0 && (
            <Link href="/casita/tanda" className="flex items-center gap-4 rounded-3xl border border-sand bg-paper p-4 hover:border-sand-dark">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-clay/10 text-clay"><Users size={28} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-extrabold">{t("myTanda")}: {tandas[0].name}</span>
                <span className="block text-base text-muted">
                  {tandas[0].received
                    ? (lang === "en" ? "You already got it" : "Ya la recibiste")
                    : `${lang === "en" ? "Your turn:" : "Te toca:"} ${tandaPayoutDate(tandas[0]).toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { day: "numeric", month: "long" })} · ${money(tandaPot(tandas[0]), lang)}`}
                </span>
              </span>
              <ChevronRight size={24} className="text-muted" />
            </Link>
          )}

          <BillsCard compact />
          {recent.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl font-semibold">{t("recent")}</h2>
              <Card className="divide-y divide-sand p-2 md:p-2">
                {recent.map((row) => {
                  if (row.kind === "goal") {
                    return (
                      <Link key={row.id} href={`/casita/metas/${row.goalId}`} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-cream">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sun-soft text-clay"><PiggyBank size={22} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">{row.goalName}</span>
                          <span className="block text-sm text-muted">{row.amount < 0 ? (lang === "en" ? "Taken out" : "Sacaste") : row.fromTanda ? (lang === "en" ? "From your tanda" : "De tu tanda") : row.auto ? (lang === "en" ? "Savings plan" : "Plan de ahorro") : (lang === "en" ? "Set apart" : "Apartaste")} · {shortDate(row.date, lang)}</span>
                        </span>
                        <span className={`font-serif text-xl font-semibold ${row.fromTanda ? "text-leaf" : ""}`}>{row.fromTanda ? "+" : row.amount < 0 ? "+" : "−"}{money(Math.abs(row.amount), lang)}</span>
                        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand/60"><Pencil size={17} /></span>
                      </Link>
                    );
                  }
                  const e = row.entry;
                  const c = e.kind === "in" ? incomeCategoryById(e.category) : categoryById(e.category);
                  return (
                    <button key={e.id} onClick={() => setEditing(e)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-cream">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${e.kind === "in" ? "bg-leaf-soft text-leaf" : "bg-sand/70 text-clay"}`}>
                        <Icon name={c.icon} size={22} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{pick(c.label, lang)}</span>
                        <span className="block text-sm text-muted">{e.repeat === "once" ? shortDate(e.date, lang) : lang === "en" ? "Repeats" : "Se repite"}</span>
                      </span>
                      <span className={`font-serif text-xl font-semibold ${e.kind === "in" ? "text-leaf" : ""}`}>
                        {e.kind === "in" ? "+" : "−"}{money(e.amount, lang)}
                      </span>
                      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand/60"><Pencil size={17} /></span>
                    </button>
                  );
                })}
              </Card>
            </section>
          )}
        </div>
      </div>
      <EntryEditSheet entry={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-paper/8 px-2 py-3">
      <p className="text-sm text-paper/70">{label}</p>
      <p className={`font-serif text-xl font-semibold md:text-2xl ${color}`}>{value}</p>
    </div>
  );
}
