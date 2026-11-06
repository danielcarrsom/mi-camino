"use client";
// Mi perfil: picture, name, where you live (taxes and money), language and security.
import { useResetOn } from "@/lib/hooks";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Download, FileText, KeyRound, Languages, Lock, MapPin, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { BetaBadge } from "@/components/LegalPage";
import { Button, Card, PageHeader, PinPad, Sheet, cx } from "@/components/ui";
import { AVATARS, Avatar, avatarById, avatarFact, avatarName } from "@/components/Avatars";
import { RegionPicker, regionReady, type RegionValue } from "@/components/RegionPicker";
import { RecoveryForm } from "@/components/RecoverySetup";
import { LanguageSheet } from "@/components/AppShell";
import { DEMO_PHONE, regionOf, useLang, useMe, useStore, type UserData } from "@/lib/store";
import { langInfo } from "@/lib/i18n";
import { formatPhoneKey } from "@/lib/phone";
import { regionLabel } from "@/lib/taxes";
import { RECOVERY_QUESTIONS } from "@/lib/recovery";
import { tx } from "@/lib/i18n";
import TXT from "@/messages/perfil";

export default function Perfil() {
  const me = useMe()!;
  const lang = useLang();
  const en = lang === "en";
  const current = useStore((s) => s.current);
  const updateProfile = useStore((s) => s.updateProfile);
  const p = me.profile;
  const region = regionOf(p);

  const [picking, setPicking] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [editWhere, setEditWhere] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(p.name);
  const [savedName, setSavedName] = useState(false);
  useResetOn(p.name, () => setName(p.name));

  const pic = avatarById(p.avatar);
  const hasMoney = me.work.length > 0 || me.entries.length > 0 || me.goals.length > 0 || (me.business?.entries.length ?? 0) > 0;

  return (
    <>
      <PageHeader
        title={tx(lang, TXT.miPerfil)}
        say={tx(lang, TXT.aquiCambiasTuFotoTu)}
      />

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {/* Picture and name */}
        <Card className="md:row-span-2">
          <div className="flex flex-col items-center text-center">
            <button onClick={() => setPicking(true)} className="relative rounded-full ring-4 ring-sand transition hover:ring-clay/40" aria-label={tx(lang, TXT.cambiarMiFoto)}>
              <Avatar id={p.avatar} name={p.name} size={132} />
              <span className="absolute right-1 bottom-1 flex h-10 w-10 items-center justify-center rounded-full bg-clay text-paper shadow"><Pencil size={18} /></span>
            </button>
            {pic ? (
              <p className="mt-3 max-w-sm text-base text-muted"><b className="text-ink">{avatarName(pic, lang)}.</b> {avatarFact(pic, lang)}</p>
            ) : (
              <p className="mt-3 text-base text-muted">{tx(lang, TXT.eligeUnAnimalQueSolo)}</p>
            )}
            <Button variant="soft" onClick={() => setPicking(true)} className="mt-3">{tx(lang, TXT.elegirMiFoto)}</Button>
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block text-lg font-bold">{tx(lang, TXT.miNombre)}</span>
            <div className="flex gap-2">
              <input value={name} onChange={(e) => { setName(e.target.value); setSavedName(false); }} className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-sand bg-paper px-4 text-xl font-bold outline-none focus:border-clay" autoComplete="given-name" />
              <button
                onClick={() => { if (name.trim()) { updateProfile({ name: name.trim() }); setSavedName(true); } }}
                disabled={!name.trim() || name.trim() === p.name}
                className="flex h-14 items-center gap-1 rounded-2xl bg-ink px-4 text-lg font-extrabold text-paper disabled:opacity-30"
              >
                <Check size={20} /> {tx(lang, TXT.guardar)}
              </button>
            </div>
            {savedName && <span className="mt-1 block text-base font-bold text-leaf">{tx(lang, TXT.listo)}</span>}
          </label>
          {current && current !== DEMO_PHONE && <p className="mt-4 text-base text-muted">{tx(lang, TXT.miTelefono)}: <b className="text-ink">{formatPhoneKey(current)}</b></p>}
        </Card>

        {/* Where I live */}
        <Card>
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><MapPin className="text-clay" /> {tx(lang, TXT.dondeVivo)}</h2>
          <p className="mt-2 text-xl font-bold">{region.country === "mx" ? "🇲🇽 " : "🇺🇸 "}{region.country === "mx" ? tx(lang, TXT.mexico) : regionLabel(region, lang).replace(/^la /, "")}{region.country === "us" && region.state === "NY" && !region.nyc ? tx(lang, TXT.fueraDeLaCiudad) : ""}</p>
          <p className="mt-1 text-base text-muted">
            {region.country === "mx"
              ? tx(lang, TXT.tuDineroSeVeEn)
              : tx(lang, TXT.tuDineroSeVeEn2)}
          </p>
          <button
            onClick={() => updateProfile({ married: !p.married })}
            aria-pressed={!!p.married}
            className={cx("mt-4 flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left text-lg font-bold", p.married ? "border-leaf bg-leaf/10" : "border-sand")}
          >
            <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2", p.married ? "border-leaf bg-leaf text-paper" : "border-sand-dark")}>{p.married && <Check size={16} strokeWidth={3} />}</span>
            {region.country === "mx" ? tx(lang, TXT.estoyCasadoA) : tx(lang, TXT.hagoMisImpuestosJuntoCon)}
          </button>
          <Button variant="soft" onClick={() => setEditWhere(true)} className="mt-3 w-full">{tx(lang, TXT.cambiarDondeVivo)}</Button>
        </Card>

        {/* Language and security */}
        <Card>
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><ShieldCheck className="text-leaf" /> {tx(lang, TXT.idiomaYSeguridad)}</h2>
          <div className="mt-3 grid gap-2">
            <button onClick={() => setLangOpen(true)} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-left text-lg font-bold hover:border-sand-dark">
              <Languages size={22} className="text-clay" /> <span className="flex-1">{tx(lang, TXT.idioma)}: {langInfo(lang).name}</span>
            </button>
            <button onClick={() => setPinOpen(true)} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-left text-lg font-bold hover:border-sand-dark">
              <KeyRound size={22} className="text-clay" /> <span className="flex-1">{tx(lang, TXT.cambiarMiClave)}</span>
            </button>
            <button onClick={() => setSafetyOpen(true)} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-left text-lg font-bold hover:border-sand-dark">
              <ShieldCheck size={22} className="text-clay" />
              <span className="flex-1">
                {tx(lang, TXT.preguntaPorSiOlvidoMi)}
                <span className="block text-base font-normal text-muted">{p.recoveryQ ? (RECOVERY_QUESTIONS.find((q) => q.id === p.recoveryQ)?.label[en ? "en" : "es"] ?? tx(lang, TXT.lista)) : tx(lang, TXT.todaviaNoLaEliges)}</span>
              </span>
            </button>
          </div>
        </Card>

        {/* Privacy and my data */}
        <Card className="md:col-span-2">
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><Lock className="text-clay" /> {tx(lang, TXT.miPrivacidadYMisDatos)} <BetaBadge className="ml-1" /></h2>
          <p className="mt-2 text-base text-muted">{tx(lang, TXT.miCaminoEstaEnBeta)}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href="/privacidad" className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-lg font-bold hover:border-sand-dark"><ShieldCheck size={22} className="text-leaf" /> {tx(lang, TXT.avisoDePrivacidad)}</Link>
            <Link href="/terminos" className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-lg font-bold hover:border-sand-dark"><FileText size={22} className="text-leaf" /> {tx(lang, TXT.terminosYCondiciones)}</Link>
            <button onClick={() => downloadMyData(me, current)} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-left text-lg font-bold hover:border-sand-dark"><Download size={22} className="text-clay" /> {tx(lang, TXT.descargarMisDatos)}</button>
            <button onClick={() => setDeleteOpen(true)} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-clay/40 px-4 text-left text-lg font-bold text-clay hover:border-clay"><Trash2 size={22} /> {tx(lang, TXT.borrarMiCuenta)}</button>
          </div>
        </Card>
      </div>

      <AvatarSheet open={picking} onClose={() => setPicking(false)} value={p.avatar} onPick={(id) => updateProfile({ avatar: id })} />
      <WhereSheet open={editWhere} onClose={() => setEditWhere(false)} hasMoney={hasMoney} />
      <PinSheet open={pinOpen} onClose={() => setPinOpen(false)} />
      <SafetySheet open={safetyOpen} onClose={() => setSafetyOpen(false)} />
      <DeleteSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} />
      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </>
  );
}

function AvatarSheet({ open, onClose, value, onPick }: { open: boolean; onClose: () => void; value?: string; onPick: (id: string) => void }) {
  const lang = useLang();
  const [sel, setSel] = useState(value);
  useResetOn(open, () => { if (open) setSel(value); });
  const a = avatarById(sel);
  return (
    <Sheet open={open} onClose={onClose} title={tx(lang, TXT.eligeTuFoto)} wide>
      <p className="mb-4 text-lg">{tx(lang, TXT.todosEstosAnimalesSoloViven)}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AVATARS.map((x) => (
          <button key={x.id} onClick={() => setSel(x.id)} aria-pressed={sel === x.id}
            className={cx("flex flex-col items-center gap-2 rounded-3xl border-2 p-3 text-center transition", sel === x.id ? "border-clay bg-clay/10 ring-4 ring-clay/15" : "border-sand bg-paper hover:border-sand-dark")}>
            <Avatar id={x.id} size={84} />
            <span className="text-base leading-tight font-bold">{avatarName(x, lang)}</span>
          </button>
        ))}
      </div>
      {a && <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-base"><b>{avatarName(a, lang)}:</b> {avatarFact(a, lang)}</p>}
      <Button onClick={() => { if (sel) onPick(sel); onClose(); }} disabled={!sel} className="mt-4 w-full">{tx(lang, TXT.usarEstaFoto)}</Button>
    </Sheet>
  );
}

function WhereSheet({ open, onClose, hasMoney }: { open: boolean; onClose: () => void; hasMoney: boolean }) {
  const me = useMe()!;
  const lang = useLang();
  const en = lang === "en";
  const updateProfile = useStore((s) => s.updateProfile);
  const start = (): RegionValue => {
    const r = regionOf(me.profile);
    return { country: r.country, usState: r.state, nyc: r.nyc };
  };
  const [v, setV] = useState<RegionValue>(start);
  useResetOn(open, () => { if (open) setV(start()); });
  const switching = v.country !== regionOf(me.profile).country;
  return (
    <Sheet open={open} onClose={onClose} title={tx(en, TXT.dondeVives)} wide>
      <RegionPicker lang={lang} value={v} onChange={setV} />
      {switching && hasMoney && (
        <p className="mt-4 rounded-2xl bg-sun-soft px-4 py-3 text-base">
          ⚠️ {v.country === "mx"
            ? (tx(en, TXT.desdeAhoraTuDineroSe))
            : (tx(en, TXT.desdeAhoraTuDineroSe2))}
        </p>
      )}
      <Button
        onClick={() => {
          updateProfile({ country: v.country, usState: v.country === "us" ? v.usState : undefined, nyc: v.country === "us" && v.usState === "NY" ? !!v.nyc : undefined });
          onClose();
        }}
        disabled={!regionReady(v)}
        className="mt-5 w-full"
      >
        {tx(en, TXT.guardar)}
      </Button>
    </Sheet>
  );
}

function PinSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lang = useLang();
  const en = lang === "en";
  const changePin = useStore((s) => s.changePin);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState(false);
  useResetOn(open, () => { if (open) { setPin(""); setPin2(""); setStep(1); setError(false); } });
  const typePin = (v: string) => {
    setPin(v);
    if (v.length === 6) setTimeout(() => setStep(2), 250);
  };
  const typePin2 = (v: string) => {
    setPin2(v);
    if (v.length !== 6) return;
    if (v === pin) void changePin(pin).then(() => setStep(3));
    else { setError(true); setTimeout(() => { setPin(""); setPin2(""); setStep(1); setError(false); }, 1400); }
  };
  return (
    <Sheet open={open} onClose={onClose} title={tx(en, TXT.cambiarMiClave)}>
      {step === 3 ? (
        <div className="text-center">
          <p className="text-2xl font-bold text-leaf">{tx(en, TXT.tuNuevaClaveQuedoGuardada)}</p>
          <Button onClick={onClose} className="mt-5 w-full">{tx(en, TXT.listo2)}</Button>
        </div>
      ) : (
        <>
          <p className="mb-4 text-center text-xl font-bold">{step === 1 ? (tx(en, TXT.escribeTuNuevaClaveDe)) : (tx(en, TXT.escribelaOtraVez))}</p>
          {step === 1 ? <PinPad value={pin} onChange={typePin} /> : <PinPad value={pin2} onChange={typePin2} />}
          {error && <p className="mt-4 text-center text-lg font-bold text-clay">{tx(en, TXT.noSonIgualesIntentaOtra)}</p>}
        </>
      )}
    </Sheet>
  );
}

function SafetySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lang = useLang();
  const setRecovery = useStore((s) => s.setRecovery);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useResetOn(open, () => { if (open) setMsg(null); });
  const en = lang === "en";
  return (
    <Sheet open={open} onClose={onClose} title={tx(en, TXT.porSiOlvidasTuClave)}>
      {msg ? (
        <div className="text-center">
          <p className="text-xl font-bold">{msg}</p>
          <Button onClick={onClose} className="mt-5 w-full">{tx(en, TXT.listo2)}</Button>
        </div>
      ) : (
        <RecoveryForm
          busy={busy}
          saveLabel={tx(en, TXT.guardar)}
          onDone={async (q, a) => {
            setBusy(true);
            const ok = await setRecovery(q, a);
            setBusy(false);
            setMsg(ok ? (tx(en, TXT.guardadaSoloTuSabesLa)) : (tx(en, TXT.noPudimosGuardarlaEnLinea)));
          }}
        />
      )}
    </Sheet>
  );
}

/** Everything this person saved, as a file they can keep (their right to access their data). */
function downloadMyData(me: UserData, phone: string | null) {
  const file = { app: "Mi Camino", exportedAt: new Date().toISOString(), phone, data: me };
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `mi-camino-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DeleteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lang = useLang();
  const en = lang === "en";
  const deleteAccount = useStore((s) => s.deleteAccount);
  const router = useRouter();
  const [sure, setSure] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useResetOn(open, () => { if (open) { setSure(false); setPin(""); setBusy(false); setMsg(null); } });
  const typePin = async (v: string) => {
    setPin(v);
    setMsg(null);
    if (v.length !== 6) return;
    setBusy(true);
    const r = await deleteAccount(v);
    setBusy(false);
    if (r === "ok") { router.replace("/"); return; }
    setPin("");
    setMsg(r === "wrong"
      ? (tx(en, TXT.esaClaveNoEsCorrecta))
      : (tx(en, TXT.noPudimosConectarnosAInternet)));
  };
  return (
    <Sheet open={open} onClose={onClose} title={tx(en, TXT.borrarMiCuenta)}>
      {!sure ? (
        <>
          <p className="text-lg">{tx(en, TXT.estoBorraTuCuentaY)}</p>
          <p className="mt-3 text-base text-muted">{tx(en, TXT.consejoDescargaTusDatosAntes)}</p>
          <Button onClick={() => setSure(true)} className="mt-5 w-full bg-clay">{tx(en, TXT.siQuieroBorrarla)}</Button>
          <Button variant="soft" onClick={onClose} className="mt-3 w-full">{tx(en, TXT.noConservarMiCuenta)}</Button>
        </>
      ) : (
        <>
          <p className="mb-4 text-center text-xl font-bold">{tx(en, TXT.escribeTuClaveParaConfirmar)}</p>
          <PinPad value={pin} onChange={(v) => { if (!busy) void typePin(v); }} />
          {busy && <p className="mt-4 text-center text-lg font-bold">{tx(en, TXT.borrando)}</p>}
          {msg && <p className="mt-4 text-center text-lg font-bold text-clay">{msg}</p>}
        </>
      )}
    </Sheet>
  );
}
