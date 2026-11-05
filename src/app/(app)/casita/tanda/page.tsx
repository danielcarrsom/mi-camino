"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Check, Users, ShieldAlert, Lightbulb, HandCoins, CalendarDays, PartyPopper } from "lucide-react";
import { AmountInput, Button, Card, ListenButton, PageHeader, Sheet, cx } from "@/components/ui";
import { Stepper } from "@/components/MoneyForms";
import { useLang, useMe, useStore, tandaCurrentRound, tandaEnded, tandaPayoutDate, tandaPot, tandaRoundDate, type Tanda } from "@/lib/store";
import { money, moneySpoken, isThisWeek } from "@/lib/money";
import { speak } from "@/lib/voice";
import { playGoal, playSaved } from "@/lib/sound";
import type { Lang } from "@/lib/i18n";

const L = (lang: Lang, es: string, en: string) => (lang === "en" ? en : es);
const everyWord = (lang: Lang, e: Tanda["every"]) =>
  e === "week" ? L(lang, "cada semana", "every week") : e === "2weeks" ? L(lang, "cada 2 semanas", "every 2 weeks") : L(lang, "cada mes", "every month");
const dateWord = (lang: Lang, d: Date) => d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { day: "numeric", month: "long" });
const personName = (lang: Lang, t: Tanda, i: number) =>
  i === t.myTurn - 1 ? L(lang, "Tú", "You") : t.names[i]?.trim() || `${L(lang, "Persona", "Person")} ${i + 1}`;

export default function TandaPage() {
  const lang = useLang();
  const me = useMe()!;
  const tandas = me.tandas ?? [];
  const [editing, setEditing] = useState<Tanda | "new" | null>(null);

  const intro = L(
    lang,
    "Mi tanda. Aquí llevas la cuenta de tu tanda: cuánto pones, cuándo te toca recibir y si ya pagaste cada vuelta.",
    "My tanda. Here you keep track of your tanda: how much you put in, when it's your turn and whether you've paid each round.",
  );

  return (
    <>
      <PageHeader
        title={L(lang, "Mi tanda", "My tanda")}
        sub={L(lang, "Ahorrar juntos, por turnos", "Saving together, taking turns")}
        say={intro}
        right={tandas.length > 0 ? <span className="hidden md:block"><Button onClick={() => setEditing("new")} className="min-h-12 px-4 text-base"><Plus size={20} /> {L(lang, "Nueva tanda", "New tanda")}</Button></span> : undefined}
      />

      {tandas.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Card className="flex flex-col items-center py-10 text-center">
            <TandaCircle people={8} current={2} myTurn={5} paidRounds={[0, 1]} size={220} lang={lang} />
            <h2 className="mt-4 text-2xl font-semibold">{L(lang, "¿Estás en una tanda?", "Are you in a tanda?")}</h2>
            <p className="mt-2 max-w-md text-lg text-muted">
              {L(lang, "Anótala aquí y te avisamos cuándo pagar y cuándo te toca recibir.", "Add it here and we'll show you when to pay and when it's your turn.")}
            </p>
            <Button onClick={() => setEditing("new")} className="mt-6"><Plus size={22} /> {L(lang, "Anotar mi tanda", "Add my tanda")}</Button>
          </Card>
          <WhatIsTanda lang={lang} />
        </div>
      ) : (
        <div className="space-y-8">
          {tandas.map((t) => <TandaView key={t.id} t={t} onEdit={() => setEditing(t)} />)}
          <Button onClick={() => setEditing("new")} variant="soft" className="w-full md:hidden"><Plus size={22} /> {L(lang, "Nueva tanda", "New tanda")}</Button>
          <WhatIsTanda lang={lang} />
        </div>
      )}

      <TandaForm open={editing !== null} tanda={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
    </>
  );
}

// ---------- One tanda ----------
function TandaView({ t, onEdit }: { t: Tanda; onEdit: () => void }) {
  const lang = useLang();
  const me = useMe()!;
  const toggle = useStore((s) => s.toggleTandaPaid);
  const receive = useStore((s) => s.receiveTanda);
  const [party, setParty] = useState(false);

  const current = tandaCurrentRound(t);
  const ended = tandaEnded(t);
  const pot = tandaPot(t);
  const payout = tandaPayoutDate(t);
  const myRoundIdx = t.myTurn - 1;
  const myTurnNow = current === myRoundIdx || (isThisWeek(payout.toISOString()) && !t.received);
  const goal = t.goalId ? me.goals.find((g) => g.id === t.goalId) : null;
  const paidCount = t.paid.filter((r) => r !== t.myTurn - 1).length;
  const roundShown = Math.max(0, current);
  const nextRound = current < t.people - 1 ? current + 1 : null;

  const status =
    t.received ? L(lang, "Ya recibiste tu tanda", "You already got your tanda")
    : myTurnNow ? L(lang, "¡Esta vuelta te toca recibir!", "It's your turn to receive!")
    : payout.getTime() > Date.now() ? `${L(lang, "Te toca recibir el", "Your turn is on")} ${dateWord(lang, payout)}`
    : L(lang, "Tu turno ya pasó: marca si ya recibiste", "Your turn passed: mark if you received it");

  const say = `${t.name}. ${L(lang, "Pones", "You put in")} ${moneySpoken(t.amount, lang)} ${everyWord(lang, t.every)}. ${L(lang, "Son", "There are")} ${t.people} ${L(lang, "personas, el que recibe se lleva", "people; whoever receives takes")} ${moneySpoken(pot, lang)}. ${status}.`;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Users size={26} className="text-clay" /> {t.name}</h2>
        <div className="flex gap-2">
          <ListenButton compact text={say} />
          <button onClick={onEdit} aria-label={L(lang, "Cambiar", "Change")} className="flex h-12 w-12 items-center justify-center rounded-full bg-sand/60 hover:bg-sun-soft"><Pencil size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr] lg:gap-6">
        <Card className="relative flex flex-col items-center p-6 text-center">
          {party && (
            <div className="pop-in absolute top-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-sun px-5 py-2.5 text-lg font-extrabold whitespace-nowrap shadow-lg">
              <PartyPopper size={22} /> {L(lang, "¡Recibiste tu tanda!", "You got your tanda!")}
            </div>
          )}
          <TandaCircle people={t.people} current={ended ? t.people : current} myTurn={t.myTurn} paidRounds={t.paid} size={260} lang={lang} />
          <p className={cx("mt-3 rounded-full px-4 py-2 text-lg font-extrabold", myTurnNow && !t.received ? "bg-sun text-ink" : t.received ? "bg-leaf-soft text-leaf" : "bg-sand/60")}>{status}</p>
          <div className="mt-5 grid w-full grid-cols-3 gap-2">
            <Fact label={L(lang, "Pones", "You put in")} value={money(t.amount, lang)} sub={everyWord(lang, t.every)} />
            <Fact label={L(lang, "Recibes", "You receive")} value={money(pot, lang)} sub={L(lang, "una vez", "once")} />
            <Fact label={L(lang, "Tu turno", "Your turn")} value={`#${t.myTurn}`} sub={dateWord(lang, payout)} />
          </div>
          {myTurnNow && !t.received && (
            <Button
              variant="green"
              onClick={() => {
                receive(t.id);
                playGoal();
                setParty(true);
                setTimeout(() => setParty(false), 3500);
                speak(goal
                  ? L(lang, `¡Recibiste tu tanda! Pusimos ${moneySpoken(pot, lang)} en tu meta ${goal.name}.`, `You got your tanda! We put ${moneySpoken(pot, lang)} into your goal ${goal.name}.`)
                  : L(lang, "¡Recibiste tu tanda!", "You got your tanda!"), lang);
              }}
              className="mt-5 w-full"
            >
              <HandCoins size={24} /> {L(lang, "Ya recibí mi tanda", "I received my tanda")}
            </Button>
          )}
          {!myTurnNow && !t.received && payout.getTime() < Date.now() && (
            <Button variant="soft" onClick={() => receive(t.id)} className="mt-5 w-full"><Check size={22} /> {L(lang, "Ya la recibí", "I received it")}</Button>
          )}
          {goal && (
            <p className="mt-4 text-base text-muted">
              {t.received ? L(lang, "Se fue a tu meta:", "It went to your goal:") : L(lang, "Cuando la recibas, va a tu meta:", "When you get it, it goes to your goal:")} <b className="text-ink">{goal.name}</b>
            </p>
          )}
        </Card>

        <div className="space-y-5">
          {/* This round */}
          {!ended && current >= 0 && (
            <Card dark>
              <p className="text-lg text-paper/75">{L(lang, "Esta vuelta", "This round")} · {roundShown + 1} {L(lang, "de", "of")} {t.people}</p>
              <p className="mt-1 text-2xl font-semibold">
                {L(lang, "Recibe:", "Receives:")} {personName(lang, t, roundShown)}
              </p>
              <p className="mt-1 text-paper/75">{dateWord(lang, tandaRoundDate(t, roundShown))}</p>
              {roundShown === myRoundIdx ? (
                <p className="mt-5 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-sun px-4 text-center text-lg font-extrabold text-ink">
                  <HandCoins size={26} /> {L(lang, `Esta vuelta no pagas: te toca recibir ${money(pot, lang)}`, `You don't pay this round: you receive ${money(pot, lang)}`)}
                </p>
              ) : (
              <button
                onClick={() => { toggle(t.id, roundShown); if (!t.paid.includes(roundShown)) { playSaved(); speak(L(lang, "Listo, anotamos tu pago de esta vuelta.", "Done, we noted your payment for this round."), lang); } }}
                className={cx("mt-5 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl text-lg font-extrabold transition", t.paid.includes(roundShown) ? "bg-leaf text-paper" : "bg-clay text-paper shadow-[0_4px_0_#8f3a20]")}
              >
                {t.paid.includes(roundShown) ? <><Check size={26} /> {L(lang, "Ya pagué esta vuelta", "I paid this round")}</> : <>{L(lang, "Ya pagué", "I paid")} {money(t.amount, lang)}</>}
              </button>
              )}
              {nextRound !== null && (
                <p className="mt-4 flex items-center gap-2 text-base text-paper/75">
                  <CalendarDays size={18} /> {L(lang, "Siguiente pago:", "Next payment:")} {dateWord(lang, tandaRoundDate(t, nextRound))}
                </p>
              )}
            </Card>
          )}
          {current < 0 && (
            <Card dark>
              <p className="text-lg text-paper/75">{L(lang, "La tanda empieza el", "The tanda starts on")}</p>
              <p className="text-3xl font-semibold">{dateWord(lang, tandaRoundDate(t, 0))}</p>
            </Card>
          )}

          {/* Every round */}
          <Card className="p-2 md:p-2">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <h3 className="text-xl font-semibold">{L(lang, "Todas las vueltas", "All rounds")}</h3>
              <span className="text-base font-bold text-muted">{L(lang, "Pagaste", "Paid")} {paidCount}/{t.people - 1}</span>
            </div>
            <ul className="max-h-[26rem] divide-y divide-sand overflow-y-auto">
              {Array.from({ length: t.people }).map((_, i) => {
                const mine = i === myRoundIdx;
                const started = i <= current;
                const paid = t.paid.includes(i);
                return (
                  <li key={i} className={cx("flex items-center gap-3 px-3 py-3", i === current && "bg-sun-soft/50", mine && "font-extrabold")}>
                    <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-lg font-semibold", mine ? "bg-clay text-paper" : "bg-sand/70")}>{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{personName(lang, t, i)}{mine ? ` · ${L(lang, "recibes", "you get")} ${money(pot, lang)}` : ""}</span>
                      <span className="block text-sm font-normal text-muted">{dateWord(lang, tandaRoundDate(t, i))}</span>
                    </span>
                    {mine ? (
                      <span className="rounded-xl bg-sun-soft px-3 py-2 text-sm font-bold">{L(lang, "No pagas", "You don't pay")}</span>
                    ) : started ? (
                      <button
                        onClick={() => toggle(t.id, i)}
                        aria-pressed={paid}
                        className={cx("flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold", paid ? "bg-leaf-soft text-leaf" : "border-2 border-clay text-clay")}
                      >
                        {paid ? <><Check size={18} /> {L(lang, "Pagado", "Paid")}</> : L(lang, "Sin pagar", "Not paid")}
                      </button>
                    ) : (
                      <span className="text-sm text-muted">{L(lang, "Pronto", "Soon")}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-cream p-3">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="font-serif text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted">{sub}</p>
    </div>
  );
}

// ---------- The circle of people ----------
function TandaCircle({ people, current, myTurn, paidRounds, size, lang }: { people: number; current: number; myTurn: number; paidRounds: number[]; size: number; lang: Lang }) {
  const R = 78;
  const seat = Math.max(9, Math.min(17, 120 / people));
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`${L(lang, "Vuelta", "Round")} ${Math.min(current + 1, people)} / ${people}`}>
      <circle cx="100" cy="100" r={R} fill="none" stroke="#eadfcb" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" />
      {Array.from({ length: people }).map((_, i) => {
        const a = (i / people) * Math.PI * 2 - Math.PI / 2;
        const x = 100 + R * Math.cos(a), y = 100 + R * Math.sin(a);
        const mine = i === myTurn - 1;
        const done = i < current;
        const now = i === current;
        const fill = now ? "#e0a33a" : mine ? "#b34a2a" : done ? "#3e7d4f" : "#fffbf3";
        const stroke = now ? "#b07a1a" : mine ? "#8f3a20" : done ? "#2d5c3a" : "#d9cbb2";
        return (
          <g key={i}>
            {now && <circle cx={x} cy={y} r={seat + 6} fill="#e0a33a" opacity="0.3" />}
            <circle cx={x} cy={y} r={seat} fill={fill} stroke={stroke} strokeWidth="2" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={seat > 12 ? 11 : 9} fontWeight="800" fill={now || mine || done ? "#fffbf3" : "#5b5a52"}>
              {mine ? L(lang, "Tú", "You") : i + 1}
            </text>
            {done && paidRounds.includes(i) && !mine && <circle cx={x + seat * 0.75} cy={y - seat * 0.75} r="4" fill="#fffbf3" stroke="#3e7d4f" strokeWidth="1.5" />}
          </g>
        );
      })}
      <text x="100" y="94" textAnchor="middle" fontSize="12" fill="#5b5a52" fontWeight="700">
        {current >= people ? L(lang, "Terminó", "Finished") : current < 0 ? L(lang, "Por empezar", "Not started") : L(lang, "Vuelta", "Round")}
      </text>
      {current >= 0 && current < people && (
        <text x="100" y="122" textAnchor="middle" fontSize="28" fontWeight="700" fill="#1f2b27" fontFamily="var(--font-serif)">
          {current + 1}/{people}
        </text>
      )}
    </svg>
  );
}

// ---------- Create / change a tanda ----------
function TandaForm({ open, tanda, onClose }: { open: boolean; tanda: Tanda | null; onClose: () => void }) {
  const lang = useLang();
  const me = useMe()!;
  const addTanda = useStore((s) => s.addTanda);
  const updateTanda = useStore((s) => s.updateTanda);
  const removeTanda = useStore((s) => s.removeTanda);

  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [every, setEvery] = useState<Tanda["every"]>("week");
  const [people, setPeople] = useState(10);
  const [myTurn, setMyTurn] = useState(1);
  const [start, setStart] = useState(today);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [showNames, setShowNames] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(tanda?.name ?? L(lang, "Tanda de la familia", "Family tanda"));
    setAmount(tanda ? String(tanda.amount) : "");
    setEvery(tanda?.every ?? "week");
    setPeople(tanda?.people ?? 10);
    setMyTurn(tanda?.myTurn ?? 1);
    setStart(tanda ? tanda.start.slice(0, 10) : today);
    setGoalId(tanda?.goalId ?? null);
    setNames(tanda?.names ?? []);
    setShowNames(false);
    if (!tanda) speak(L(lang, "Anota tu tanda: cuánto pone cada quien, cada cuánto, cuántas personas son y qué número te toca.", "Add your tanda: how much each person puts in, how often, how many people and which turn is yours."), lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { if (myTurn > people) setMyTurn(people); }, [people, myTurn]);

  const draft: Tanda = useMemo(() => ({
    id: "x", name, amount: Number(amount) || 0, every, people, names, myTurn,
    start: new Date(start + "T12:00:00").toISOString(), paid: [], received: false, goalId, createdAt: "",
  }), [name, amount, every, people, names, myTurn, start, goalId]);
  const pot = tandaPot(draft);

  const save = () => {
    const data = { name: name.trim() || L(lang, "Mi tanda", "My tanda"), amount: Number(amount), every, people, names: names.slice(0, people), myTurn, start: draft.start, goalId };
    if (tanda) updateTanda(tanda.id, data);
    else addTanda(data);
    playSaved();
    onClose();
  };

  const EVERY: { id: Tanda["every"]; es: string; en: string }[] = [
    { id: "week", es: "Cada semana", en: "Every week" },
    { id: "2weeks", es: "Cada 2 semanas", en: "Every 2 weeks" },
    { id: "month", es: "Cada mes", en: "Every month" },
  ];

  return (
    <Sheet open={open} onClose={onClose} title={tanda ? L(lang, "Cambiar mi tanda", "Change my tanda") : L(lang, "Anotar mi tanda", "Add my tanda")} wide>
      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-lg font-bold">{L(lang, "¿Cómo se llama tu tanda?", "What's your tanda called?")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg font-bold outline-none focus:border-clay" />
        </label>

        <AmountInput label={L(lang, "¿Cuánto pone cada persona?", "How much does each person put in?")} value={amount} onChange={setAmount} />

        <div>
          <p className="mb-2 text-lg font-bold">{L(lang, "¿Cada cuánto se paga?", "How often do you pay?")}</p>
          <div className="grid grid-cols-3 gap-2">
            {EVERY.map((e) => (
              <button key={e.id} onClick={() => setEvery(e.id)} className={cx("min-h-14 rounded-2xl border-2 px-2 text-base font-bold", every === e.id ? "border-clay bg-clay text-paper" : "border-sand bg-paper")}>
                {L(lang, e.es, e.en)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Stepper label={L(lang, "¿Cuántas personas son?", "How many people?")} value={people} min={2} max={40} step={1} onChange={setPeople} />
          <Stepper label={L(lang, "¿Qué número te toca?", "Which turn is yours?")} value={myTurn} min={1} max={people} step={1} onChange={setMyTurn} />
        </div>

        <label className="block">
          <span className="mb-2 block text-lg font-bold">{L(lang, "¿Cuándo es el primer pago?", "When is the first payment?")}</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value || today)} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg font-bold outline-none focus:border-clay" />
        </label>

        {me.goals.length > 0 && (
          <div>
            <p className="mb-2 text-lg font-bold">{L(lang, "¿A qué meta va el dinero cuando te toque?", "Which goal does the money go to when it's your turn?")}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setGoalId(null)} className={cx("min-h-12 rounded-full border-2 px-4 font-bold", goalId === null ? "border-clay bg-clay text-paper" : "border-sand bg-paper")}>{L(lang, "Ninguna", "None")}</button>
              {me.goals.map((g) => (
                <button key={g.id} onClick={() => setGoalId(g.id)} className={cx("min-h-12 rounded-full border-2 px-4 font-bold", goalId === g.id ? "border-clay bg-clay text-paper" : "border-sand bg-paper")}>{g.name}</button>
              ))}
            </div>
          </div>
        )}

        <div>
          <button onClick={() => setShowNames((v) => !v)} className="inline-flex h-11 items-center gap-2 rounded-full px-1 font-bold text-clay">
            <Users size={20} /> {showNames ? L(lang, "Ocultar nombres", "Hide names") : L(lang, "Poner los nombres (opcional)", "Add names (optional)")}
          </button>
          {showNames && (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Array.from({ length: people }).map((_, i) => (
                <label key={i} className="flex items-center gap-2">
                  <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold", i === myTurn - 1 ? "bg-clay text-paper" : "bg-sand/70")}>{i + 1}</span>
                  {i === myTurn - 1 ? (
                    <span className="flex h-12 flex-1 items-center rounded-xl bg-paper px-3 font-bold">{L(lang, "Tú", "You")}</span>
                  ) : (
                    <input
                      value={names[i] ?? ""}
                      onChange={(e) => setNames((n) => { const c = [...n]; c[i] = e.target.value; return c; })}
                      placeholder={`${L(lang, "Persona", "Person")} ${i + 1}`}
                      className="h-12 min-w-0 flex-1 rounded-xl border-2 border-sand bg-paper px-3 text-base outline-none focus:border-clay"
                    />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {Number(amount) > 0 && (
          <div className="rounded-2xl bg-ink p-5 text-paper">
            <p className="text-lg">
              {L(lang, "Cada quien pone", "Each person puts in")} <b>{money(Number(amount), lang)}</b> {everyWord(lang, every)}. {L(lang, "Son", "There are")} {people} {L(lang, "personas: el que recibe no paga esa vuelta y se lleva", "people: whoever receives doesn't pay that round and takes")} <b className="text-sun">{money(pot, lang)}</b>.
            </p>
            <p className="mt-2 text-lg">
              {L(lang, "Te toca recibir en la vuelta", "Your turn is round")} <b>{myTurn}</b>: <b className="text-sun">{dateWord(lang, tandaPayoutDate(draft))}</b>.
            </p>
            <p className="mt-2 text-base text-paper/70">
              {L(lang, `En total pones ${money(pot, lang)} (todas las vueltas menos la tuya) y recibes ${money(pot, lang)}. No ganas intereses: es una forma de ahorrar juntos.`, `In total you put in ${money(pot, lang)} (every round except yours) and get ${money(pot, lang)}. No interest: it's a way to save together.`)}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {tanda && (
            <Button variant="soft" onClick={() => { if (window.confirm(L(lang, "¿Borrar esta tanda?", "Delete this tanda?"))) { removeTanda(tanda.id); onClose(); } }} className="flex-1 text-clay">
              {L(lang, "Borrar", "Delete")}
            </Button>
          )}
          <Button onClick={save} disabled={!Number(amount)} className="flex-[2]"><Check size={22} /> {L(lang, "Guardar", "Save")}</Button>
        </div>
      </div>
    </Sheet>
  );
}

// ---------- Plain explanation + safety ----------
function WhatIsTanda({ lang }: { lang: Lang }) {
  const what = L(
    lang,
    "Una tanda es un grupo de personas que juntan dinero. Cada vuelta, los demás ponen lo mismo y una persona se lleva todo; esa vuelta ella no paga. Así hasta que a todos les toca.",
    "A tanda is a group of people who pool money. Each round the others put in the same amount and one person takes it all; that round they don't pay. It goes on until everyone has had a turn.",
  );
  const safe = L(
    lang,
    "Haz tandas solo con personas de mucha confianza. Una tanda no está protegida por ningún banco: si alguien deja de pagar, puedes perder tu dinero. Para guardar tu dinero seguro, pregunta en el Consulado por la Tarjeta Finabien o abre una cuenta de ahorro.",
    "Only join tandas with people you trust a lot. A tanda isn't protected by any bank: if someone stops paying, you can lose your money. To keep your money safe, ask at the Consulate about the Finabien card or open a savings account.",
  );
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><Lightbulb size={22} className="text-sun" /> {L(lang, "¿Qué es una tanda?", "What is a tanda?")}</h3>
          <ListenButton compact text={what} />
        </div>
        <p className="mt-2 text-lg">{what}</p>
        <p className="mt-3 text-base text-muted">{L(lang, "Ejemplo: son 10 personas y cada una pone $100 cada semana. Cada semana una se lleva $900, lo que ponen las otras 9.", "Example: 10 people, $100 each every week. Each week one person takes $900, what the other 9 put in.")}</p>
      </Card>
      <div className="rounded-3xl border-2 border-sun bg-sun-soft/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><ShieldAlert size={22} className="text-clay" /> {L(lang, "Cuida tu dinero", "Protect your money")}</h3>
          <ListenButton compact text={safe} />
        </div>
        <p className="mt-2 text-lg">{safe}</p>
      </div>
    </div>
  );
}
