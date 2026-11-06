"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Clock, ExternalLink, Gamepad2, HeartHandshake, Phone, RotateCcw, Star, Trophy, X } from "lucide-react";
import { Button, Card, ListenButton, PageHeader, cx } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useLang, useMe, useRegion, useStore } from "@/lib/store";
import { pick } from "@/lib/catalog";
import { forRegion, type Game, type Lesson, type NeedItem, type Resource } from "@/lib/learn";
import { speak, stopSpeaking } from "@/lib/voice";
import { playBrick, playGoal, playSaved } from "@/lib/sound";
import type { Lang } from "@/lib/i18n";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/LearnHub";

const L = (lang: Lang, es: string, en: string) => (lang === "en" ? en : es);

/** Dark or light text, whichever reads well on this background color. */
function textOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? "#1f2b27" : "#fffbf3";
}
type Tab = "juegos" | "lecciones" | "ayuda";

export type LearnContent = {
  title: [string, string]; sub: [string, string]; say: [string, string];
  games: Game[]; lessons: Lesson[]; needs: NeedItem[]; resources: Resource[];
  soon?: { title: [string, string]; text: [string, string] };
};

export function LearnHub({ c }: { c: LearnContent }) {
  const lang = useLang();
  const region = useRegion();
  // Only what applies where the person lives (New York City, another state, or México)
  const GAMES = useMemo(() => forRegion(c.games, region), [c.games, region]);
  const LESSONS = useMemo(() => forRegion(c.lessons, region), [c.lessons, region]);
  const RESOURCES = useMemo(() => forRegion(c.resources, region), [c.resources, region]);
  const me = useMe();
  // Links like /aprender#ayuda open the help tab (this screen only renders in the browser)
  const [tab, setTab] = useState<Tab>(() => (typeof window !== "undefined" && window.location.hash === "#ayuda" ? "ayuda" : "juegos"));
  const [game, setGame] = useState<Game | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);

  const learn = me?.learn ?? { stars: {}, read: [] };
  const stars = GAMES.reduce((n, g) => n + (learn.stars[g.id] ?? 0), 0);
  const readHere = learn.read.filter((id) => LESSONS.some((l) => l.id === id)).length;


  const goHelp = () => { setGame(null); setLesson(null); setTab("ayuda"); window.scrollTo({ top: 0 }); };

  if (game) return <GamePlayer game={game} onExit={() => setGame(null)} onHelp={goHelp} />;
  if (lesson) return <LessonView lesson={lesson} lessons={LESSONS} onExit={() => setLesson(null)} onOpen={setLesson} onHelp={goHelp} />;

  const tabs: { id: Tab; label: string; short?: string; icon: React.ReactNode }[] = [
    { id: "juegos", label: tx(lang, TXT.juegos), icon: <Gamepad2 size={22} /> },
    { id: "lecciones", label: tx(lang, TXT.lecciones), icon: <BookOpen size={22} /> },
    { id: "ayuda", label: tx(lang, TXT.quienMeAyuda), short: tx(lang, TXT.ayuda), icon: <HeartHandshake size={22} /> },
  ];

  return (
    <div>
      <PageHeader title={L(lang, ...c.title)} sub={L(lang, ...c.sub)} say={L(lang, ...c.say)} />

      {/* Progress */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-3xl bg-ink px-5 py-4 text-paper">
        <Trophy size={28} className="text-sun" />
        <p className="min-w-0 flex-1 text-lg font-bold">
          {txf(lang, TXT.deEstrellas, [stars, GAMES.length * 3])}
          <span className="font-normal text-paper/70"> · {txf(lang, TXT.deLecciones, [readHere, LESSONS.length])}</span>
        </p>
      </div>

      {/* Tabs */}
      <div role="tablist" data-tour="aprender" className="mb-6 grid grid-cols-3 gap-2 rounded-3xl bg-sand/60 p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.95rem] leading-tight font-extrabold transition sm:flex-row sm:gap-2 sm:text-lg",
              tab === t.id ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            {t.icon}
            {t.short ? (<><span className="text-center sm:hidden">{t.short}</span><span className="hidden text-center sm:inline">{t.label}</span></>) : <span className="text-center">{t.label}</span>}
          </button>
        ))}
      </div>

      {tab === "juegos" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {GAMES.map((g) => (
            <button key={g.id} onClick={() => setGame(g)} className="flex min-w-0 flex-col gap-4 rounded-3xl border-2 border-sand bg-paper p-5 text-left transition hover:border-sand-dark active:scale-[0.98]">
              <span className="flex items-center justify-between">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: g.color + "1f", color: g.color }}>
                  <Icon name={g.icon} size={34} />
                </span>
                <Stars n={learn.stars[g.id] ?? 0} />
              </span>
              <span>
                <span className="block text-xl leading-tight font-extrabold">{pick(g.title, lang)}</span>
                <span className="mt-1 block text-base text-muted">{pick(g.sub, lang)}</span>
              </span>
              <span className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-lg font-extrabold" style={{ background: g.color, color: textOn(g.color) }}>
                {(learn.stars[g.id] ?? 0) > 0 ? tx(lang, TXT.jugarOtraVez) : tx(lang, TXT.jugar)} <ArrowRight size={20} />
              </span>
            </button>
          ))}
        </div>
      )}

      {tab === "lecciones" && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {LESSONS.map((l) => {
            const done = learn.read.includes(l.id);
            return (
              <button key={l.id} onClick={() => setLesson(l)} className="flex min-h-24 min-w-0 items-center gap-4 rounded-3xl border-2 border-sand bg-paper p-4 text-left transition hover:border-sand-dark active:scale-[0.98]">
                <span className={cx("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", done ? "bg-leaf/15 text-leaf" : "bg-cream text-clay")}>
                  {done ? <CheckCircle2 size={30} /> : <Icon name={l.icon} size={30} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg leading-tight font-extrabold">{pick(l.title, lang)}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-base text-muted">
                    <Clock size={16} /> {txf(lang, TXT.minLeerOEscuchar, [l.minutes])}
                    {done && <span className="font-bold text-leaf"> · {tx(lang, TXT.yaLaLeiste)}</span>}
                  </span>
                </span>
                <ChevronRight size={24} className="shrink-0 text-muted" />
              </button>
            );
          })}
        </div>
      )}

      {tab === "ayuda" && <Help needs={c.needs} resources={RESOURCES} soon={c.soon} />}

      {tab !== "ayuda" && (
        <button onClick={goHelp} className="mt-6 flex w-full items-center gap-3 rounded-3xl bg-sun-soft px-5 py-4 text-left">
          <HeartHandshake size={28} className="shrink-0 text-clay" />
          <span className="min-w-0 flex-1 text-base">
            <b>{tx(lang, TXT.miCaminoTeEnsenaPero)}</b>{" "}
            {tx(lang, TXT.paraDecisionesGrandesPideAyuda)}
          </span>
          <ChevronRight size={22} className="shrink-0" />
        </button>
      )}
    </div>
  );
}

function Stars({ n, size = 22 }: { n: number; size?: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n}/3`}>
      {[0, 1, 2].map((i) => (
        <Star key={i} size={size} className={i < n ? "text-sun" : "text-sand-dark"} fill={i < n ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

// ---------- Game ----------
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

function GamePlayer({ game, onExit, onHelp }: { game: Game; onExit: () => void; onHelp: () => void }) {
  const lang = useLang();
  const voiceOn = useStore((s) => s.voiceOn);
  const setGameStars = useStore((s) => s.setGameStars);
  const [round, setRound] = useState(0);
  const questions = useMemo(() => shuffle(game.questions), [game, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const done = i >= questions.length;
  const q = questions[Math.min(i, questions.length - 1)];

  useEffect(() => { window.scrollTo({ top: 0 }); }, [i, done]);
  useEffect(() => {
    if (!done && voiceOn) speak(pick(q.prompt, lang), lang);
    return () => stopSpeaking();
  }, [q, done, voiceOn, lang]);

  const total = questions.length;
  const ratio = right / total;
  const earned = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : right > 0 ? 1 : 0;

  useEffect(() => {
    if (!done) return;
    setGameStars(game.id, earned);
    if (earned === 3) playGoal(); else if (earned > 0) playBrick();
    if (voiceOn) speak(txf(lang, TXT.acertasteDe, [right, total]), lang);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const ok = q.choices[k].correct;
    if (ok) { setRight((r) => r + 1); playSaved(); }
    if (voiceOn) speak(`${ok ? tx(lang, TXT.muyBien) : tx(lang, TXT.casi)} ${pick(q.why, lang)}`, lang);
  };
  const next = () => { setPicked(null); setI((n) => n + 1); };
  const again = () => { setRound((r) => r + 1); setI(0); setPicked(null); setRight(0); };

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onExit} className="mb-3 inline-flex h-11 items-center gap-2 rounded-full pr-3 text-base font-bold text-muted hover:text-ink">
        <ArrowLeft size={22} /> {tx(lang, TXT.todosLosJuegos)}
      </button>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: game.color + "1f", color: game.color }}>
          <Icon name={game.icon} size={26} />
        </span>
        <h1 className="min-w-0 text-2xl leading-tight font-semibold md:text-3xl">{pick(game.title, lang)}</h1>
      </div>

      {!done ? (
        <>
          {/* progress */}
          <div className="mb-4 flex gap-1.5" aria-label={`${i + 1}/${total}`}>
            {questions.map((_, k) => (
              <span key={k} className={cx("h-2.5 flex-1 rounded-full", k < i ? "bg-leaf" : k === i ? "bg-clay" : "bg-sand")} />
            ))}
          </div>

          <Card className="mb-4">
            <div className="flex items-start gap-4">
              {q.icon && (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cream text-clay">
                  <Icon name={q.icon} size={34} />
                </span>
              )}
              <p className="min-w-0 flex-1 text-[1.35rem] leading-snug font-bold md:text-2xl">{pick(q.prompt, lang)}</p>
              <ListenButton text={pick(q.prompt, lang)} compact />
            </div>
          </Card>

          <div className={cx("grid gap-3", q.choices.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
            {q.choices.map((c, k) => {
              const show = picked !== null;
              const isPicked = picked === k;
              return (
                <button
                  key={k}
                  onClick={() => choose(k)}
                  disabled={show}
                  className={cx(
                    "flex min-h-20 min-w-0 items-center justify-center gap-3 rounded-3xl border-2 px-4 py-3 text-lg font-extrabold transition active:scale-[0.98]",
                    q.choices.length === 2 && "min-h-28 flex-col",
                    !show && "border-sand bg-paper hover:border-clay",
                    show && c.correct && "border-leaf bg-leaf text-paper",
                    show && !c.correct && isPicked && "border-clay bg-clay/10 text-clay",
                    show && !c.correct && !isPicked && "border-sand bg-paper opacity-50",
                  )}
                >
                  {c.icon && <Icon name={c.icon} size={30} />}
                  <span className="text-center">{pick(c.label, lang)}</span>
                  {show && c.correct && <Check size={24} />}
                  {show && isPicked && !c.correct && <X size={24} />}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div ref={(el) => { el?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className={cx("mt-4 scroll-mb-28 rounded-3xl p-5", q.choices[picked].correct ? "bg-leaf/12" : "bg-sun-soft")}>
              <p className="text-xl font-extrabold">{q.choices[picked].correct ? tx(lang, TXT.muyBien) : tx(lang, TXT.casiAsiEs)}</p>
              <p className="mt-1 text-lg">{pick(q.why, lang)}</p>
              <Button onClick={next} variant="dark" className="mt-4 w-full">
                {i + 1 < total ? tx(lang, TXT.siguiente) : tx(lang, TXT.verMiResultado)} <ArrowRight size={22} />
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="text-center">
          <div className="flex justify-center"><Stars n={earned} size={48} /></div>
          <p className="mt-4 text-3xl font-semibold">{txf(lang, TXT.acertasteDe2, [right, total])}</p>
          <p className="mt-2 text-lg text-muted">
            {earned === 3 ? tx(lang, TXT.eresUnExpertoComparteLo)
              : earned === 2 ? tx(lang, TXT.muyBienJuegaOtraVez)
              : tx(lang, TXT.vasAprendiendoCadaVezQue)}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button onClick={again}><RotateCcw size={22} /> {tx(lang, TXT.jugarOtraVez)}</Button>
            <Button onClick={onExit} variant="soft">{tx(lang, TXT.otrosJuegos)}</Button>
          </div>
          {game.id === "estafa" && (
            <button onClick={onHelp} className="mt-4 text-base font-bold text-clay underline underline-offset-4">
              {tx(lang, TXT.tePasoAlgoAsiMira)}
            </button>
          )}
        </Card>
      )}
    </div>
  );
}

// ---------- Lesson ----------
function LessonView({ lesson, lessons: LESSONS, onExit, onOpen, onHelp }: { lesson: Lesson; lessons: Lesson[]; onExit: () => void; onOpen: (l: Lesson) => void; onHelp: () => void }) {
  const lang = useLang();
  const me = useMe();
  const markLessonRead = useStore((s) => s.markLessonRead);
  const done = me?.learn?.read.includes(lesson.id) ?? false;
  const body = lang === "en" ? lesson.body.en : lesson.body.es;
  const keys = lang === "en" ? lesson.keys.en : lesson.keys.es;
  const full = `${pick(lesson.title, lang)}. ${body.join(" ")} ${tx(lang, TXT.loMasImportante)} ${keys.join(". ")}.`;
  const idx = LESSONS.findIndex((l) => l.id === lesson.id);
  const nextLesson = LESSONS[idx + 1];

  useEffect(() => { window.scrollTo({ top: 0 }); return () => stopSpeaking(); }, [lesson]);

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onExit} className="mb-3 inline-flex h-11 items-center gap-2 rounded-full pr-3 text-base font-bold text-muted hover:text-ink">
        <ArrowLeft size={22} /> {tx(lang, TXT.todasLasLecciones)}
      </button>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sand bg-paper text-clay"><Icon name={lesson.icon} size={30} /></span>
        <div className="min-w-0">
          <h1 className="text-[1.7rem] leading-tight font-semibold md:text-[2.1rem]">{pick(lesson.title, lang)}</h1>
          <p className="flex items-center gap-1.5 text-base text-muted"><Clock size={16} /> {lesson.minutes} min</p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-3xl bg-ink p-4 text-paper">
        <ListenButton text={full} light />
        <span className="text-base text-paper/80">{tx(lang, TXT.prefieresEscucharTeLaLeo)}</span>
      </div>

      <div className="space-y-4 text-[1.2rem] leading-relaxed">
        {body.map((p, k) => <p key={k}>{p}</p>)}
      </div>

      <div className="mt-6 rounded-3xl border-2 border-sun bg-sun-soft p-5">
        <p className="mb-3 flex items-center gap-2 text-lg font-extrabold"><Star size={22} fill="currentColor" className="text-clay" /> {tx(lang, TXT.loMasImportante2)}</p>
        <ul className="space-y-2">
          {keys.map((k) => (
            <li key={k} className="flex items-start gap-3 text-lg"><Check size={24} className="mt-0.5 shrink-0 text-leaf" /> {k}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {done ? (
          <div className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-leaf/15 text-lg font-extrabold text-leaf"><CheckCircle2 size={24} /> {tx(lang, TXT.yaLaLeiste)}</div>
        ) : (
          <Button variant="green" onClick={() => { markLessonRead(lesson.id); playBrick(); }}><Check size={22} /> {tx(lang, TXT.yaLaLei)}</Button>
        )}
        {lesson.link && (
          <Button href={lesson.link.href} variant="soft">{pick(lesson.link.label, lang)} <ArrowRight size={20} /></Button>
        )}
      </div>
      {nextLesson && (
        <Button variant="ghost" className="mt-2 w-full" onClick={() => { stopSpeaking(); onOpen(nextLesson); }}>
          {tx(lang, TXT.siguienteLeccion)} {pick(nextLesson.title, lang)} <ChevronRight size={20} />
        </Button>
      )}

      <button onClick={onHelp} className="mt-6 flex w-full items-center gap-3 rounded-3xl border border-sand bg-paper px-5 py-4 text-left">
        <HeartHandshake size={26} className="shrink-0 text-clay" />
        <span className="min-w-0 flex-1 text-base">{tx(lang, TXT.tienesDudasSobreTuCaso)}</span>
        <ChevronRight size={22} className="shrink-0" />
      </button>
    </div>
  );
}

// ---------- Trusted help ----------
function Help({ needs: NEEDS, resources: RESOURCES, soon }: { needs: NeedItem[]; resources: Resource[]; soon?: LearnContent["soon"] }) {
  const lang = useLang();
  const [need, setNeed] = useState<string>("todos");
  const list = RESOURCES.filter((r) => need === "todos" || r.needs.includes(need));

  return (
    <div>
      <div className="mb-4 rounded-3xl bg-clay px-5 py-4 text-paper">
        <p className="text-lg font-extrabold">{tx(lang, TXT.estasEnPeligroLlamaAl)}</p>
        <p className="text-base text-paper/85">{tx(lang, TXT.paraTodoLoDemasAqui)}</p>
      </div>

      <p className="mb-2 text-lg font-bold">{tx(lang, TXT.conQueNecesitasAyuda)}</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {NEEDS.map((n) => (
          <button
            key={n.id}
            onClick={() => setNeed(n.id)}
            aria-pressed={need === n.id}
            className={cx("inline-flex h-12 items-center gap-2 rounded-full border-2 px-4 text-base font-bold transition",
              need === n.id ? "border-ink bg-ink text-paper" : "border-sand bg-paper hover:border-sand-dark")}
          >
            <Icon name={n.icon} size={20} /> {pick(n.label, lang)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {list.map((r) => (
          <Card key={r.id} className="flex min-w-0 flex-col">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cream text-clay"><Icon name={r.icon} size={26} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-lg leading-tight font-extrabold">{pick(r.name, lang)}</p>
                {r.free && <span className="mt-1 inline-block rounded-full bg-leaf/15 px-2.5 py-0.5 text-sm font-extrabold text-leaf">{tx(lang, TXT.gratis)}</span>}
              </div>
              <ListenButton text={`${pick(r.name, lang)}. ${pick(r.what, lang)}${r.phone ? ` ${tx(lang, TXT.telefono)}: ${r.phone.show}.` : ""}`} compact />
            </div>
            <p className="mt-3 text-base">{pick(r.what, lang)}</p>
            {r.note && <p className="mt-1 text-sm text-muted">{pick(r.note, lang)}</p>}
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              {r.phone && (
                <a href={`tel:${r.phone.tel}`} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-leaf px-4 sm:w-auto text-base font-extrabold text-paper">
                  <Phone size={18} /> {tx(lang, TXT.llamar)} {r.phone.show}
                </a>
              )}
              {r.phone2 && (
                <a href={`tel:${r.phone2.tel}`} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-clay px-4 sm:w-auto text-base font-extrabold text-clay">
                  <Phone size={18} /> {pick(r.phone2.label, lang)} {r.phone2.show}
                </a>
              )}
              {r.web && (
                <a href={r.web.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 min-w-0 items-center gap-2 rounded-2xl border-2 border-sand px-4 text-base font-bold hover:border-sand-dark">
                  <ExternalLink size={18} className="shrink-0" /> <span className="truncate">{r.web.show}</span>
                </a>
              )}
            </div>
          </Card>
        ))}

        <div className="flex min-w-0 items-start gap-3 rounded-3xl border-2 border-dashed border-sand-dark p-5 md:col-span-2">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sand/60 text-muted"><Icon name="building-2" size={26} /></span>
          <div className="min-w-0">
            <p className="text-lg font-extrabold">{soon ? L(lang, ...soon.title) : tx(lang, TXT.prontoOrganizacionesAliadasDelConsulado)}</p>
            <p className="text-base text-muted">{soon ? L(lang, ...soon.text) : tx(lang, TXT.bancosCooperativasYAsesoresQue)}</p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted">
        {tx(lang, TXT.revisamosEstosDatosEnNoviembre)}{" "}
        <Link href="/casita/documentos" className="font-bold underline underline-offset-4">{tx(lang, TXT.tienesUnPapelQueNo)}</Link>
      </p>
    </div>
  );
}
