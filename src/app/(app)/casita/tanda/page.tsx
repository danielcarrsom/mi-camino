"use client";
import { useNow, useResetOn } from "@/lib/hooks";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Check, Users, ShieldAlert, Lightbulb, HandCoins, CalendarDays, PartyPopper } from "lucide-react";
import { AmountInput, Button, Card, ListenButton, PageHeader, Sheet, cx } from "@/components/ui";
import { Stepper } from "@/components/MoneyForms";
import { useLang, useMe, useStore, tandaCurrentRound, tandaEnded, tandaPayoutDate, tandaPot, tandaRoundDate, type Tanda } from "@/lib/store";
import { money, moneySpoken, isThisWeek } from "@/lib/money";
import { speak } from "@/lib/voice";
import { playGoal, playSaved } from "@/lib/sound";
import type { Lang } from "@/lib/i18n";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/casita-tanda";

const L = (lang: Lang, es: string, en: string) => (lang === "en" ? en : es);
const everyWord = (lang: Lang, e: Tanda["every"]) =>
  e === "week" ? tx(lang, TXT.cadaSemana) : e === "2weeks" ? tx(lang, TXT.cada2Semanas) : tx(lang, TXT.cadaMes);
const dateWord = (lang: Lang, d: Date) => d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { day: "numeric", month: "long" });
const personName = (lang: Lang, t: Tanda, i: number) =>
  i === t.myTurn - 1 ? tx(lang, TXT.tu) : t.names[i]?.trim() || `${tx(lang, TXT.persona)} ${i + 1}`;

export default function TandaPage() {
  const lang = useLang();
  const me = useMe()!;
  const tandas = me.tandas ?? [];
  const [editing, setEditing] = useState<Tanda | "new" | null>(null);

  const intro = tx(lang, TXT.miTandaAquiLlevasLa);

  return (
    <>
      <PageHeader
        title={tx(lang, TXT.miTanda)}
        sub={tx(lang, TXT.ahorrarJuntosPorTurnos)}
        say={intro}
        right={tandas.length > 0 ? <span className="hidden md:block"><Button onClick={() => setEditing("new")} className="min-h-12 px-4 text-base"><Plus size={20} /> {tx(lang, TXT.nuevaTanda)}</Button></span> : undefined}
      />

      {tandas.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Card className="flex flex-col items-center py-10 text-center">
            <TandaCircle people={8} current={2} myTurn={5} paidRounds={[0, 1]} size={220} lang={lang} />
            <h2 className="mt-4 text-2xl font-semibold">{tx(lang, TXT.estasEnUnaTanda)}</h2>
            <p className="mt-2 max-w-md text-lg text-muted">
              {tx(lang, TXT.anotalaAquiYTeAvisamos)}
            </p>
            <Button onClick={() => setEditing("new")} className="mt-6"><Plus size={22} /> {tx(lang, TXT.anotarMiTanda)}</Button>
          </Card>
          <WhatIsTanda lang={lang} />
        </div>
      ) : (
        <div className="space-y-8">
          {tandas.map((t) => <TandaView key={t.id} t={t} onEdit={() => setEditing(t)} />)}
          <Button onClick={() => setEditing("new")} variant="soft" className="w-full md:hidden"><Plus size={22} /> {tx(lang, TXT.nuevaTanda)}</Button>
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
  const now = useNow();
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
    t.received ? tx(lang, TXT.yaRecibisteTuTanda)
    : myTurnNow ? tx(lang, TXT.estaVueltaTeTocaRecibir)
    : payout.getTime() > now ? `${tx(lang, TXT.teTocaRecibirEl)} ${dateWord(lang, payout)}`
    : tx(lang, TXT.tuTurnoYaPasoMarca);

  const say = `${t.name}. ${tx(lang, TXT.pones)} ${moneySpoken(t.amount, lang)} ${everyWord(lang, t.every)}. ${tx(lang, TXT.son)} ${t.people} ${tx(lang, TXT.personasElQueRecibeSe)} ${moneySpoken(pot, lang)}. ${status}.`;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Users size={26} className="text-clay" /> {t.name}</h2>
        <div className="flex gap-2">
          <ListenButton compact text={say} />
          <button onClick={onEdit} aria-label={tx(lang, TXT.cambiar)} className="flex h-12 w-12 items-center justify-center rounded-full bg-sand/60 hover:bg-sun-soft"><Pencil size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr] lg:gap-6">
        <Card className="relative flex flex-col items-center p-6 text-center">
          {party && (
            <div className="pop-in absolute top-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-sun px-5 py-2.5 text-lg font-extrabold whitespace-nowrap shadow-lg">
              <PartyPopper size={22} /> {tx(lang, TXT.recibisteTuTanda)}
            </div>
          )}
          <TandaCircle people={t.people} current={ended ? t.people : current} myTurn={t.myTurn} paidRounds={t.paid} size={260} lang={lang} />
          <p className={cx("mt-3 rounded-full px-4 py-2 text-lg font-extrabold", myTurnNow && !t.received ? "bg-sun text-ink" : t.received ? "bg-leaf-soft text-leaf" : "bg-sand/60")}>{status}</p>
          <div className="mt-5 grid w-full grid-cols-3 gap-2">
            <Fact label={tx(lang, TXT.pones)} value={money(t.amount, lang)} sub={everyWord(lang, t.every)} />
            <Fact label={tx(lang, TXT.recibes)} value={money(pot, lang)} sub={tx(lang, TXT.unaVez)} />
            <Fact label={tx(lang, TXT.tuTurno)} value={`#${t.myTurn}`} sub={dateWord(lang, payout)} />
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
                  ? txf(lang, TXT.recibisteTuTandaPusimosEn, [moneySpoken(pot, lang), goal.name])
                  : tx(lang, TXT.recibisteTuTanda), lang);
              }}
              className="mt-5 w-full"
            >
              <HandCoins size={24} /> {tx(lang, TXT.yaRecibiMiTanda)}
            </Button>
          )}
          {!myTurnNow && !t.received && payout.getTime() < now && (
            <Button variant="soft" onClick={() => receive(t.id)} className="mt-5 w-full"><Check size={22} /> {tx(lang, TXT.yaLaRecibi)}</Button>
          )}
          {goal && (
            <p className="mt-4 text-base text-muted">
              {t.received ? tx(lang, TXT.seFueATuMeta) : tx(lang, TXT.cuandoLaRecibasVaA)} <b className="text-ink">{goal.name}</b>
            </p>
          )}
        </Card>

        <div className="space-y-5">
          {/* This round */}
          {!ended && current >= 0 && (
            <Card dark>
              <p className="text-lg text-paper/75">{tx(lang, TXT.estaVuelta)} · {roundShown + 1} {tx(lang, TXT.de)} {t.people}</p>
              <p className="mt-1 text-2xl font-semibold">
                {tx(lang, TXT.recibe)} {personName(lang, t, roundShown)}
              </p>
              <p className="mt-1 text-paper/75">{dateWord(lang, tandaRoundDate(t, roundShown))}</p>
              {roundShown === myRoundIdx ? (
                <p className="mt-5 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-sun px-4 text-center text-lg font-extrabold text-ink">
                  <HandCoins size={26} /> {txf(lang, TXT.estaVueltaNoPagasTe, [money(pot, lang)])}
                </p>
              ) : (
              <button
                onClick={() => { toggle(t.id, roundShown); if (!t.paid.includes(roundShown)) { playSaved(); speak(tx(lang, TXT.listoAnotamosTuPagoDe), lang); } }}
                className={cx("mt-5 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl text-lg font-extrabold transition", t.paid.includes(roundShown) ? "bg-leaf text-paper" : "bg-clay text-paper shadow-[0_4px_0_#8f3a20]")}
              >
                {t.paid.includes(roundShown) ? <><Check size={26} /> {tx(lang, TXT.yaPagueEstaVuelta)}</> : <>{tx(lang, TXT.yaPague)} {money(t.amount, lang)}</>}
              </button>
              )}
              {nextRound !== null && (
                <p className="mt-4 flex items-center gap-2 text-base text-paper/75">
                  <CalendarDays size={18} /> {tx(lang, TXT.siguientePago)} {dateWord(lang, tandaRoundDate(t, nextRound))}
                </p>
              )}
            </Card>
          )}
          {current < 0 && (
            <Card dark>
              <p className="text-lg text-paper/75">{tx(lang, TXT.laTandaEmpiezaEl)}</p>
              <p className="text-3xl font-semibold">{dateWord(lang, tandaRoundDate(t, 0))}</p>
            </Card>
          )}

          {/* Every round */}
          <Card className="p-2 md:p-2">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <h3 className="text-xl font-semibold">{tx(lang, TXT.todasLasVueltas)}</h3>
              <span className="text-base font-bold text-muted">{tx(lang, TXT.pagaste)} {paidCount}/{t.people - 1}</span>
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
                      <span className="block truncate">{personName(lang, t, i)}{mine ? ` · ${tx(lang, TXT.recibes2)} ${money(pot, lang)}` : ""}</span>
                      <span className="block text-sm font-normal text-muted">{dateWord(lang, tandaRoundDate(t, i))}</span>
                    </span>
                    {mine ? (
                      <span className="rounded-xl bg-sun-soft px-3 py-2 text-sm font-bold">{tx(lang, TXT.noPagas)}</span>
                    ) : started ? (
                      <button
                        onClick={() => toggle(t.id, i)}
                        aria-pressed={paid}
                        className={cx("flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold", paid ? "bg-leaf-soft text-leaf" : "border-2 border-clay text-clay")}
                      >
                        {paid ? <><Check size={18} /> {tx(lang, TXT.pagado)}</> : tx(lang, TXT.sinPagar)}
                      </button>
                    ) : (
                      <span className="text-sm text-muted">{tx(lang, TXT.pronto)}</span>
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
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`${tx(lang, TXT.vuelta)} ${Math.min(current + 1, people)} / ${people}`}>
      <circle cx="100" cy="100" r={R} fill="none" stroke="#eadfcb" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" />
      {Array.from({ length: people }).map((_, i) => {
        const a = (i / people) * Math.PI * 2 - Math.PI / 2;
        const x = 100 + R * Math.cos(a), y = 100 + R * Math.sin(a);
        const mine = i === myTurn - 1;
        const done = i < current;
        const now = i === current;
        const fill = now ? "#e0a33a" : mine ? "#b34a2a" : done ? "#316a42" : "#fffbf3";
        const stroke = now ? "#b07a1a" : mine ? "#8f3a20" : done ? "#2d5c3a" : "#d9cbb2";
        return (
          <g key={i}>
            {now && <circle cx={x} cy={y} r={seat + 6} fill="#e0a33a" opacity="0.3" />}
            <circle cx={x} cy={y} r={seat} fill={fill} stroke={stroke} strokeWidth="2" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={seat > 12 ? 11 : 9} fontWeight="800" fill={now || mine || done ? "#fffbf3" : "#5b5a52"}>
              {mine ? tx(lang, TXT.tu) : i + 1}
            </text>
            {done && paidRounds.includes(i) && !mine && <circle cx={x + seat * 0.75} cy={y - seat * 0.75} r="4" fill="#fffbf3" stroke="#316a42" strokeWidth="1.5" />}
          </g>
        );
      })}
      <text x="100" y="94" textAnchor="middle" fontSize="12" fill="#5b5a52" fontWeight="700">
        {current >= people ? tx(lang, TXT.termino) : current < 0 ? tx(lang, TXT.porEmpezar) : tx(lang, TXT.vuelta)}
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

  useResetOn(open, () => {
    if (!open) return;
    setName(tanda?.name ?? tx(lang, TXT.tandaDeLaFamilia));
    setAmount(tanda ? String(tanda.amount) : "");
    setEvery(tanda?.every ?? "week");
    setPeople(tanda?.people ?? 10);
    setMyTurn(tanda?.myTurn ?? 1);
    setStart(tanda ? tanda.start.slice(0, 10) : today);
    setGoalId(tanda?.goalId ?? null);
    setNames(tanda?.names ?? []);
    setShowNames(false);
  });
  useEffect(() => {
    if (open && !tanda) speak(tx(lang, TXT.anotaTuTandaCuantoPone), lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);


  const draft: Tanda = useMemo(() => ({
    id: "x", name, amount: Number(amount) || 0, every, people, names, myTurn,
    start: new Date(start + "T12:00:00").toISOString(), paid: [], received: false, goalId, createdAt: "",
  }), [name, amount, every, people, names, myTurn, start, goalId]);
  const pot = tandaPot(draft);

  const save = () => {
    const data = { name: name.trim() || tx(lang, TXT.miTanda), amount: Number(amount), every, people, names: names.slice(0, people), myTurn, start: draft.start, goalId };
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
    <Sheet open={open} onClose={onClose} title={tanda ? tx(lang, TXT.cambiarMiTanda) : tx(lang, TXT.anotarMiTanda)} wide>
      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-lg font-bold">{tx(lang, TXT.comoSeLlamaTuTanda)}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg font-bold outline-none focus:border-clay" />
        </label>

        <AmountInput label={tx(lang, TXT.cuantoPoneCadaPersona)} value={amount} onChange={setAmount} />

        <div>
          <p className="mb-2 text-lg font-bold">{tx(lang, TXT.cadaCuantoSePaga)}</p>
          <div className="grid grid-cols-3 gap-2">
            {EVERY.map((e) => (
              <button key={e.id} onClick={() => setEvery(e.id)} className={cx("min-h-14 rounded-2xl border-2 px-2 text-base font-bold", every === e.id ? "border-clay bg-clay text-paper" : "border-sand bg-paper")}>
                {L(lang, e.es, e.en)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Stepper label={tx(lang, TXT.cuantasPersonasSon)} value={people} min={2} max={40} step={1} onChange={(n) => { setPeople(n); if (myTurn > n) setMyTurn(n); }} />
          <Stepper label={tx(lang, TXT.queNumeroTeToca)} value={myTurn} min={1} max={people} step={1} onChange={setMyTurn} />
        </div>

        <label className="block">
          <span className="mb-2 block text-lg font-bold">{tx(lang, TXT.cuandoEsElPrimerPago)}</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value || today)} className="h-14 w-full rounded-2xl border-2 border-sand bg-paper px-4 text-lg font-bold outline-none focus:border-clay" />
        </label>

        {me.goals.length > 0 && (
          <div>
            <p className="mb-2 text-lg font-bold">{tx(lang, TXT.aQueMetaVaEl)}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setGoalId(null)} className={cx("min-h-12 rounded-full border-2 px-4 font-bold", goalId === null ? "border-clay bg-clay text-paper" : "border-sand bg-paper")}>{tx(lang, TXT.ninguna)}</button>
              {me.goals.map((g) => (
                <button key={g.id} onClick={() => setGoalId(g.id)} className={cx("min-h-12 rounded-full border-2 px-4 font-bold", goalId === g.id ? "border-clay bg-clay text-paper" : "border-sand bg-paper")}>{g.name}</button>
              ))}
            </div>
          </div>
        )}

        <div>
          <button onClick={() => setShowNames((v) => !v)} className="inline-flex h-11 items-center gap-2 rounded-full px-1 font-bold text-clay">
            <Users size={20} /> {showNames ? tx(lang, TXT.ocultarNombres) : tx(lang, TXT.ponerLosNombresOpcional)}
          </button>
          {showNames && (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Array.from({ length: people }).map((_, i) => (
                <label key={i} className="flex items-center gap-2">
                  <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold", i === myTurn - 1 ? "bg-clay text-paper" : "bg-sand/70")}>{i + 1}</span>
                  {i === myTurn - 1 ? (
                    <span className="flex h-12 flex-1 items-center rounded-xl bg-paper px-3 font-bold">{tx(lang, TXT.tu)}</span>
                  ) : (
                    <input
                      value={names[i] ?? ""}
                      onChange={(e) => setNames((n) => { const c = [...n]; c[i] = e.target.value; return c; })}
                      placeholder={`${tx(lang, TXT.persona)} ${i + 1}`}
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
              {tx(lang, TXT.cadaQuienPone)} <b>{money(Number(amount), lang)}</b> {everyWord(lang, every)}. {tx(lang, TXT.son)} {people} {tx(lang, TXT.personasElQueRecibeNo)} <b className="text-sun">{money(pot, lang)}</b>.
            </p>
            <p className="mt-2 text-lg">
              {tx(lang, TXT.teTocaRecibirEnLa)} <b>{myTurn}</b>: <b className="text-sun">{dateWord(lang, tandaPayoutDate(draft))}</b>.
            </p>
            <p className="mt-2 text-base text-paper/70">
              {txf(lang, TXT.enTotalPonesTodasLas, [money(pot, lang)])}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {tanda && (
            <Button variant="soft" onClick={() => { if (window.confirm(tx(lang, TXT.borrarEstaTanda))) { removeTanda(tanda.id); onClose(); } }} className="flex-1 text-clay">
              {tx(lang, TXT.borrar)}
            </Button>
          )}
          <Button onClick={save} disabled={!Number(amount)} className="flex-[2]"><Check size={22} /> {tx(lang, TXT.guardar)}</Button>
        </div>
      </div>
    </Sheet>
  );
}

// ---------- Plain explanation + safety ----------
function WhatIsTanda({ lang }: { lang: Lang }) {
  const what = tx(lang, TXT.unaTandaEsUnGrupo);
  const safe = tx(lang, TXT.hazTandasSoloConPersonas);
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><Lightbulb size={22} className="text-sun" /> {tx(lang, TXT.queEsUnaTanda)}</h3>
          <ListenButton compact text={what} />
        </div>
        <p className="mt-2 text-lg">{what}</p>
        <p className="mt-3 text-base text-muted">{tx(lang, TXT.ejemploSon10PersonasY)}</p>
      </Card>
      <div className="rounded-3xl border-2 border-sun bg-sun-soft/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><ShieldAlert size={22} className="text-clay" /> {tx(lang, TXT.cuidaTuDinero)}</h3>
          <ListenButton compact text={safe} />
        </div>
        <p className="mt-2 text-lg">{safe}</p>
      </div>
    </div>
  );
}
