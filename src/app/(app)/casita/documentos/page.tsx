"use client";
import { useRef, useState } from "react";
import { Camera, ImagePlus, FileText, X, Plus, Loader2, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Phone, Building2, Landmark, Scale, Mail, Wallet, RotateCcw } from "lucide-react";
import { Button, Card, ListenButton, PageHeader, cx } from "@/components/ui";
import { useLang, useStore } from "@/lib/store";
import { shrinkImage, fileToBase64 } from "@/lib/image";
import { speak } from "@/lib/voice";
import { playSaved } from "@/lib/sound";
import { money } from "@/lib/money";
import type { Lang } from "@/lib/i18n";

const L = (lang: Lang, es: string, en: string) => (lang === "en" ? en : es);

type Page = { id: string; kind: "image" | "pdf"; data: string; mediaType: string; preview?: string; name: string };
type Result = {
  title: string; from: string; summary: string;
  keyPoints: { label: string; value: string }[];
  whatToDo: string[];
  risk: "ok" | "caution" | "scam";
  riskReasons: string[];
  help: string[];
  money: { amount: number; due: string; what: string } | null;
};

const MAX_PAGES = 4;
const MAX_PDF = 3 * 1024 * 1024;

export default function ExplainPaper() {
  const lang = useLang();
  const addEntries = useStore((s) => s.addEntries);
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [savedMoney, setSavedMoney] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const intro = L(
    lang,
    "Explicar un papel. Toma una foto, sube una foto o sube un documento de una carta, factura o contrato, y te lo explicamos con palabras sencillas. Si parece estafa, te avisamos. No guardamos tu papel.",
    "Explain a paper. Take a photo, upload a photo or upload a document of a letter, bill or contract, and we'll explain it in simple words. If it looks like a scam, we'll warn you. We don't keep your paper.",
  );

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setProblem(null);
    const next: Page[] = [];
    for (const f of Array.from(list)) {
      if (pages.length + next.length >= MAX_PAGES) { setProblem(L(lang, `Puedes subir hasta ${MAX_PAGES} páginas.`, `You can upload up to ${MAX_PAGES} pages.`)); break; }
      const id = Math.random().toString(36).slice(2);
      if (f.type === "application/pdf") {
        if (f.size > MAX_PDF) { setProblem(L(lang, "Ese documento es muy grande. Toma fotos de las páginas importantes.", "That document is too big. Take photos of the important pages.")); continue; }
        next.push({ id, kind: "pdf", data: await fileToBase64(f), mediaType: "application/pdf", name: f.name });
      } else if (f.type.startsWith("image/")) {
        try {
          const img = await shrinkImage(f);
          next.push({ id, kind: "image", data: img.data, mediaType: img.type, preview: img.preview, name: f.name });
        } catch {
          setProblem(L(lang, "No pudimos abrir esa foto. Intenta con otra.", "We couldn't open that photo. Try another one."));
        }
      } else {
        setProblem(L(lang, "Sube una foto o un documento PDF.", "Upload a photo or a PDF document."));
      }
    }
    setPages((p) => [...p, ...next]);
  }

  async function explain() {
    setBusy(true); setProblem(null); setResult(null); setSavedMoney(false);
    speak(L(lang, "Estoy leyendo tu papel. Espera un momento.", "I'm reading your paper. One moment."), lang);
    try {
      const r = await fetch("/api/explicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, parts: pages.map((p) => ({ type: p.kind, data: p.data, mediaType: p.mediaType })) }),
      });
      if (r.status === 501) { setProblem(L(lang, "Para leer papeles falta conectar la inteligencia artificial. Pronto estará lista.", "Reading papers needs the AI connection. It will be ready soon.")); return; }
      if (r.status === 413) { setProblem(L(lang, "Las fotos son muy pesadas. Sube menos páginas.", "The photos are too large. Upload fewer pages.")); return; }
      const j = (await r.json()) as Result & { error?: string };
      if (j.error) { setProblem(L(lang, "No pude leer tu papel. Intenta con una foto más clara y con buena luz.", "I couldn't read your paper. Try a clearer photo with good light.")); return; }
      setResult(j);
      const riskWord = j.risk === "scam" ? L(lang, "Cuidado: esto podría ser una estafa.", "Careful: this could be a scam.") : j.risk === "caution" ? L(lang, "Ten cuidado con este papel.", "Be careful with this paper.") : "";
      speak(`${j.title}. ${riskWord} ${j.summary}`, lang);
    } catch {
      setProblem(L(lang, "No hay conexión. Intenta otra vez.", "No connection. Try again."));
    } finally {
      setBusy(false);
    }
  }

  const reset = () => { setPages([]); setResult(null); setProblem(null); setSavedMoney(false); };

  return (
    <>
      <PageHeader title={L(lang, "Explicar un papel", "Explain a paper")} sub={L(lang, "Cartas, facturas, contratos y avisos", "Letters, bills, contracts and notices")} say={intro} back="/casita" />

      {!result && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr] lg:gap-6">
          <Card className="min-w-0">
            {/* hidden pickers */}
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
            <input ref={galRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
            <input ref={docRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />

            {busy ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
                <Loader2 size={60} className="animate-spin text-clay" />
                <p className="text-2xl font-bold">{L(lang, "Leyendo tu papel…", "Reading your paper…")}</p>
                <p className="text-lg text-muted">{L(lang, "Esto tarda unos segundos.", "This takes a few seconds.")}</p>
              </div>
            ) : pages.length === 0 ? (
              <>
                <h2 className="text-2xl font-semibold">{L(lang, "¿Cómo nos muestras tu papel?", "How will you show us your paper?")}</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <BigChoice icon={<Camera size={40} />} label={L(lang, "Tomar foto", "Take a photo")} sub={L(lang, "Con la cámara", "With the camera")} onClick={() => camRef.current?.click()} primary />
                  <BigChoice icon={<ImagePlus size={40} />} label={L(lang, "Subir foto", "Upload a photo")} sub={L(lang, "De tus fotos", "From your photos")} onClick={() => galRef.current?.click()} />
                  <BigChoice icon={<FileText size={40} />} label={L(lang, "Subir documento", "Upload a document")} sub="PDF" onClick={() => docRef.current?.click()} />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">{L(lang, "Tu papel", "Your paper")} · {pages.length} {pages.length === 1 ? L(lang, "página", "page") : L(lang, "páginas", "pages")}</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {pages.map((p, i) => (
                    <div key={p.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl border-2 border-sand bg-cream">
                      {p.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.preview} alt={`${L(lang, "Página", "Page")} ${i + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center"><FileText size={36} className="text-clay" /><span className="line-clamp-2 text-sm font-bold break-all">{p.name}</span></div>
                      )}
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/80 px-2 text-sm font-bold text-paper">{i + 1}</span>
                      <button onClick={() => setPages((ps) => ps.filter((x) => x.id !== p.id))} aria-label={L(lang, "Quitar", "Remove")} className="absolute top-1.5 right-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-paper/95 shadow"><X size={20} /></button>
                    </div>
                  ))}
                  {pages.length < MAX_PAGES && (
                    <button onClick={() => (pages.some((p) => p.kind === "image") ? camRef : docRef).current?.click()} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sand-dark text-center font-bold text-muted hover:border-clay hover:text-clay">
                      <Plus size={32} /> {L(lang, "Otra página", "Another page")}
                    </button>
                  )}
                </div>
                {pages.length < MAX_PAGES && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => camRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full bg-sand/60 px-4 font-bold"><Camera size={18} /> {L(lang, "Foto", "Photo")}</button>
                    <button onClick={() => galRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full bg-sand/60 px-4 font-bold"><ImagePlus size={18} /> {L(lang, "De mis fotos", "From my photos")}</button>
                    <button onClick={() => docRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full bg-sand/60 px-4 font-bold"><FileText size={18} /> PDF</button>
                  </div>
                )}
                <Button onClick={explain} className="mt-6 min-h-16 w-full text-xl">{L(lang, "Explícame este papel", "Explain this paper")}</Button>
                <button onClick={reset} className="mt-2 h-11 w-full font-bold text-muted">{L(lang, "Empezar de nuevo", "Start over")}</button>
              </>
            )}
            {problem && <p className="mt-5 rounded-2xl bg-sun-soft px-4 py-3 text-center text-lg font-bold">{problem}</p>}
          </Card>

          <div className="min-w-0 space-y-4">
            <div className="rounded-3xl border-2 border-leaf bg-leaf-soft/60 p-5">
              <h3 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck size={22} className="text-leaf" /> {L(lang, "Tu papel está seguro", "Your paper is safe")}</h3>
              <ul className="mt-2 space-y-2 text-lg">
                <li>{L(lang, "No guardamos tu papel: solo lo leemos para explicártelo.", "We don't keep your paper: we only read it to explain it.")}</li>
                <li>{L(lang, "Si quieres, tapa con tu dedo tu número de Seguro Social o de cuenta antes de tomar la foto.", "If you want, cover your Social Security or account number with your finger before taking the photo.")}</li>
              </ul>
            </div>
            <Card>
              <h3 className="text-xl font-semibold">{L(lang, "Para una buena foto", "For a good photo")}</h3>
              <ul className="mt-2 space-y-2 text-lg">
                <li>☀️ {L(lang, "Con buena luz, sin sombras", "Good light, no shadows")}</li>
                <li>📄 {L(lang, "Que se vea toda la hoja", "Show the whole page")}</li>
                <li>✋ {L(lang, "Sin moverte", "Hold still")}</li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {result && <ResultView r={result} lang={lang} onReset={reset} saved={savedMoney} onSaveMoney={() => {
        if (!result.money) return;
        addEntries([{ kind: "out", category: "otro", amount: result.money.amount, repeat: "once", note: result.money.what || result.title, date: new Date().toISOString(), source: "foto" }]);
        playSaved(); setSavedMoney(true);
      }} />}
    </>
  );
}

function BigChoice({ icon, label, sub, onClick, primary }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} className={cx("flex min-h-40 flex-col items-center justify-center gap-3 rounded-3xl border-2 p-4 text-center transition active:scale-[0.98]", primary ? "border-clay bg-clay text-paper shadow-[0_5px_0_#8f3a20]" : "border-sand bg-paper hover:border-clay")}>
      {icon}
      <span className="text-xl font-extrabold">{label}</span>
      <span className={cx("text-base", primary ? "text-paper/80" : "text-muted")}>{sub}</span>
    </button>
  );
}

const HELPERS = (lang: Lang): Record<string, { icon: React.ReactNode; title: string; sub: string; href?: string; cta?: string }> => ({
  consulado: {
    icon: <Building2 size={26} />,
    title: L(lang, "Consulado de México en Nueva York", "Mexican Consulate in New York"),
    sub: L(lang, "Documentos, protección o cualquier duda. 27 E 39th St, Manhattan.", "Documents, protection or any question. 27 E 39th St, Manhattan."),
    href: "tel:+12122176400",
    cta: "(212) 217-6400",
  },
  "311": {
    icon: <Landmark size={26} />,
    title: L(lang, "Ciudad de Nueva York · 311", "New York City · 311"),
    sub: L(lang, "Problemas con tu casero, fraudes o ayuda legal gratis. Puedes pedir intérprete.", "Landlord problems, fraud or free legal help. You can ask for an interpreter."),
    href: "tel:311",
    cta: L(lang, "Llamar al 311", "Call 311"),
  },
  banco: {
    icon: <Wallet size={26} />,
    title: L(lang, "Tu banco", "Your bank"),
    sub: L(lang, "Llama al número que viene atrás de tu tarjeta. No uses el número del papel si se ve raro.", "Call the number on the back of your card. Don't use the number on the paper if it looks odd."),
  },
  abogado: {
    icon: <Scale size={26} />,
    title: L(lang, "Un abogado de verdad", "A real lawyer"),
    sub: L(lang, "Para cortes, inmigración o contratos. Ojo: en EE. UU. un “notario” no es abogado. Pide ayuda gratis al Consulado o al 311.", "For court, immigration or contracts. Note: in the US a “notario” is not a lawyer. Ask the Consulate or 311 for free help."),
  },
  remitente: {
    icon: <Mail size={26} />,
    title: L(lang, "La empresa que te lo mandó", "The company that sent it"),
    sub: L(lang, "Llama al número de su página oficial, no al del papel si algo se ve raro.", "Call the number on their official website, not the one on the paper if something looks odd."),
  },
});

function ResultView({ r, lang, onReset, onSaveMoney, saved }: { r: Result; lang: Lang; onReset: () => void; onSaveMoney: () => void; saved: boolean }) {
  const helpers = HELPERS(lang);
  const helpIds = Array.from(new Set([...(r.risk !== "ok" ? ["consulado"] : []), ...r.help, "consulado"])).filter((h) => helpers[h]);
  const risk = {
    ok: { cls: "border-leaf bg-leaf-soft", icon: <CheckCircle2 size={30} className="text-leaf" />, title: L(lang, "Parece un papel normal", "Looks like a normal paper") },
    caution: { cls: "border-sun bg-sun-soft", icon: <AlertTriangle size={30} className="text-warn" />, title: L(lang, "Ten cuidado con este papel", "Be careful with this paper") },
    scam: { cls: "border-clay bg-clay/10", icon: <ShieldAlert size={30} className="text-clay" />, title: L(lang, "Esto podría ser una estafa", "This could be a scam") },
  }[r.risk];
  const say = `${r.title}. ${risk.title}. ${r.riskReasons.join(". ")} ${r.summary} ${r.whatToDo.length ? L(lang, "Qué hacer:", "What to do:") + " " + r.whatToDo.join(". ") : ""}`;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr] lg:gap-6">
      <div className="min-w-0 space-y-5">
        <div className={cx("rounded-3xl border-2 p-5 md:p-6", risk.cls)}>
          <div className="flex items-start gap-3">
            {risk.icon}
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-semibold">{risk.title}</h2>
              {r.riskReasons.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-lg">{r.riskReasons.map((x) => <li key={x}>{x}</li>)}</ul>}
              {r.risk !== "ok" && <p className="mt-3 text-lg font-bold">{L(lang, "Antes de pagar o firmar, consúltalo con alguien de confianza o con un profesional.", "Before paying or signing, check with someone you trust or a professional.")}</p>}
            </div>
          </div>
        </div>

        <Card className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-3xl leading-tight font-semibold">{r.title}</h2>
              {r.from && <p className="mt-1 text-lg text-muted">{L(lang, "De:", "From:")} {r.from}</p>}
            </div>
            <ListenButton text={say} />
          </div>
          <p className="mt-4 text-xl leading-relaxed">{r.summary}</p>
          {r.keyPoints.length > 0 && (
            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {r.keyPoints.map((k) => (
                <div key={k.label + k.value} className="rounded-2xl bg-cream p-4">
                  <dt className="text-base font-bold text-muted">{k.label}</dt>
                  <dd className="text-xl font-extrabold">{k.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {r.money && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-ink p-4 text-paper">
              <span className="text-lg">{L(lang, "Te piden pagar", "They ask you to pay")} <b className="font-serif text-2xl">{money(r.money.amount, lang, true)}</b>{r.money.due ? ` · ${r.money.due}` : ""}</span>
              {r.risk !== "scam" && (saved
                ? <span className="rounded-xl bg-leaf px-3 py-2 font-bold">{L(lang, "Anotado como gasto", "Added as an expense")}</span>
                : <button onClick={onSaveMoney} className="h-11 rounded-xl bg-paper px-4 font-bold text-ink">{L(lang, "Anotar como gasto", "Add as an expense")}</button>)}
            </div>
          )}
        </Card>

        {r.whatToDo.length > 0 && (
          <Card>
            <h3 className="text-2xl font-semibold">{L(lang, "¿Qué hago?", "What do I do?")}</h3>
            <ol className="mt-3 space-y-3">
              {r.whatToDo.map((s, i) => (
                <li key={s} className="flex items-start gap-3 text-lg">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay font-bold text-paper">{i + 1}</span>
                  <span className="pt-1">{s}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}
        <p className="rounded-2xl bg-sun-soft/70 px-4 py-3 text-base">⚠️ {L(lang, "La inteligencia artificial puede equivocarse y esto no es consejo legal. Si el papel es importante, confírmalo con un profesional.", "AI can make mistakes and this isn't legal advice. If the paper is important, confirm with a professional.")}</p>
        <Button variant="soft" onClick={onReset} className="w-full"><RotateCcw size={20} /> {L(lang, "Explicar otro papel", "Explain another paper")}</Button>
      </div>

      <div className="min-w-0 space-y-3">
        <h3 className="text-2xl font-semibold">{L(lang, "¿Quién te puede ayudar?", "Who can help you?")}</h3>
        <p className="text-lg text-muted">{L(lang, "Elige la opción que prefieras.", "Choose the option you prefer.")}</p>
        {helpIds.map((id) => {
          const h = helpers[id];
          return (
            <div key={id} className="rounded-3xl border-2 border-sand bg-paper p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-clay/10 text-clay">{h.icon}</span>
                <div className="min-w-0">
                  <p className="text-lg font-extrabold">{h.title}</p>
                  <p className="text-base text-muted">{h.sub}</p>
                </div>
              </div>
              {h.href && (
                <a href={h.href} className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl bg-leaf font-bold text-paper"><Phone size={18} /> {h.cta}</a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
