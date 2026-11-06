"use client";
// Adding or editing a tanda.
import { useResetOn } from "@/lib/hooks";
import { useEffect, useMemo, useState } from "react";
import { Check, Users } from "lucide-react";
import { AmountInput, Button, Sheet, cx } from "@/components/ui";
import { Stepper } from "@/components/MoneyForms";
import { useLang, useMe, useStore, tandaPayoutDate, tandaPot, type Tanda } from "@/lib/store";
import { money } from "@/lib/money";
import { speak } from "@/lib/voice";
import { playSaved } from "@/lib/sound";
import { tx, txf } from "@/lib/i18n";
import TXT from "@/messages/casita-tanda";
import { L, dateWord, everyWord } from "./helpers";

// ---------- Create / change a tanda ----------
export function TandaForm({ open, tanda, onClose }: { open: boolean; tanda: Tanda | null; onClose: () => void }) {
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
