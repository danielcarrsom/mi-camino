"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { AmountInput, Button, Card, PageHeader, QuickAmounts, Sheet, Tile } from "@/components/ui";
import { GoalVisual, unitsFor } from "@/components/GoalVisual";
import { Icon } from "@/components/Icon";
import { useT } from "@/lib/hooks";
import { goalSaved, useLang, useMe, useStore } from "@/lib/store";
import { money } from "@/lib/money";
import { GOAL_PRESETS, goalPresetById, pick, type GoalPreset } from "@/lib/catalog";
import { speak } from "@/lib/voice";
import { playSaved } from "@/lib/sound";

export default function GoalsPage() {
  return (
    <Suspense>
      <Goals />
    </Suspense>
  );
}

function Goals() {
  const t = useT();
  const lang = useLang();
  const me = useMe()!;
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (params.get("nueva")) setOpen(true); }, [params]);

  return (
    <>
      <PageHeader
        title={t("goalsTitle")}
        say={t("goalsSay")}
        right={<Button onClick={() => setOpen(true)} className="hidden min-h-12 px-4 text-base md:inline-flex"><Plus size={20} /> {t("newGoal")}</Button>}
      />

      {me.goals.length === 0 ? (
        <Card className="flex flex-col items-center py-10 text-center">
          <GoalVisual visual="house" progress={0} size={180} />
          <p className="mt-4 text-xl">{t("noGoals")}</p>
          <Button onClick={() => setOpen(true)} className="mt-5"><Plus size={22} /> {t("newGoal")}</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {me.goals.map((g) => {
            const preset = goalPresetById(g.preset);
            const saved = goalSaved(g);
            const p = Math.min(1, saved / g.target);
            const units = unitsFor(preset.visual);
            const have = Math.floor(p * units + 1e-9);
            return (
              <Link key={g.id} href={`/casita/metas/${g.id}`} className="flex flex-col items-center rounded-[2rem] border border-sand bg-paper p-5 text-center transition hover:border-sand-dark hover:shadow-[0_6px_0_#eadfcb]">
                <GoalVisual visual={preset.visual} progress={p} size={170} />
                <h2 className="mt-2 text-xl leading-tight font-extrabold">{g.name}</h2>
                <p className="mt-1 text-lg text-muted">
                  {have} {t("of")} {units} {preset.visual === "house" ? t("bricks") : t("coins")}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold">{money(saved, lang)} <span className="text-lg text-muted">/ {money(g.target, lang)}</span></p>
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)} className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-sand-dark text-xl font-extrabold text-muted hover:border-clay hover:text-clay">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sand/60"><Plus size={34} /></span>
            {t("newGoal")}
          </button>
        </div>
      )}

      <NewGoalSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function NewGoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const addGoal = useStore((s) => s.addGoal);
  const router = useRouter();
  const [preset, setPreset] = useState<GoalPreset | "own" | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) { setPreset(null); setName(""); setAmount(""); speak(t("newGoalSay"), lang, "newGoal"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const choose = (p: GoalPreset | "own") => {
    setPreset(p);
    if (p !== "own") { setName(pick(p.label, lang)); setAmount(String(p.suggested)); speak(t("howMuchSay"), lang, "howMuch"); }
  };

  const create = () => {
    const id = addGoal({ preset: preset === "own" || !preset ? "propia" : preset.id, name: name.trim() || pick(goalPresetById("propia").label, lang), target: Number(amount) });
    playSaved();
    speak(t("goalCreated"), lang, "goalCreated");
    onClose();
    router.push(`/casita/metas/${id}`);
  };

  return (
    <Sheet open={open} onClose={onClose} title={preset ? t("howMuch") : t("newGoal")} wide={!preset}>
      {!preset ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GOAL_PRESETS.map((p) => (
            <Tile key={p.id} icon={<Icon name={p.icon} size={28} />} label={pick(p.label, lang)} sub={pick(p.hint, lang)} onClick={() => choose(p)} />
          ))}
          <Tile icon={<Pencil size={28} />} label={t("ownGoal")} color="#3e7d4f" onClick={() => choose("own")} />
        </div>
      ) : (
        <div className="space-y-5">
          {preset === "own" && (
            <label className="block">
              <span className="mb-2 block text-lg font-bold">{t("ownGoalName")}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="h-16 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-xl font-bold outline-none focus:border-clay" />
            </label>
          )}
          {preset !== "own" && (
            <div className="flex items-center gap-3 rounded-2xl bg-paper p-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-clay/10 text-clay"><Icon name={preset.icon} /></span>
              <input value={name} onChange={(e) => setName(e.target.value)} aria-label={t("ownGoalName")} className="h-12 min-w-0 flex-1 bg-transparent text-xl font-extrabold outline-none" />
            </div>
          )}
          <AmountInput value={amount} onChange={setAmount} label={t("howMuch")} autoFocus={preset !== "own"} />
          <QuickAmounts amounts={[500, 1000, 5000, 10000]} onPick={(n) => setAmount(String(n))} />
          <div className="flex gap-3">
            <Button variant="soft" onClick={() => setPreset(null)} className="flex-1">{t("back")}</Button>
            <Button onClick={create} disabled={!Number(amount) || (preset === "own" && !name.trim())} className="flex-[2]">{t("save")}</Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
