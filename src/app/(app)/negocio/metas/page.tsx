"use client";
import { useResetOn } from "@/lib/hooks";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Lightbulb, Minus, Pause, PiggyBank, Plus, Repeat as RepeatIcon, Trash2 } from "lucide-react";
import { AmountInput, Button, Card, ListenButton, PageHeader, QuickAmounts, Sheet, cx } from "@/components/ui";
import { GoalVisual } from "@/components/GoalVisual";
import { Icon } from "@/components/Icon";
import { PlanEditor, finishText, type PlanDraft } from "@/components/PlanEditor";
import { L, TipList, useBiz } from "@/components/Biz";
import { goalSaved, useStore, type Goal } from "@/lib/store";
import { money, toMonthly } from "@/lib/money";
import { pick } from "@/lib/catalog";
import { BIZ_GOALS, bizFreeWeekly, bizGoalPreset, bizTips, recommendBizSaving } from "@/lib/business";
import { playBrick, playGoal, playSaved } from "@/lib/sound";

export default function MetasNegocioPage() {
  return (
    <Suspense>
      <Metas />
    </Suspense>
  );
}

function Metas() {
  const { biz, n, lang, region } = useBiz();
  const params = useSearchParams();
  const router = useRouter();
  const [create, setCreate] = useState<string | null>(null);
  useEffect(() => { if (!biz) router.replace("/negocio"); }, [biz, router]);
  const nueva = params.get("nueva");
  useResetOn(nueva, () => { if (nueva) setCreate(nueva === "1" ? "" : nueva); });
  useEffect(() => { if (nueva) router.replace("/negocio/metas", { scroll: false }); }, [nueva, router]);
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h) setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
  }, []);
  if (!biz) return null;

  const tips = bizTips(n, biz.products, biz.entries, biz.goals, lang, { type: biz.type, stock: biz.stock, hasPay: !!biz.pay, region });
  const ideas = BIZ_GOALS.filter((g) => !biz.goals.some((x) => x.preset === g.id)).slice(0, 3);

  return (
    <div>
      <PageHeader
        title={L(lang, "Metas de mi negocio", "My business goals")}
        say={L(lang, "Aquí juntas dinero para hacer crecer tu negocio: equipo, mercancía, tu propio local. Y aquí tienes ideas para que te vaya mejor.", "Here you save to grow your business: equipment, stock, your own place. And here are ideas to do better.")}
        right={<span className="hidden md:block"><Button onClick={() => setCreate("")} className="min-h-12 px-4 text-base"><Plus size={20} /> {L(lang, "Nueva meta", "New goal")}</Button></span>}
      />

      {biz.goals.length === 0 ? (
        <Card className="flex flex-col items-center py-8 text-center">
          <GoalVisual visual="jar" progress={0} size={150} />
          <p className="mt-3 max-w-md text-xl">{L(lang, "Todavía no tienes metas para tu negocio. Elige una idea o crea la tuya.", "No business goals yet. Pick an idea or create your own.")}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {biz.goals.map((g) => <GoalCard key={g.id} goal={g} />)}
        </div>
      )}

      {/* Ideas for goals */}
      <h2 className="mt-8 mb-3 text-xl font-extrabold">{L(lang, "Ideas de metas para tu negocio", "Goal ideas for your business")}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {ideas.map((g) => (
          <button key={g.id} onClick={() => setCreate(g.id)} className="flex min-w-0 items-center gap-4 rounded-3xl border-2 border-sand bg-paper p-4 text-left hover:border-sand-dark">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sun-soft text-clay"><Icon name={g.icon} size={28} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg leading-tight font-extrabold">{pick(g.label, lang)}</span>
              <span className="block text-base text-muted">{pick(g.hint, lang)} · {money(g.suggested(n, biz.type), lang)}</span>
            </span>
            <Plus size={24} className="shrink-0 text-clay" />
          </button>
        ))}
        <button onClick={() => setCreate("")} className="flex min-h-20 items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-sand-dark p-4 text-lg font-extrabold text-clay md:hidden">
          <Plus size={24} /> {L(lang, "Otra meta", "Another goal")}
        </button>
      </div>

      {/* All suggestions */}
      <section id="ideas" className="mt-8 scroll-mt-24">
        <Card>
          <h2 className="mb-1 flex items-center gap-2 text-xl font-extrabold"><Lightbulb size={24} className="text-sun" /> {L(lang, "Sugerencias para que te vaya mejor", "Suggestions to do better")}</h2>
          <p className="text-base text-muted">{L(lang, "Salen de lo que anotaste. Cambian cuando tu negocio cambia.", "They come from what you entered and change as your business does.")}</p>
          <TipList tips={tips} lang={lang} />
        </Card>
      </section>

      <CreateSheet preset={create} onClose={() => setCreate(null)} />
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const { lang } = useBiz();
  const deposit = useStore((s) => s.bizDeposit);
  const setPlan = useStore((s) => s.setBizPlan);
  const remove = useStore((s) => s.removeBizGoal);
  const [sheet, setSheet] = useState<"in" | "out" | "plan" | "delete" | null>(null);
  const [amount, setAmount] = useState("");
  const [plan, setPlanDraft] = useState<PlanDraft>({ amount: "", every: "week" });
  const [glow, setGlow] = useState(false);
  const preset = bizGoalPreset(goal.preset);
  const saved = goalSaved(goal);
  const p = Math.min(1, saved / goal.target);
  const missing = Math.max(0, goal.target - saved);
  const say = L(lang, `${goal.name}. Llevas ${money(saved, lang)} de ${money(goal.target, lang)}. Te faltan ${money(missing, lang)}.`, `${goal.name}. You have ${money(saved, lang)} of ${money(goal.target, lang)}. ${money(missing, lang)} to go.`);

  const confirm = () => {
    const v = Number(amount);
    if (!v) return;
    if (sheet === "out") deposit(goal.id, -Math.min(v, saved));
    else {
      deposit(goal.id, v);
      if (saved + v >= goal.target && saved < goal.target) playGoal(); else playBrick();
      setGlow(true); setTimeout(() => setGlow(false), 1600);
    }
    setSheet(null); setAmount("");
  };

  return (
    <div id={goal.id} className={cx("flex min-w-0 scroll-mt-24 flex-col rounded-[2rem] border bg-paper p-5 transition", glow ? "border-sun ring-4 ring-sun/30" : "border-sand")}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sun-soft text-clay"><Icon name={preset.icon} size={22} /></span>
        <h3 className="min-w-0 flex-1 text-xl leading-tight font-extrabold">{goal.name}</h3>
        <ListenButton text={say} compact />
      </div>
      <div className="my-2 flex justify-center"><GoalVisual visual={preset.visual} progress={p} size={150} /></div>
      <p className="text-center text-lg"><b>{money(saved, lang)}</b> <span className="text-muted">{L(lang, "de", "of")} {money(goal.target, lang)}</span></p>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-sun" style={{ width: `${p * 100}%` }} /></div>
      {goal.plan ? (
        <p className="mt-3 flex items-center gap-2 rounded-2xl bg-leaf-soft px-3 py-2 text-base font-bold">
          <RepeatIcon size={18} className="shrink-0" />
          <span className="min-w-0 flex-1">{L(lang, `Apartas ${money(goal.plan.amount, lang)} ${goal.plan.every === "week" ? "cada semana" : goal.plan.every === "2weeks" ? "cada 2 semanas" : "cada mes"}`, `You set aside ${money(goal.plan.amount, lang)} ${goal.plan.every === "week" ? "weekly" : goal.plan.every === "2weeks" ? "every 2 weeks" : "monthly"}`)}</span>
        </p>
      ) : missing > 0 ? (
        <button onClick={() => { setPlanDraft({ amount: "", every: "week" }); setSheet("plan"); }} className="mt-3 rounded-2xl border-2 border-dashed border-sand-dark px-3 py-2 text-base font-bold text-clay">
          <RepeatIcon size={18} className="mr-1 inline" /> {L(lang, "Apartar algo cada semana, solito", "Set aside something every week, automatically")}
        </button>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="green" className="col-span-2 min-h-14 text-lg" onClick={() => { setAmount(""); setSheet("in"); }}><PiggyBank size={24} /> {L(lang, "Aparté dinero", "I saved money")}</Button>
        <button onClick={() => { setAmount(""); setSheet("out"); }} className="flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border-2 border-sand px-2 text-base font-bold"><Minus size={20} className="shrink-0" /> {L(lang, "Saqué", "Took out")}</button>
        <button onClick={() => setSheet(goal.plan ? "plan" : "delete")} className="flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border-2 border-sand px-2 text-base font-bold">
          {goal.plan ? <><RepeatIcon size={20} className="shrink-0" /> {L(lang, "Mi plan", "My plan")}</> : <><Trash2 size={20} className="shrink-0" /> {L(lang, "Borrar", "Delete")}</>}
        </button>
      </div>

      <Sheet open={sheet === "in" || sheet === "out"} onClose={() => setSheet(null)} title={sheet === "out" ? L(lang, "Saqué dinero de la meta", "Took money out") : L(lang, "Aparté dinero", "I saved money")}>
        <AmountInput value={amount} onChange={setAmount} autoFocus />
        <QuickAmounts amounts={[25, 50, 100, 200]} onPick={(v) => setAmount(String(v))} />
        <Button variant={sheet === "out" ? "dark" : "green"} className="mt-5 w-full" disabled={!(Number(amount) > 0)} onClick={confirm}><Check size={22} /> {L(lang, "Listo", "Done")}</Button>
      </Sheet>

      <Sheet open={sheet === "plan"} onClose={() => setSheet(null)} title={L(lang, "Apartar solito", "Save automatically")}>
        {goal.plan ? (
          <div className="space-y-3">
            <p className="text-lg">{L(lang, `Ahora apartas ${money(goal.plan.amount, lang)}. ${finishText(missing, goal.plan.amount, goal.plan.every, lang) ?? ""}`, `You set aside ${money(goal.plan.amount, lang)}. ${finishText(missing, goal.plan.amount, goal.plan.every, lang) ?? ""}`)}</p>
            <Button variant="soft" className="w-full" onClick={() => { setPlan(goal.id, null); setSheet(null); }}><Pause size={20} /> {L(lang, "Pausar", "Pause")}</Button>
            <Button variant="ghost" className="w-full text-clay" onClick={() => setSheet("delete")}><Trash2 size={20} /> {L(lang, "Borrar meta", "Delete goal")}</Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-lg">{L(lang, "Cada semana se aparta solito de tu negocio y se suma a esta meta.", "Every week it's set aside from your business and added to this goal.")}</p>
            <PlanEditor value={plan} onChange={setPlanDraft} missing={missing} />
            <Button variant="green" className="mt-5 w-full" disabled={!(Number(plan.amount) > 0)} onClick={() => { setPlan(goal.id, { amount: Number(plan.amount), every: plan.every }); playSaved(); setSheet(null); }}>
              <Check size={22} /> {L(lang, "Empezar", "Start")}
            </Button>
          </>
        )}
      </Sheet>

      <Sheet open={sheet === "delete"} onClose={() => setSheet(null)} title={L(lang, "¿Borrar esta meta?", "Delete this goal?")}>
        <p className="text-lg">{L(lang, "Se borra la meta y lo que llevas anotado en ella.", "The goal and what you've saved in it will be deleted.")}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="soft" onClick={() => setSheet(null)}>{L(lang, "No", "No")}</Button>
          <Button variant="dark" onClick={() => remove(goal.id)}><Trash2 size={20} /> {L(lang, "Sí, borrar", "Yes, delete")}</Button>
        </div>
      </Sheet>
    </div>
  );
}

function CreateSheet({ preset, onClose }: { preset: string | null; onClose: () => void }) {
  const { n, lang, biz } = useBiz();
  const plansMonthly = (biz?.goals ?? []).filter((g) => g.plan && goalSaved(g) < g.target).reduce((a, g) => a + toMonthly(g.plan!.amount, g.plan!.every), 0);
  const freeWeekly = bizFreeWeekly(n, plansMonthly);
  const addGoal = useStore((s) => s.addBizGoal);
  const setPlan = useStore((s) => s.setBizPlan);
  const [pid, setPid] = useState<string>("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [plan, setPlanDraft] = useState<PlanDraft>({ amount: "", every: "week" });
  const choose = (id: string) => {
    const p = bizGoalPreset(id);
    const t = p.suggested(n, biz?.type);
    setPid(id); setName(id === "propia" ? "" : pick(p.label, lang)); setTarget(String(t));
    const rec = recommendBizSaving(freeWeekly, t);
    setPlanDraft({ amount: rec ? String(rec) : "", every: "week" });
  };
  const preset0 = pid ? bizGoalPreset(pid) : null;
  const recWeekly = recommendBizSaving(freeWeekly, Number(target) || 0);
  useResetOn(preset, () => {
    if (preset === null) return;
    if (preset) choose(preset); else { setPid(""); setName(""); setTarget(""); setPlanDraft({ amount: "", every: "week" }); }
  });

  const ok = pid && name.trim() && Number(target) > 0;
  return (
    <Sheet open={preset !== null} onClose={onClose} title={L(lang, "Nueva meta del negocio", "New business goal")} wide>
      {!pid ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[...BIZ_GOALS, bizGoalPreset("propia")].map((g) => (
            <button key={g.id} onClick={() => choose(g.id)} className="flex min-h-20 min-w-0 items-center gap-3 rounded-2xl border-2 border-sand bg-paper p-3 text-left hover:border-clay">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sun-soft text-clay"><Icon name={g.icon} size={24} /></span>
              <span className="min-w-0">
                <span className="block text-lg leading-tight font-extrabold">{g.id === "propia" ? L(lang, "Otra meta (la escribo yo)", "Another goal (I'll write it)") : pick(g.label, lang)}</span>
                {g.hint.es && <span className="block text-base text-muted">{pick(g.hint, lang)}</span>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={L(lang, "Nombre de la meta", "Goal name")} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg outline-none focus:border-clay" />
          <div>
            <AmountInput label={L(lang, "¿Cuánto necesitas?", "How much do you need?")} value={target} onChange={setTarget} />
            {preset0?.why && <p className="mt-2 text-base text-muted">💡 {pick(preset0.why(biz?.type), lang)} {L(lang, "Puedes cambiarlo.", "You can change it.")}</p>}
          </div>
          <div>
            <p className="mb-2 text-lg font-bold">{L(lang, "¿Cuánto apartas? (opcional)", "How much will you set aside? (optional)")}</p>
            {recWeekly ? (
              <div className="mb-3 rounded-2xl border-2 border-sun bg-sun-soft p-4">
                <p className="text-lg font-extrabold">💡 {L(lang, `Te recomendamos ${money(recWeekly, lang)} a la semana`, `We suggest ${money(recWeekly, lang)} a week`)}</p>
                <p className="mt-1 text-base">{L(lang,
                  `Después de gastos, tu sueldo y tus otras metas, a tu negocio le quedan como ${money(freeWeekly, lang)} a la semana. Apartar una parte deja dinero para surtir.`,
                  `After costs, your salary and other goals, your business has about ${money(freeWeekly, lang)} a week left. Setting part aside leaves money for stock.`)}</p>
                {Number(plan.amount) !== recWeekly && <button onClick={() => setPlanDraft({ ...plan, amount: String(recWeekly) })} className="mt-2 inline-flex h-11 items-center rounded-xl bg-ink px-4 font-bold text-paper">{L(lang, "Usar esta cantidad", "Use this amount")}</button>}
              </div>
            ) : freeWeekly <= 0 && n.hasData ? (
              <p className="mb-3 rounded-2xl bg-sun-soft px-4 py-3 text-base">{L(lang, "Ahora mismo a tu negocio no le sobra dinero después de gastos y tu sueldo. Empieza con poquito o revisa tus precios en Mis costos.", "Right now your business has nothing left after costs and your salary. Start small or check your prices in My costs.")}</p>
            ) : null}
            <PlanEditor value={plan} onChange={setPlanDraft} missing={Number(target) || 0} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="soft" onClick={() => setPid("")}>{L(lang, "Elegir otra", "Pick another")}</Button>
            <Button variant="green" disabled={!ok} onClick={() => {
              const id = addGoal({ preset: pid, name: name.trim(), target: Number(target) });
              if (Number(plan.amount) > 0) setPlan(id, { amount: Number(plan.amount), every: plan.every });
              playGoal(); onClose();
            }}><Check size={22} /> {L(lang, "Crear meta", "Create goal")}</Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
