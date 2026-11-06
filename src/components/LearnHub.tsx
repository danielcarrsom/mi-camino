"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Clock, ExternalLink, Gamepad2, HeartHandshake, Phone, RotateCcw, Star, Trophy, X } from "lucide-react";
import { Button, Card, ListenButton, PageHeader, cx } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useLang, useMe, useStore } from "@/lib/store";
import { pick } from "@/lib/catalog";
import type { Game, Lesson, NeedItem, Resource } from "@/lib/learn";
import { speak, stopSpeaking } from "@/lib/voice";
import { playBrick, playGoal, playSaved } from "@/lib/sound";
import type { Lang } from "@/lib/i18n";

const L = (lang: Lang, es: string, en: string) => (lang === "en" ? en : es);
type Tab = "juegos" | "lecciones" | "ayuda";

export type LearnContent = {
  title: [string, string]; sub: [string, string]; say: [string, string];
  games: Game[]; lessons: Lesson[]; needs: NeedItem[]; resources: Resource[];
  soon?: { title: [string, string]; text: [string, string] };
};

export function LearnHub({ c }: { c: LearnContent }) {
  const { games: GAMES, lessons: LESSONS } = c;
  const lang = useLang();
  const me = useMe();
  const [tab, setTab] = useState<Tab>("juegos");
  const [game, setGame] = useState<Game | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);

  const learn = me?.learn ?? { stars: {}, read: [] };
  const stars = GAMES.reduce((n, g) => n + (learn.stars[g.id] ?? 0), 0);
  const readHere = learn.read.filter((id) => LESSONS.some((l) => l.id === id)).length;

  // Open the help tab from links like /aprender#ayuda
  useEffect(() => {
    if (window.location.hash === "#ayuda") setTab("ayuda");
  }, []);

  const goHelp = () => { setGame(null); setLesson(null); setTab("ayuda"); window.scrollTo({ top: 0 }); };

  if (game) return <GamePlayer game={game} onExit={() => setGame(null)} onHelp={goHelp} />;
  if (lesson) return <LessonView lesson={lesson} lessons={LESSONS} onExit={() => setLesson(null)} onOpen={setLesson} onHelp={goHelp} />;

  const tabs: { id: Tab; label: string; short?: string; icon: React.ReactNode }[] = [
    { id: "juegos", label: L(lang, "Juegos", "Games"), icon: <Gamepad2 size={22} /> },
    { id: "lecciones", label: L(lang, "Lecciones", "Lessons"), icon: <BookOpen size={22} /> },
    { id: "ayuda", label: L(lang, "¿Quién me ayuda?", "Who can help?"), short: L(lang, "Ayuda", "Help"), icon: <HeartHandshake size={22} /> },
  ];

  return (
    <div>
      <PageHeader title={L(lang, ...c.title)} sub={L(lang, ...c.sub)} say={L(lang, ...c.say)} />

      {/* Progress */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-3xl bg-ink px-5 py-4 text-paper">
        <Trophy size={28} className="text-sun" />
        <p className="min-w-0 flex-1 text-lg font-bold">
          {L(lang, `${stars} de ${GAMES.length * 3} estrellas`, `${stars} of ${GAMES.length * 3} stars`)}
          <span className="font-normal text-paper/70"> · {L(lang, `${readHere} de ${LESSONS.length} lecciones`, `${readHere} of ${LESSONS.length} lessons`)}</span>
        </p>
      </div>

      {/* Tabs */}
      <div role="tablist" className="mb-6 grid grid-cols-3 gap-2 rounded-3xl bg-sand/60 p-1.5">
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
              <span className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-lg font-extrabold text-paper" style={{ background: g.color }}>
                {(learn.stars[g.id] ?? 0) > 0 ? L(lang, "Jugar otra vez", "Play again") : L(lang, "Jugar", "Play")} <ArrowRight size={20} />
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
                    <Clock size={16} /> {L(lang, `${l.minutes} min · leer o escuchar`, `${l.minutes} min · read or listen`)}
                    {done && <span className="font-bold text-leaf"> · {L(lang, "Ya la leíste", "Done")}</span>}
                  </span>
                </span>
                <ChevronRight size={24} className="shrink-0 text-muted" />
              </button>
            );
          })}
        </div>
      )}

      {tab === "ayuda" && <Help needs={c.needs} resources={c.resources} soon={c.soon} />}

      {tab !== "ayuda" && (
        <button onClick={goHelp} className="mt-6 flex w-full items-center gap-3 rounded-3xl bg-sun-soft px-5 py-4 text-left">
          <HeartHandshake size={28} className="shrink-0 text-clay" />
          <span className="min-w-0 flex-1 text-base">
            <b>{L(lang, "Mi Camino te enseña, pero no reemplaza a un profesional.", "Mi Camino teaches, but it doesn't replace a professional.")}</b>{" "}
            {L(lang, "Para decisiones grandes, pide ayuda gratis.", "For big decisions, get free help.")}
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
    if (voiceOn) speak(L(lang, `Acertaste ${right} de ${total}.`, `You got ${right} of ${total}.`), lang);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const ok = q.choices[k].correct;
    if (ok) { setRight((r) => r + 1); playSaved(); }
    if (voiceOn) speak(`${ok ? L(lang, "¡Muy bien!", "Well done!") : L(lang, "Casi.", "Almost.")} ${pick(q.why, lang)}`, lang);
  };
  const next = () => { setPicked(null); setI((n) => n + 1); };
  const again = () => { setRound((r) => r + 1); setI(0); setPicked(null); setRight(0); };

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onExit} className="mb-3 inline-flex h-11 items-center gap-2 rounded-full pr-3 text-base font-bold text-muted hover:text-ink">
        <ArrowLeft size={22} /> {L(lang, "Todos los juegos", "All games")}
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
              <p className="text-xl font-extrabold">{q.choices[picked].correct ? L(lang, "¡Muy bien!", "Well done!") : L(lang, "Casi. Así es:", "Almost. Here's why:")}</p>
              <p className="mt-1 text-lg">{pick(q.why, lang)}</p>
              <Button onClick={next} variant="dark" className="mt-4 w-full">
                {i + 1 < total ? L(lang, "Siguiente", "Next") : L(lang, "Ver mi resultado", "See my result")} <ArrowRight size={22} />
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="text-center">
          <div className="flex justify-center"><Stars n={earned} size={48} /></div>
          <p className="mt-4 text-3xl font-semibold">{L(lang, `Acertaste ${right} de ${total}`, `You got ${right} of ${total}`)}</p>
          <p className="mt-2 text-lg text-muted">
            {earned === 3 ? L(lang, "¡Eres un experto! Comparte lo que aprendiste con tu familia.", "You're an expert! Share what you learned with your family.")
              : earned === 2 ? L(lang, "¡Muy bien! Juega otra vez para ganar las 3 estrellas.", "Great! Play again to earn all 3 stars.")
              : L(lang, "Vas aprendiendo. Cada vez que juegas, aprendes más.", "You're learning. Every time you play, you learn more.")}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button onClick={again}><RotateCcw size={22} /> {L(lang, "Jugar otra vez", "Play again")}</Button>
            <Button onClick={onExit} variant="soft">{L(lang, "Otros juegos", "Other games")}</Button>
          </div>
          {game.id === "estafa" && (
            <button onClick={onHelp} className="mt-4 text-base font-bold text-clay underline underline-offset-4">
              {L(lang, "¿Te pasó algo así? Mira dónde denunciar", "Did this happen to you? See where to report it")}
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
  const full = `${pick(lesson.title, lang)}. ${body.join(" ")} ${L(lang, "Lo más importante:", "Key points:")} ${keys.join(". ")}.`;
  const idx = LESSONS.findIndex((l) => l.id === lesson.id);
  const nextLesson = LESSONS[idx + 1];

  useEffect(() => { window.scrollTo({ top: 0 }); return () => stopSpeaking(); }, [lesson]);

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onExit} className="mb-3 inline-flex h-11 items-center gap-2 rounded-full pr-3 text-base font-bold text-muted hover:text-ink">
        <ArrowLeft size={22} /> {L(lang, "Todas las lecciones", "All lessons")}
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
        <span className="text-base text-paper/80">{L(lang, "¿Prefieres escuchar? Te la leo completa.", "Rather listen? I'll read it all to you.")}</span>
      </div>

      <div className="space-y-4 text-[1.2rem] leading-relaxed">
        {body.map((p, k) => <p key={k}>{p}</p>)}
      </div>

      <div className="mt-6 rounded-3xl border-2 border-sun bg-sun-soft p-5">
        <p className="mb-3 flex items-center gap-2 text-lg font-extrabold"><Star size={22} fill="currentColor" className="text-clay" /> {L(lang, "Lo más importante", "Key points")}</p>
        <ul className="space-y-2">
          {keys.map((k) => (
            <li key={k} className="flex items-start gap-3 text-lg"><Check size={24} className="mt-0.5 shrink-0 text-leaf" /> {k}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {done ? (
          <div className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-leaf/15 text-lg font-extrabold text-leaf"><CheckCircle2 size={24} /> {L(lang, "Ya la leíste", "Done")}</div>
        ) : (
          <Button variant="green" onClick={() => { markLessonRead(lesson.id); playBrick(); }}><Check size={22} /> {L(lang, "Ya la leí", "I read it")}</Button>
        )}
        {lesson.link && (
          <Button href={lesson.link.href} variant="soft">{pick(lesson.link.label, lang)} <ArrowRight size={20} /></Button>
        )}
      </div>
      {nextLesson && (
        <Button variant="ghost" className="mt-2 w-full" onClick={() => { stopSpeaking(); onOpen(nextLesson); }}>
          {L(lang, "Siguiente lección:", "Next lesson:")} {pick(nextLesson.title, lang)} <ChevronRight size={20} />
        </Button>
      )}

      <button onClick={onHelp} className="mt-6 flex w-full items-center gap-3 rounded-3xl border border-sand bg-paper px-5 py-4 text-left">
        <HeartHandshake size={26} className="shrink-0 text-clay" />
        <span className="min-w-0 flex-1 text-base">{L(lang, "¿Tienes dudas sobre tu caso? Habla con un profesional, muchos son gratis.", "Questions about your situation? Talk to a professional — many are free.")}</span>
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
        <p className="text-lg font-extrabold">{L(lang, "¿Estás en peligro? Llama al 911.", "In danger? Call 911.")}</p>
        <p className="text-base text-paper/85">{L(lang, "Para todo lo demás, aquí hay ayuda de confianza. Pide intérprete en tu idioma: es tu derecho.", "For everything else, here is trusted help. Ask for an interpreter in your language: it's your right.")}</p>
      </div>

      <p className="mb-2 text-lg font-bold">{L(lang, "¿Con qué necesitas ayuda?", "What do you need help with?")}</p>
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
                {r.free && <span className="mt-1 inline-block rounded-full bg-leaf/15 px-2.5 py-0.5 text-sm font-extrabold text-leaf">{L(lang, "Gratis", "Free")}</span>}
              </div>
              <ListenButton text={`${pick(r.name, lang)}. ${pick(r.what, lang)}${r.phone ? ` ${L(lang, "Teléfono", "Phone")}: ${r.phone.show}.` : ""}`} compact />
            </div>
            <p className="mt-3 text-base">{pick(r.what, lang)}</p>
            {r.note && <p className="mt-1 text-sm text-muted">{pick(r.note, lang)}</p>}
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              {r.phone && (
                <a href={`tel:${r.phone.tel}`} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-leaf px-4 sm:w-auto text-base font-extrabold text-paper">
                  <Phone size={18} /> {L(lang, "Llamar", "Call")} {r.phone.show}
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
            <p className="text-lg font-extrabold">{soon ? L(lang, ...soon.title) : L(lang, "Pronto: organizaciones aliadas del Consulado", "Coming soon: Consulate partner organizations")}</p>
            <p className="text-base text-muted">{soon ? L(lang, ...soon.text) : L(lang, "Bancos, cooperativas y asesores que trabajan con el Consulado de México en Nueva York.", "Banks, credit unions and advisors that work with the Mexican Consulate in New York.")}</p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted">
        {L(lang, "Revisamos estos datos en noviembre de 2026. Si un número cambió, llama al 311.", "We checked this information in November 2026. If a number changed, call 311.")}{" "}
        <Link href="/casita/documentos" className="font-bold underline underline-offset-4">{L(lang, "¿Tienes un papel que no entiendes?", "Have a paper you don't understand?")}</Link>
      </p>
    </div>
  );
}
