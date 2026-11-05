"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PiggyBank, Minus, Trash2, Share2, PartyPopper, Repeat as RepeatIcon, Pencil, Pause } from "lucide-react";
import { AmountInput, Button, Card, ListenButton, PageHeader, QuickAmounts, Sheet } from "@/components/ui";
import { GoalVisual, unitsFor } from "@/components/GoalVisual";
import { useT } from "@/lib/hooks";
import { goalSaved, useLang, useMe, useStore, type Plan } from "@/lib/store";
import { PlanEditor, finishText, suggestAmounts, type PlanDraft } from "@/components/PlanEditor";
import { useSummary } from "@/lib/useSummary";
import { money, moneySpoken, shortDate, toWeekly } from "@/lib/money";
import { goalPresetById } from "@/lib/catalog";
import { speak } from "@/lib/voice";
import { playBrick, playGoal } from "@/lib/sound";

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const lang = useLang();
  const me = useMe()!;
  const router = useRouter();
  const deposit = useStore((s) => s.deposit);
  const removeGoal = useStore((s) => s.removeGoal);
  const goal = me.goals.find((g) => g.id === id);

  const [sheet, setSheet] = useState<"in" | "out" | null>(null);
  const [amount, setAmount] = useState("");
  const [highlightFrom, setHighlightFrom] = useState<number | undefined>();
  const [celebrate, setCelebrate] = useState<null | "brick" | "done">(null);

  if (!goal) {
    return (
      <>
        <PageHeader title={t("goalsTitle")} say={t("goalsSay")} back="/casita/metas" />
        <Card><p className="text-lg">—</p></Card>
      </>
    );
  }

  const preset = goalPresetById(goal.preset);
  const units = unitsFor(preset.visual);
  const unitWord = preset.visual === "house" ? t("bricks") : t("coins");
  const saved = goalSaved(goal);
  const progress = Math.min(1, saved / goal.target);
  const have = Math.floor(progress * units + 1e-9);
  const missing = Math.max(0, goal.target - saved);
  const perUnit = goal.target / units;

  const say = `${goal.name}. ${t("saved")} ${moneySpoken(saved, lang)} ${t("of")} ${moneySpoken(goal.target, lang)}. ${have} ${t("of")} ${units} ${unitWord}. ${missing > 0 ? `${t("missing")} ${moneySpoken(missing, lang)}.` : t("goalDone")}`;

  const confirm = () => {
    const n = Number(amount);
    if (!n) return;
    if (sheet === "out") {
      deposit(goal.id, -Math.min(n, saved));
      setSheet(null); setAmount("");
      return;
    }
    const before = have;
    const newSaved = saved + n;
    const after = Math.floor(Math.min(1, newSaved / goal.target) * units + 1e-9);
    deposit(goal.id, n);
    setSheet(null); setAmount("");
    setHighlightFrom(before);
    if (newSaved >= goal.target && saved < goal.target) {
      setCelebrate("done"); playGoal(); speak(t("goalDone"), lang, "goalDone");
    } else if (after > before) {
      setCelebrate("brick"); playBrick();
      const added = after - before;
      speak(lang === "en" ? `You added ${added} ${added === 1 ? "brick" : "bricks"}! ${t("missing")} ${moneySpoken(newSaved >= goal.target ? 0 : goal.target - newSaved, lang)}.` : `¡Pusiste ${added} ${added === 1 ? "ladrillo" : "ladrillos"} más! ${t("missing")} ${moneySpoken(goal.target - newSaved, lang)}.`, lang, "brickAdded");
    } else {
      setCelebrate("brick"); playBrick();
      speak(lang === "en" ? `Saved. ${money(perUnit - ((newSaved) % perUnit), lang)} more for the next one.` : `Guardado. Te faltan ${moneySpoken(perUnit - (newSaved % perUnit), lang)} para el siguiente.`, lang);
    }
    setTimeout(() => setCelebrate(null), 3500);
  };

  const share = async () => {
    const text = lang === "en"
      ? `I'm building "${goal.name}" with Mi Camino: ${have} of ${units} ${unitWord} already! 🏠`
      : `Estoy construyendo "${goal.name}" con Mi Camino: ¡ya llevo ${have} de ${units} ${unitWord}! 🏠`;
    if (navigator.share) await navigator.share({ text }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <>
      <PageHeader title={goal.name} say={say} back="/casita/metas" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr] lg:gap-6">
        <Card className="relative flex flex-col items-center p-6 text-center md:p-8">
          {celebrate && (
            <div className="pop-in absolute top-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-sun px-5 py-2.5 text-lg font-extrabold whitespace-nowrap shadow-lg">
              <PartyPopper size={22} /> {celebrate === "done" ? t("goalDone") : t("brickAdded")}
            </div>
          )}
          <GoalVisual visual={preset.visual} progress={progress} highlightFrom={highlightFrom} size={280} />
          <p className="mt-2 text-xl font-extrabold">{t("saved")} {have} {t("of")} {units} {unitWord}</p>
          <p className="mt-1 font-serif text-4xl font-semibold">{money(saved, lang)}</p>
          <p className="text-lg text-muted">{t("of")} {money(goal.target, lang)}</p>
          <div className="mt-4 h-4 w-full max-w-sm overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-full bg-clay transition-all duration-700" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-3 text-base text-muted">
            {lang === "en" ? `Each ${preset.visual === "house" ? "brick" : "coin"} = ${money(perUnit, lang)}` : `Cada ${preset.visual === "house" ? "ladrillo" : "moneda"} = ${money(perUnit, lang)}`}
          </p>
          {missing > 0 && saved % perUnit > 0.01 && (
            <p className="mt-1 text-base font-bold text-clay">
              {lang === "en"
                ? `${money(perUnit - (saved % perUnit), lang)} more for the next ${preset.visual === "house" ? "brick" : "coin"}`
                : `Te faltan ${money(perUnit - (saved % perUnit), lang)} para ${preset.visual === "house" ? "el siguiente ladrillo" : "la siguiente moneda"}`}
            </p>
          )}
          <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
            <Button onClick={() => setSheet("in")} className="min-h-16 text-xl"><PiggyBank size={26} /> {t("putAside")}</Button>
            <Button variant="soft" onClick={share}><Share2 size={22} /> {t("shareFamily")}</Button>
          </div>
        </Card>

        <div className="space-y-5">
          {missing > 0 && <PlanCard goalId={goal.id} plan={goal.plan ?? null} missing={missing} />}

          <Card>
            <h2 className="text-2xl font-semibold">{lang === "en" ? "What you've saved" : "Lo que has apartado"}</h2>
            {goal.deposits.length === 0 ? (
              <p className="mt-3 text-lg text-muted">{lang === "en" ? "Nothing yet. Your first brick is waiting!" : "Todavía nada. ¡Tu primer ladrillo te espera!"}</p>
            ) : (
              <ul className="mt-3 divide-y divide-sand">
                {[...goal.deposits].reverse().slice(0, 8).map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-3 text-lg">
                    <span className="flex items-center gap-2 text-muted">{shortDate(d.date, lang)}{d.auto && <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2 py-0.5 text-sm font-bold text-leaf"><RepeatIcon size={14} /> {lang === "en" ? "plan" : "plan"}</span>}</span>
                    <span className={`font-serif text-xl font-semibold ${d.amount < 0 ? "text-clay" : "text-leaf"}`}>{d.amount < 0 ? "−" : "+"}{money(Math.abs(d.amount), lang)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {saved > 0 && <Button variant="ghost" onClick={() => setSheet("out")} className="min-h-12 text-base"><Minus size={20} /> {t("takeOut")}</Button>}
              <Button
                variant="ghost"
                onClick={() => { if (confirm_(lang)) { removeGoal(goal.id); router.push("/casita/metas"); } }}
                className="min-h-12 text-base text-clay"
              >
                <Trash2 size={20} /> {t("delete")}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} title={sheet === "out" ? t("takeOut") : t("putAside")}>
        <p className="mb-4 text-lg text-muted">{sheet === "out" ? t("takeOutSay") : t("putAsideSay")}</p>
        <AmountInput value={amount} onChange={setAmount} autoFocus />
        {sheet === "in" && <QuickAmounts amounts={[10, 20, 50, 100, Math.round(perUnit)]} onPick={(n) => setAmount(String(n))} />}
        <Button onClick={confirm} disabled={!Number(amount)} className="mt-6 w-full">{t("save")}</Button>
      </Sheet>
    </>
  );
}

function confirm_(lang: string) {
  return window.confirm(lang === "en" ? "Delete this goal?" : "¿Borrar esta meta?");
}

/** The savings plan: fixed amount set apart every week/2 weeks/month. */
function PlanCard({ goalId, plan, missing }: { goalId: string; plan: Plan | null; missing: number }) {
  const t = useT();
  const lang = useLang();
  const setPlan = useStore((s) => s.setPlan);
  const summary = useSummary();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlanDraft>(() => ({
    amount: String(plan?.amount ?? suggestAmounts(missing, "week")[1] ?? 20),
    every: plan?.every ?? "week",
  }));
  const everyWord = (e: Plan["every"]) => t(e === "week" ? "weekly" : e === "2weeks" ? "biweekly" : "monthly").toLowerCase();

  if (plan && !editing) {
    const finish = finishText(missing, plan.amount, plan.every, lang);
    const say = `${t("planActive")} ${moneySpoken(plan.amount, lang)} ${everyWord(plan.every)}. ${t("planHow")} ${finish ?? ""}`;
    return (
      <Card dark>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-semibold">{t("planTitle")}</h2>
          <ListenButton compact light text={say} />
        </div>
        <p className="mt-3 text-lg text-paper/80">{t("planActive")}</p>
        <p className="font-serif text-5xl font-semibold">{money(plan.amount, lang)} <span className="text-2xl text-paper/70">{everyWord(plan.every)}</span></p>
        <p className="mt-4 flex items-start gap-2 text-base text-paper/80"><RepeatIcon size={20} className="mt-0.5 shrink-0 text-sun" /> {t("planHow")}</p>
        {finish && <p className="mt-4 rounded-2xl bg-paper/10 px-4 py-3 text-center text-lg font-bold">{finish}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => { setDraft({ amount: String(plan.amount), every: plan.every }); setEditing(true); }} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-paper px-4 font-bold text-ink"><Pencil size={18} /> {t("planChange")}</button>
          <button onClick={() => setPlan(goalId, null)} className="inline-flex h-12 items-center gap-2 rounded-2xl px-4 font-bold text-paper/80 hover:bg-paper/10"><Pause size={18} /> {t("planPause")}</button>
        </div>
      </Card>
    );
  }

  // Changing an existing plan shouldn't count its own amount twice in the warning.
  const currentWeekly = plan ? toWeekly(plan.amount, plan.every) : 0;
  const tight = summary ? summary.weekIn > 0 && summary.weekLeft + currentWeekly - toWeekly(Number(draft.amount) || 0, draft.every) < 0 : false;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold">{t("planTitle")}</h2>
        <ListenButton compact text={t("planAskSay")} />
      </div>
      {!plan && <p className="mt-2 mb-4 text-lg text-muted">{t("planNone")}</p>}
      {plan && <div className="mt-4" />}
      <PlanEditor value={draft} onChange={setDraft} missing={missing} tight={tight} />
      <div className="mt-4 flex gap-3">
        {plan && <Button variant="soft" onClick={() => setEditing(false)} className="flex-1">{t("cancel")}</Button>}
        <Button
          onClick={() => {
            setPlan(goalId, { amount: Number(draft.amount), every: draft.every });
            setEditing(false);
            if (!plan) { playBrick(); speak(`${t("planActive")} ${moneySpoken(Number(draft.amount), lang)} ${everyWord(draft.every)}. ${t("planHow")}`, lang); }
          }}
          disabled={!Number(draft.amount)}
          className="flex-[2]"
        >
          {plan ? t("save") : t("planStart")}
        </Button>
      </div>
    </Card>
  );
}
