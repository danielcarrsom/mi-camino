"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, Mic, Keyboard, Camera, Check, Trash2, Hammer, Loader2, ImageUp, ShieldCheck, Repeat as RepeatIcon } from "lucide-react";
import { AmountInput, Button, Card, Disclaimer, MicButton, PageHeader, Sheet, Tile, cx } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useT } from "@/lib/hooks";
import { useLang, useMe, useStore, type Source } from "@/lib/store";
import { money, moneySpoken } from "@/lib/money";
import { INCOME_CATEGORIES, categoryById, incomeCategoryById, pick, type Repeat } from "@/lib/catalog";
import { CategorySheet, RepeatPicker, WorkEditor, toSavedWork } from "@/components/MoneyForms";
import type { Parsed, ParsedEntry, ParsedWork } from "@/lib/understand";
import { speak } from "@/lib/voice";
import { playSaved } from "@/lib/sound";

type Kind = "in" | "out";
type Method = "voz" | "texto" | "foto" | "manual";

export default function AddPage() {
  return (
    <Suspense>
      <Add />
    </Suspense>
  );
}

function Add() {
  const t = useT();
  const lang = useLang();
  const params = useSearchParams();
  const router = useRouter();
  const addEntries = useStore((s) => s.addEntries);
  const addWork = useStore((s) => s.addWork);
  const updateEntry = useStore((s) => s.updateEntry);
  const me = useMe();

  const tipo = params.get("tipo");
  const [kind, setKind] = useState<Kind | null>(tipo === "gane" ? "in" : tipo === "gaste" ? "out" : null);
  const [method, setMethod] = useState<Method>("voz");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Parsed | null>(null);
  const [source, setSource] = useState<Source>("voz");
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedRepeats, setSavedRepeats] = useState(false);

  useEffect(() => {
    setKind(tipo === "gane" ? "in" : tipo === "gaste" ? "out" : null);
    setResult(null); setSaved(false);
  }, [tipo]);

  async function understand(text: string, src: Source) {
    if (!kind) return;
    setBusy(true); setProblem(null); setSource(src);
    try {
      const r = await fetch("/api/entender", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, kind, lang }) });
      const j = (await r.json()) as Parsed;
      if (!j.entries.length && !j.work) { setProblem(t("couldNotUnderstand")); speak(t("couldNotUnderstand"), lang); }
      else { setResult(j); speak(t("checkThisSay"), lang, "checkThis"); }
    } catch {
      setProblem(t("couldNotUnderstand"));
    } finally { setBusy(false); }
  }

  async function readPhoto(file: File) {
    if (!kind) return;
    setBusy(true); setProblem(null); setSource("foto");
    try {
      const { data, type } = await shrinkImage(file);
      const r = await fetch("/api/leer-foto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: data, mediaType: type, kind }) });
      if (r.status === 501) { setProblem(t("needsAiKey")); speak(t("needsAiKey"), lang); return; }
      const j = (await r.json()) as Parsed & { error?: string };
      if (j.error || (!j.entries?.length && !j.work)) { setProblem(t("couldNotUnderstand")); speak(t("couldNotUnderstand"), lang); }
      else { setResult({ ...j, heard: "" }); speak(t("checkThisSay"), lang, "checkThis"); }
    } catch {
      setProblem(t("couldNotUnderstand"));
    } finally { setBusy(false); }
  }

  function save(entries: ParsedEntry[], work: ParsedWork | null, src: Source = source) {
    const now = new Date().toISOString();
    // A fixed expense (rent, electricity…) is kept once and repeats by itself.
    // Saving the same fixed one again updates it instead of counting it twice.
    const fresh: ParsedEntry[] = [];
    for (const e of entries) {
      const existing = e.repeat !== "once" ? me?.entries.find((x) => x.kind === e.kind && x.category === e.category && x.repeat !== "once") : undefined;
      if (existing) updateEntry(existing.id, { amount: e.amount, repeat: e.repeat, note: e.note || existing.note, source: src });
      else fresh.push(e);
    }
    if (fresh.length) addEntries(fresh.map((e) => ({ ...e, date: now, source: src })));
    setSavedRepeats(entries.some((e) => e.repeat !== "once"));
    const job = work ? toSavedWork(work) : null;
    if (job) { const { perHour: _ignored, ...rest } = job; void _ignored; addWork({ ...rest, source: src }); }
    const total = entries.reduce((a, e) => a + e.amount, 0) + (job?.pay ?? 0);
    playSaved();
    speak(`${t("savedOk")} ${moneySpoken(total, lang)}.`, lang, "savedOk");
    setSaved(true);
  }

  // ---------- Step 1: earned or spent ----------
  if (!kind) {
    const say = `${t("addEarned")}, ${t("addSpent")}.`;
    return (
      <>
        <PageHeader title={t("quickActions")} say={say} back="/casita" />
        <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
          <Tile className="min-h-36" icon={<ArrowDownCircle size={34} />} label={t("addEarned")} sub={t("addSayIn").split("?")[0] + "?"} color="#3e7d4f" onClick={() => router.push("/casita/anotar?tipo=gane")} />
          <Tile className="min-h-36" icon={<ArrowUpCircle size={34} />} label={t("addSpent")} sub={t("addSayOut").split("?")[0] + "?"} color="#b34a2a" onClick={() => router.push("/casita/anotar?tipo=gaste")} />
        </div>
      </>
    );
  }

  // ---------- Done ----------
  if (saved) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-10 text-center">
        <span className="pop-in flex h-28 w-28 items-center justify-center rounded-full bg-leaf text-paper"><Check size={64} strokeWidth={3} /></span>
        <h1 className="mt-6 text-4xl font-semibold">{t("savedOk")}</h1>
        {savedRepeats && <p className="mt-3 flex items-center gap-2 rounded-2xl bg-leaf-soft px-4 py-3 text-lg"><RepeatIcon size={22} className="shrink-0 text-leaf" /> {t("repeatsAlone")}</p>}
        <div className="mt-8 flex w-full flex-col gap-3">
          <Button href="/casita">{t("home")}</Button>
          <Button variant="soft" onClick={() => { setSaved(false); setResult(null); }}>{kind === "in" ? t("addEarned") : t("addSpent")}</Button>
          <Button variant="ghost" href="/casita/dinero">{t("myMoney")}</Button>
        </div>
      </div>
    );
  }

  const title = kind === "in" ? t("addTitleIn") : t("addTitleOut");
  const say = kind === "in" ? t("addSayIn") : t("addSayOut");

  // ---------- Review what we understood ----------
  if (result) {
    return (
      <>
        <PageHeader title={t("checkThis")} say={t("checkThisSay")} />
        <Review
          kind={kind}
          initial={result}
          onCancel={() => setResult(null)}
          onSave={save}
        />
      </>
    );
  }

  // ---------- Step 2: how to add it ----------
  const methods: { id: Method; label: string; icon: typeof Mic }[] = [
    { id: "voz", label: t("bySpeaking"), icon: Mic },
    { id: "texto", label: t("byTyping"), icon: Keyboard },
    { id: "foto", label: t("byPhoto"), icon: Camera },
  ];

  return (
    <>
      <PageHeader title={title} say={say} back="/casita/anotar" />
      <div className="mx-auto max-w-3xl">
        {kind === "in" && <ManualPick top kind={kind} onPicked={(e, w) => save(e, w, "manual")} />}
        {kind === "in" && <h2 className="mb-3 text-xl font-semibold">{lang === "en" ? "Or tell me how much you earned" : "O dime cuánto ganaste"}</h2>}
        <div className="grid grid-cols-3 gap-2 rounded-3xl bg-sand/50 p-2" role="tablist">
          {methods.map((m) => {
            const I = m.icon;
            const on = method === m.id;
            return (
              <button
                key={m.id}
                role="tab"
                aria-selected={on}
                onClick={() => { setMethod(m.id); setProblem(null); }}
                className={cx("flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl text-base font-extrabold transition md:flex-row md:gap-3 md:text-lg", on ? "bg-paper text-clay shadow-sm" : "text-ink/70")}
              >
                <I size={28} /> {m.label}
              </button>
            );
          })}
        </div>

        <Card className="mt-4 min-h-80 p-6 md:p-10">
          {busy ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
              <Loader2 size={56} className="animate-spin text-clay" />
              <p className="text-xl font-bold">{source === "foto" ? t("reading") : t("thinking")}</p>
            </div>
          ) : method === "voz" ? (
            <div className="flex min-h-64 items-center justify-center">
              <MicButton onText={(s) => understand(s, "voz")} example={kind === "in" ? t("speakExampleIn") : t("speakExampleOut")} />
            </div>
          ) : method === "texto" ? (
            <TypeBox kind={kind} onSubmit={(s) => understand(s, "texto")} />
          ) : (
            <PhotoBox kind={kind} onFile={readPhoto} />
          )}
          {problem && <p className="mt-6 rounded-2xl bg-sun-soft px-4 py-3 text-center text-lg font-bold">{problem}</p>}
        </Card>

        {kind === "out" && <ManualPick kind={kind} onPicked={(e, w) => save(e, w, "manual")} />}
      </div>
    </>
  );
}

// ---------- Typing ----------
function TypeBox({ kind, onSubmit }: { kind: Kind; onSubmit: (s: string) => void }) {
  const t = useT();
  const [text, setText] = useState("");
  return (
    <div>
      <label className="block">
        <span className="mb-2 block text-lg font-bold">{t("typeHere")}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          autoFocus
          placeholder={(kind === "in" ? t("speakExampleIn") : t("speakExampleOut")).replace(/^[^:]*:\s*/, "").replace(/[«»“”]/g, "")}
          className="w-full rounded-2xl border-2 border-sand bg-cream/40 p-4 text-xl outline-none focus:border-clay"
        />
      </label>
      <p className="mt-2 text-base text-muted">{t("typeHint")}</p>
      <Button onClick={() => onSubmit(text)} disabled={!text.trim()} className="mt-4 w-full">{t("understand")}</Button>
    </div>
  );
}

// ---------- Photo ----------
function PhotoBox({ kind, onFile }: { kind: Kind; onFile: (f: File) => void }) {
  const t = useT();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      <button onClick={() => ref.current?.click()} className="flex h-32 w-32 items-center justify-center rounded-full bg-clay text-paper shadow-[0_6px_0_#8f3a20] hover:bg-clay-dark active:scale-95" aria-label={t("takePhoto")}>
        <Camera size={56} />
      </button>
      <p className="mt-4 text-xl font-extrabold">{t("takePhoto")}</p>
      <p className="mt-3 flex max-w-md items-start gap-2 text-left text-base text-muted">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-leaf" /> {kind === "in" ? t("photoHelpIn") : t("photoHelpOut")}
      </p>
      <button onClick={() => { if (ref.current) { ref.current.removeAttribute("capture"); ref.current.click(); ref.current.setAttribute("capture", "environment"); } }} className="mt-3 inline-flex h-11 items-center gap-2 rounded-full px-4 font-bold text-clay hover:bg-sand/60">
        <ImageUp size={20} /> {lang_upload(t("takePhoto"))}
      </button>
    </div>
  );
}
const lang_upload = (s: string) => (s.startsWith("Take") ? "Choose from my photos" : "Elegir de mis fotos");

async function shrinkImage(file: File): Promise<{ data: string; type: string }> {
  const bmp = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const url = c.toDataURL("image/jpeg", 0.85);
  return { data: url.split(",")[1], type: "image/jpeg" };
}

// ---------- Review / edit what was understood ----------
function Review({ kind, initial, onCancel, onSave }: { kind: Kind; initial: Parsed; onCancel: () => void; onSave: (e: ParsedEntry[], w: ParsedWork | null) => void }) {
  const t = useT();
  const lang = useLang();
  const [entries, setEntries] = useState<ParsedEntry[]>(initial.entries);
  const [work, setWork] = useState<ParsedWork | null>(initial.work);
  const [catFor, setCatFor] = useState<number | null>(null);

  const upd = (i: number, p: Partial<ParsedEntry>) => setEntries((es) => es.map((e, j) => (j === i ? { ...e, ...p } : e)));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {initial.heard && <p className="rounded-2xl bg-paper px-4 py-3 text-lg text-muted">{t("heardYou")}: «{initial.heard}»</p>}

      {work && (
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-leaf-soft text-leaf"><Hammer size={26} /></span>
            <h2 className="text-2xl font-semibold">{t("incomeKindWork")}</h2>
          </div>
          <WorkEditor work={work} onChange={setWork} />
        </Card>
      )}

      {entries.map((e, i) => {
        const c = e.kind === "in" ? incomeCategoryById(e.category) : categoryById(e.category);
        return (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <button onClick={() => setCatFor(i)} className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl border-2 border-sand bg-cream/50 px-3 text-left hover:border-clay">
                <span className={cx("flex h-11 w-11 items-center justify-center rounded-xl", e.kind === "in" ? "bg-leaf-soft text-leaf" : "bg-clay/10 text-clay")}><Icon name={c.icon} size={24} /></span>
                <span className="text-lg font-extrabold">{pick(c.label, lang)}</span>
                <span className="ml-auto pr-1 text-sm font-bold text-clay">{t("edit")}</span>
              </button>
              <button onClick={() => setEntries((es) => es.filter((_, j) => j !== i))} aria-label={t("delete")} className="flex h-14 w-14 items-center justify-center rounded-2xl text-muted hover:bg-sand/60 hover:text-clay"><Trash2 size={22} /></button>
            </div>
            <div className="mt-4"><AmountInput value={String(e.amount)} onChange={(v) => upd(i, { amount: Number(v) || 0 })} /></div>
            <p className="mt-4 mb-2 text-lg font-bold">{t("howOften")}</p>
            <RepeatPicker value={e.repeat} onChange={(r) => upd(i, { repeat: r })} />
            {e.repeat !== "once" && <p className="mt-3 flex items-center gap-2 text-base text-leaf"><RepeatIcon size={18} /> {t("repeatsAlone")}</p>}
            {e.note && <p className="mt-3 text-base text-muted">{e.note}</p>}
          </Card>
        );
      })}

      <Disclaimer />

      <div className="flex gap-3">
        <Button variant="soft" onClick={onCancel} className="flex-1">{t("back")}</Button>
        <Button onClick={() => onSave(entries.filter((e) => e.amount > 0), work && work.pay > 0 ? work : null)} disabled={!entries.length && !work} className="flex-[2]">
          <Check size={24} /> {t("save")}
        </Button>
      </div>

      <CategorySheet
        open={catFor !== null}
        kind={kind}
        onClose={() => setCatFor(null)}
        onPick={(id) => { if (catFor !== null) upd(catFor, { category: id }); setCatFor(null); }}
      />
    </div>
  );
}

// ---------- "Or choose yourself" ----------
function ManualPick({ kind, onPicked, top }: { kind: Kind; onPicked: (e: ParsedEntry[], w: ParsedWork | null) => void; top?: boolean }) {
  const t = useT();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<string | null>(null);
  const [workMode, setWorkMode] = useState(false);
  const [amount, setAmount] = useState("");
  const [repeat, setRepeat] = useState<Repeat>("once");
  const [work, setWork] = useState<ParsedWork>({ name: "", pay: 0, every: "week", hoursPerWeek: 40, daysPerWeek: 5 });

  const reset = () => { setCat(null); setWorkMode(false); setAmount(""); setRepeat("once"); };
  const me = useMe();
  const fixedFor = (id: string) => me?.entries.find((x) => x.kind === kind && x.category === id && x.repeat !== "once");
  const quick = kind === "out" ? ["renta", "luz", "agua", "super", "metro", "telefono", "envio", "otro"] : [];

  return (
    <section className={top ? "mb-6" : "mt-6"} data-tour={top ? "salario" : undefined}>
      <h2 className="mb-3 text-xl font-semibold">{top ? (lang === "en" ? "What money came in? Tap one" : "¿Qué dinero te llegó? Toca uno") : t("orChoose")}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {kind === "in" ? (
          <>
            <button onClick={() => { reset(); setWorkMode(true); setOpen(true); }} className="col-span-2 flex min-h-24 items-center gap-4 rounded-3xl border-2 border-leaf/40 bg-paper px-5 text-left text-xl font-extrabold shadow-[0_4px_0_#d9cfbd] hover:border-leaf active:translate-y-0.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-leaf text-paper"><Hammer size={30} /></span>
              <span>{t("incomeKindWork")}<span className="block text-base font-bold text-muted">{lang === "en" ? "What you earn at your job" : "Lo que ganas en tu trabajo"}</span></span>
            </button>
            <button onClick={() => { reset(); setCat("otro_ingreso"); setOpen(true); }} className="col-span-2 flex min-h-24 items-center gap-4 rounded-3xl border-2 border-leaf/40 bg-paper px-5 text-left text-xl font-extrabold shadow-[0_4px_0_#d9cfbd] hover:border-leaf active:translate-y-0.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-leaf-soft text-leaf"><Icon name="coins" size={30} /></span>
              <span>{t("incomeKindOther")}<span className="block text-base font-bold text-muted">{lang === "en" ? "A gift, a side job, a refund…" : "Un regalo, un trabajito, un reembolso…"}</span></span>
            </button>
          </>
        ) : (
          quick.map((id) => {
            const c = categoryById(id);
            return (
              <button key={id} onClick={() => { reset(); setCat(id); const ex = fixedFor(id); setRepeat(ex?.repeat ?? c.defaultRepeat); setAmount(ex ? String(ex.amount) : ""); setOpen(true); }} className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-sand bg-paper p-2 text-center font-bold hover:border-clay">
                <Icon name={c.icon} size={26} className="text-clay" /> <span className="leading-tight">{pick(c.label, lang)}</span>
              </button>
            );
          })
        )}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={workMode ? t("incomeKindWork") : cat ? pick((kind === "in" ? incomeCategoryById(cat) : categoryById(cat)).label, lang) : ""}>
        {workMode ? (
          <>
            <WorkEditor work={work} onChange={setWork} />
            <Button onClick={() => { setOpen(false); onPicked([], work); }} disabled={!work.pay} className="mt-6 w-full">{t("save")}</Button>
          </>
        ) : (
          <>
            {kind === "in" && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {INCOME_CATEGORIES.filter((c) => c.id !== "trabajo").map((c) => (
                  <button key={c.id} onClick={() => setCat(c.id)} className={cx("flex min-h-14 items-center gap-2 rounded-2xl border-2 px-3 font-bold", cat === c.id ? "border-leaf bg-leaf-soft" : "border-sand bg-paper")}>
                    <Icon name={c.icon} size={20} /> {pick(c.label, lang)}
                  </button>
                ))}
              </div>
            )}
            {cat && fixedFor(cat) && <p className="mb-4 rounded-2xl bg-sun-soft px-4 py-3 text-base">{t("alreadyHave")}</p>}
            <AmountInput value={amount} onChange={setAmount} autoFocus />
            <p className="mt-4 mb-2 text-lg font-bold">{t("howOften")}</p>
            <RepeatPicker value={repeat} onChange={setRepeat} />
            {repeat !== "once" && <p className="mt-3 flex items-center gap-2 text-base text-leaf"><RepeatIcon size={18} /> {t("repeatsAlone")}</p>}
            <Button
              onClick={() => { setOpen(false); onPicked([{ kind, category: cat!, amount: Number(amount), repeat, note: "" }], null); }}
              disabled={!Number(amount) || !cat}
              className="mt-6 w-full"
            >
              {t("save")}
            </Button>
          </>
        )}
      </Sheet>
    </section>
  );
}
