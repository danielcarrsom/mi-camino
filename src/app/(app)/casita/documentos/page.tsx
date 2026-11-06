"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, FileText, X, Plus, Loader2, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Phone, Building2, Landmark, Scale, Mail, Wallet, RotateCcw } from "lucide-react";
import { Button, Card, ListenButton, PageHeader, cx } from "@/components/ui";
import { useLang, useRegion, useStore } from "@/lib/store";
import type { Region } from "@/lib/taxes";
import { shrinkImage, fileToBase64 } from "@/lib/image";
import { speak } from "@/lib/voice";
import { playSaved } from "@/lib/sound";
import { money } from "@/lib/money";
import type { Lang } from "@/lib/i18n";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/casita-documentos";


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
  const region = useRegion();
  const addEntries = useStore((s) => s.addEntries);
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [savedMoney, setSavedMoney] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [aiOn, setAiOn] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/estado").then((r) => r.json()).then((j) => setAiOn(!!j.ai)).catch(() => setAiOn(null));
  }, []);

  const intro = tx(lang, TXT.explicarUnPapelTomaUna);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setProblem(null);
    const next: Page[] = [];
    for (const f of Array.from(list)) {
      if (pages.length + next.length >= MAX_PAGES) { setProblem(txf(lang, TXT.puedesSubirHastaPaginas, [MAX_PAGES])); break; }
      const id = Math.random().toString(36).slice(2);
      if (f.type === "application/pdf") {
        if (f.size > MAX_PDF) { setProblem(tx(lang, TXT.eseDocumentoEsMuyGrande)); continue; }
        next.push({ id, kind: "pdf", data: await fileToBase64(f), mediaType: "application/pdf", name: f.name });
      } else if (f.type.startsWith("image/")) {
        try {
          const img = await shrinkImage(f);
          next.push({ id, kind: "image", data: img.data, mediaType: img.type, preview: img.preview, name: f.name });
        } catch {
          setProblem(tx(lang, TXT.noPudimosAbrirEsaFoto));
        }
      } else {
        setProblem(tx(lang, TXT.subeUnaFotoOUn));
      }
    }
    setPages((p) => [...p, ...next]);
  }

  async function explain() {
    setBusy(true); setProblem(null); setResult(null); setSavedMoney(false);
    speak(tx(lang, TXT.estoyLeyendoTuPapelEspera), lang);
    try {
      const r = await fetch("/api/explicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, country: region.country, parts: pages.map((p) => ({ type: p.kind, data: p.data, mediaType: p.mediaType })) }),
      });
      if (r.status === 501) { setAiOn(false); return; }
      if (r.status === 413) { setProblem(tx(lang, TXT.lasFotosSonMuyPesadas)); return; }
      const j = (await r.json()) as Result & { error?: string };
      if (j.error) { setProblem(tx(lang, TXT.noPudeLeerTuPapel)); return; }
      setResult(j);
      const riskWord = j.risk === "scam" ? tx(lang, TXT.cuidadoEstoPodriaSerUna) : j.risk === "caution" ? tx(lang, TXT.tenCuidadoConEstePapel) : "";
      speak(`${j.title}. ${riskWord} ${j.summary}`, lang);
    } catch {
      setProblem(tx(lang, TXT.noHayConexionIntentaOtra));
    } finally {
      setBusy(false);
    }
  }

  const reset = () => { setPages([]); setResult(null); setProblem(null); setSavedMoney(false); };

  return (
    <>
      <PageHeader title={tx(lang, TXT.explicarUnPapel)} sub={tx(lang, TXT.cartasFacturasContratosYAvisos)} say={intro} back="/casita" />

      {!result && aiOn === false && <ScamChecklist lang={lang} />}

      {!result && aiOn !== false && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr] lg:gap-6">
          <Card className="min-w-0">
            {/* hidden pickers */}
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
            <input ref={galRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
            <input ref={docRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />

            {busy ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
                <Loader2 size={60} className="animate-spin text-clay" />
                <p className="text-2xl font-bold">{tx(lang, TXT.leyendoTuPapel)}</p>
                <p className="text-lg text-muted">{tx(lang, TXT.estoTardaUnosSegundos)}</p>
              </div>
            ) : pages.length === 0 ? (
              <>
                <h2 className="text-2xl font-semibold">{tx(lang, TXT.comoNosMuestrasTuPapel)}</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <BigChoice icon={<Camera size={40} />} label={tx(lang, TXT.tomarFoto)} sub={tx(lang, TXT.conLaCamara)} onClick={() => camRef.current?.click()} primary />
                  <BigChoice icon={<ImagePlus size={40} />} label={tx(lang, TXT.subirFoto)} sub={tx(lang, TXT.deTusFotos)} onClick={() => galRef.current?.click()} />
                  <BigChoice icon={<FileText size={40} />} label={tx(lang, TXT.subirDocumento)} sub="PDF" onClick={() => docRef.current?.click()} />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">{tx(lang, TXT.tuPapel)} · {pages.length} {pages.length === 1 ? tx(lang, TXT.pagina) : tx(lang, TXT.paginas)}</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {pages.map((p, i) => (
                    <div key={p.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl border-2 border-sand bg-cream">
                      {p.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.preview} alt={`${tx(lang, TXT.pagina2)} ${i + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center"><FileText size={36} className="text-clay" /><span className="line-clamp-2 text-sm font-bold break-all">{p.name}</span></div>
                      )}
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/80 px-2 text-sm font-bold text-paper">{i + 1}</span>
                      <button onClick={() => setPages((ps) => ps.filter((x) => x.id !== p.id))} aria-label={tx(lang, TXT.quitar)} className="absolute top-1.5 right-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-paper/95 shadow"><X size={20} /></button>
                    </div>
                  ))}
                  {pages.length < MAX_PAGES && (
                    <button onClick={() => (pages.some((p) => p.kind === "image") ? camRef : docRef).current?.click()} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sand-dark text-center font-bold text-muted hover:border-clay hover:text-clay">
                      <Plus size={32} /> {tx(lang, TXT.otraPagina)}
                    </button>
                  )}
                </div>
                {pages.length < MAX_PAGES && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => camRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full bg-sand/60 px-4 font-bold"><Camera size={18} /> {tx(lang, TXT.foto)}</button>
                    <button onClick={() => galRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full bg-sand/60 px-4 font-bold"><ImagePlus size={18} /> {tx(lang, TXT.deMisFotos)}</button>
                    <button onClick={() => docRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full bg-sand/60 px-4 font-bold"><FileText size={18} /> PDF</button>
                  </div>
                )}
                <Button onClick={explain} className="mt-6 min-h-16 w-full text-xl">{tx(lang, TXT.explicameEstePapel)}</Button>
                <button onClick={reset} className="mt-2 h-11 w-full font-bold text-muted">{tx(lang, TXT.empezarDeNuevo)}</button>
              </>
            )}
            {problem && <p className="mt-5 rounded-2xl bg-sun-soft px-4 py-3 text-center text-lg font-bold">{problem}</p>}
          </Card>

          <div className="min-w-0 space-y-4">
            <div className="rounded-3xl border-2 border-leaf bg-leaf-soft/60 p-5">
              <h3 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck size={22} className="text-leaf" /> {tx(lang, TXT.tuPapelEstaSeguro)}</h3>
              <ul className="mt-2 space-y-2 text-lg">
                <li>{tx(lang, TXT.noGuardamosTuPapelSolo)}</li>
                <li>{tx(lang, TXT.siQuieresTapaConTu)}</li>
              </ul>
            </div>
            <Card>
              <h3 className="text-xl font-semibold">{tx(lang, TXT.paraUnaBuenaFoto)}</h3>
              <ul className="mt-2 space-y-2 text-lg">
                <li>☀️ {tx(lang, TXT.conBuenaLuzSinSombras)}</li>
                <li>📄 {tx(lang, TXT.queSeVeaTodaLa)}</li>
                <li>✋ {tx(lang, TXT.sinMoverte)}</li>
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

type Helper = { icon: React.ReactNode; title: string; sub: string; href?: string; cta?: string };

/** Who can help, depending on where the person lives. The first id is always shown. */
function helpersFor(lang: Lang, region: Region): { main: string; list: Record<string, Helper> } {
  const mx = region.country === "mx";
  const nyc = region.country === "us" && region.state === "NY";
  const list: Record<string, Helper> = {
    banco: {
      icon: <Wallet size={26} />,
      title: tx(lang, TXT.tuBanco),
      sub: tx(lang, TXT.llamaAlNumeroQueViene),
    },
    remitente: {
      icon: <Mail size={26} />,
      title: tx(lang, TXT.laEmpresaQueTeLo),
      sub: tx(lang, TXT.llamaAlNumeroDeSu),
    },
  };
  if (mx) {
    list.condusef = { icon: <Building2 size={26} />, title: "Condusef", sub: tx(lang, TXT.problemasConBancosPrestamosTarjetas), href: "tel:+525553400999", cta: "55 5340 0999" };
    list.profeco = { icon: <Landmark size={26} />, title: "Profeco", sub: tx(lang, TXT.quejasContraTiendasServiciosO), href: "tel:+528004688722", cta: "800 468 8722" };
    list.sat = { icon: <Landmark size={26} />, title: "SAT · MarcaSAT", sub: tx(lang, TXT.siElPapelDiceQue), href: "tel:+525562722728", cta: "55 627 22 728" };
    list.abogado = { icon: <Scale size={26} />, title: tx(lang, TXT.unAbogadoDeVerdad), sub: tx(lang, TXT.paraJuiciosContratosODeudas) };
    return { main: "condusef", list };
  }
  list.consulado = nyc
    ? { icon: <Building2 size={26} />, title: tx(lang, TXT.consuladoDeMexicoEnNueva), sub: tx(lang, TXT.documentosProteccionOCualquierDuda), href: "tel:+12122176400", cta: "(212) 217-6400" }
    : { icon: <Building2 size={26} />, title: tx(lang, TXT.tuConsuladoDeMexico), sub: tx(lang, TXT.documentosProteccionOCualquierDuda2), href: "https://directorio.sre.gob.mx", cta: tx(lang, TXT.buscarMiConsulado) };
  list.ciudad = region.nyc
    ? { icon: <Landmark size={26} />, title: tx(lang, TXT.ciudadDeNuevaYork311), sub: tx(lang, TXT.problemasConTuCaseroFraudes), href: "tel:311", cta: tx(lang, TXT.llamarAl311) }
    : { icon: <Landmark size={26} />, title: tx(lang, TXT.linea211), sub: tx(lang, TXT.teConectaConAyudaLocal), href: "tel:211", cta: tx(lang, TXT.llamarAl211) };
  list.abogado = { icon: <Scale size={26} />, title: tx(lang, TXT.unAbogadoDeVerdad), sub: tx(lang, TXT.paraCortesInmigracionOContratos) };
  return { main: "consulado", list };
}

function ResultView({ r, lang, onReset, onSaveMoney, saved }: { r: Result; lang: Lang; onReset: () => void; onSaveMoney: () => void; saved: boolean }) {
  const region = useRegion();
  const { main, list: helpers } = helpersFor(lang, region);
  // The AI says "311" for local city help; elsewhere that's 211
  const asked = r.help.map((h) => (h === "311" ? "ciudad" : h));
  const helpIds = Array.from(new Set([...(r.risk !== "ok" ? [main] : []), ...asked, main])).filter((h) => helpers[h]);
  const risk = {
    ok: { cls: "border-leaf bg-leaf-soft", icon: <CheckCircle2 size={30} className="text-leaf" />, title: tx(lang, TXT.pareceUnPapelNormal) },
    caution: { cls: "border-sun bg-sun-soft", icon: <AlertTriangle size={30} className="text-warn" />, title: tx(lang, TXT.tenCuidadoConEstePapel2) },
    scam: { cls: "border-clay bg-clay/10", icon: <ShieldAlert size={30} className="text-clay" />, title: tx(lang, TXT.estoPodriaSerUnaEstafa) },
  }[r.risk];
  const say = `${r.title}. ${risk.title}. ${r.riskReasons.join(". ")} ${r.summary} ${r.whatToDo.length ? tx(lang, TXT.queHacer) + " " + r.whatToDo.join(". ") : ""}`;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr] lg:gap-6">
      <div className="min-w-0 space-y-5">
        <div className={cx("rounded-3xl border-2 p-5 md:p-6", risk.cls)}>
          <div className="flex items-start gap-3">
            {risk.icon}
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-semibold">{risk.title}</h2>
              {r.riskReasons.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-lg">{r.riskReasons.map((x) => <li key={x}>{x}</li>)}</ul>}
              {r.risk !== "ok" && <p className="mt-3 text-lg font-bold">{tx(lang, TXT.antesDePagarOFirmar)}</p>}
            </div>
          </div>
        </div>

        <Card className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-3xl leading-tight font-semibold">{r.title}</h2>
              {r.from && <p className="mt-1 text-lg text-muted">{tx(lang, TXT.de)} {r.from}</p>}
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
              <span className="text-lg">{tx(lang, TXT.tePidenPagar)} <b className="font-serif text-2xl">{money(r.money.amount, lang, true)}</b>{r.money.due ? ` · ${r.money.due}` : ""}</span>
              {r.risk !== "scam" && (saved
                ? <span className="rounded-xl bg-leaf px-3 py-2 font-bold">{tx(lang, TXT.anotadoComoGasto)}</span>
                : <button onClick={onSaveMoney} className="h-11 rounded-xl bg-paper px-4 font-bold text-ink">{tx(lang, TXT.anotarComoGasto)}</button>)}
            </div>
          )}
        </Card>

        {r.whatToDo.length > 0 && (
          <Card>
            <h3 className="text-2xl font-semibold">{tx(lang, TXT.queHago)}</h3>
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
        <p className="rounded-2xl bg-sun-soft/70 px-4 py-3 text-base">⚠️ {tx(lang, TXT.laInteligenciaArtificialPuedeEquivocarse)}</p>
        <Button variant="soft" onClick={onReset} className="w-full"><RotateCcw size={20} /> {tx(lang, TXT.explicarOtroPapel)}</Button>
      </div>

      <div className="min-w-0 space-y-3">
        <h3 className="text-2xl font-semibold">{tx(lang, TXT.quienTePuedeAyudar)}</h3>
        <p className="text-lg text-muted">{tx(lang, TXT.eligeLaOpcionQuePrefieras)}</p>
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

/** While the AI reader isn't switched on, the page still helps: five questions anyone can check. */
function ScamChecklist({ lang }: { lang: Lang }) {
  const region = useRegion();
  const mx = region.country === "mx";
  const { main, list } = helpersFor(lang, region);
  const first = list[main], second = mx ? list.profeco : list.ciudad;
  const qs = [
    mx
      ? tx(lang, TXT.tePidenDepositarEnOxxo)
      : tx(lang, TXT.tePidenPagarConTarjetas),
    mx
      ? tx(lang, TXT.teAmenazanConArrestarteDemandarte)
      : tx(lang, TXT.teAmenazanConArrestarteDeportarte),
    tx(lang, TXT.teDanMuyPocoTiempo),
    tx(lang, TXT.tePidenQueNoLe),
    mx
      ? tx(lang, TXT.tePidenTuNipUn)
      : tx(lang, TXT.tePidenTuClaveTu),
  ];
  const [yes, setYes] = useState<boolean[]>(qs.map(() => false));
  const [done, setDone] = useState(false);
  const any = yes.some(Boolean);
  const intro = tx(lang, TXT.muyProntoTeExplicaremosTus);
  return (
    <Card className="mb-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><ShieldAlert size={26} className="text-clay" /> {tx(lang, TXT.esEstafaRevisaloEn1)}</h2>
        <ListenButton compact text={`${intro} ${qs.join(" ")}`} />
      </div>
      <p className="mt-2 text-lg text-muted">{intro}</p>
      <div className="mt-4 space-y-2">
        {qs.map((q, i) => (
          <button key={i} onClick={() => { setYes(yes.map((v, j) => (j === i ? !v : v))); setDone(false); }} aria-pressed={yes[i]}
            className={cx("flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold", yes[i] ? "border-clay bg-clay/10" : "border-sand bg-paper")}>
            <span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2", yes[i] ? "border-clay bg-clay text-paper" : "border-sand-dark")}>{yes[i] && <CheckCircle2 size={18} />}</span>
            {q}
          </button>
        ))}
      </div>
      <Button className="mt-4 w-full" variant="dark" onClick={() => { setDone(true); speak(any ? tx(lang, TXT.cuidadoPuedeSerUnaEstafa) : tx(lang, TXT.noVemosSenalesClarasDe), lang); }}>
        {tx(lang, TXT.verResultado)}
      </Button>
      {done && (
        <div className={cx("mt-4 rounded-2xl p-4", any ? "bg-clay text-paper" : "bg-leaf-soft")}>
          <p className="text-xl font-extrabold">{any ? tx(lang, TXT.cuidadoPuedeSerUnaEstafa2) : tx(lang, TXT.noVemosSenalesClarasDe2)}</p>
          <p className="mt-1 text-lg">{any ? tx(lang, TXT.noPaguesNadaNiDes) : tx(lang, TXT.aunAsiSiNoEntiendes)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {first.href && <a href={first.href} className={cx("inline-flex h-12 items-center gap-2 rounded-2xl px-4 font-extrabold", any ? "bg-paper text-clay" : "bg-leaf text-paper")}><Phone size={18} /> {first.title} · {first.cta}</a>}
            {second?.href && <a href={second.href} className={cx("inline-flex h-12 items-center gap-2 rounded-2xl border-2 px-4 font-extrabold", any ? "border-paper" : "border-leaf text-leaf")}><Phone size={18} /> {second.cta}</a>}
          </div>
        </div>
      )}
    </Card>
  );
}
