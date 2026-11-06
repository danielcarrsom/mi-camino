"use client";
// One tanda: who receives when, what you paid and the circle of turns.
import { useNow } from "@/lib/hooks";
import { useState } from "react";
import { Pencil, Check, Users, HandCoins, CalendarDays, PartyPopper } from "lucide-react";
import { Button, Card, ListenButton, cx } from "@/components/ui";
import { useLang, useMe, useStore, tandaCurrentRound, tandaEnded, tandaPayoutDate, tandaPot, tandaRoundDate, type Tanda } from "@/lib/store";
import { money, moneySpoken, isThisWeek } from "@/lib/money";
import { speak } from "@/lib/voice";
import { playGoal, playSaved } from "@/lib/sound";
import type { Lang } from "@/lib/i18n";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/casita-tanda";
import { dateWord, everyWord, personName } from "./helpers";

// ---------- One tanda ----------
export function TandaView({ t, onEdit }: { t: Tanda; onEdit: () => void }) {
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

export function Fact({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-cream p-3">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="font-serif text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted">{sub}</p>
    </div>
  );
}

// ---------- The circle of people ----------
export function TandaCircle({ people, current, myTurn, paidRounds, size, lang }: { people: number; current: number; myTurn: number; paidRounds: number[]; size: number; lang: Lang }) {
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
