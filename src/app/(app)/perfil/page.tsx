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

export default function Perfil() {
  const me = useMe()!;
  const lang = useLang();
  const en = lang === "en";
  const L = (es: string, en_: string) => (en ? en_ : es);
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
        title={L("Mi perfil", "My profile")}
        say={L("Aquí cambias tu foto, tu nombre, dónde vives, tu idioma y tu clave. Dónde vives decide los impuestos de tu sueldo y si tu dinero se ve en dólares o en pesos.", "Here you change your picture, name, where you live, your language and your PIN. Where you live decides the taxes on your pay and whether your money shows in dollars or pesos.")}
      />

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {/* Picture and name */}
        <Card className="md:row-span-2">
          <div className="flex flex-col items-center text-center">
            <button onClick={() => setPicking(true)} className="relative rounded-full ring-4 ring-sand transition hover:ring-clay/40" aria-label={L("Cambiar mi foto", "Change my picture")}>
              <Avatar id={p.avatar} name={p.name} size={132} />
              <span className="absolute right-1 bottom-1 flex h-10 w-10 items-center justify-center rounded-full bg-clay text-paper shadow"><Pencil size={18} /></span>
            </button>
            {pic ? (
              <p className="mt-3 max-w-sm text-base text-muted"><b className="text-ink">{avatarName(pic, lang)}.</b> {avatarFact(pic, lang)}</p>
            ) : (
              <p className="mt-3 text-base text-muted">{L("Elige un animal que solo vive en México.", "Pick an animal that only lives in Mexico.")}</p>
            )}
            <Button variant="soft" onClick={() => setPicking(true)} className="mt-3">{L("Elegir mi foto", "Pick my picture")}</Button>
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block text-lg font-bold">{L("Mi nombre", "My name")}</span>
            <div className="flex gap-2">
              <input value={name} onChange={(e) => { setName(e.target.value); setSavedName(false); }} className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-sand bg-paper px-4 text-xl font-bold outline-none focus:border-clay" autoComplete="given-name" />
              <button
                onClick={() => { if (name.trim()) { updateProfile({ name: name.trim() }); setSavedName(true); } }}
                disabled={!name.trim() || name.trim() === p.name}
                className="flex h-14 items-center gap-1 rounded-2xl bg-ink px-4 text-lg font-extrabold text-paper disabled:opacity-30"
              >
                <Check size={20} /> {L("Guardar", "Save")}
              </button>
            </div>
            {savedName && <span className="mt-1 block text-base font-bold text-leaf">{L("¡Listo!", "Done!")}</span>}
          </label>
          {current && current !== DEMO_PHONE && <p className="mt-4 text-base text-muted">{L("Mi teléfono", "My phone")}: <b className="text-ink">{formatPhoneKey(current)}</b></p>}
        </Card>

        {/* Where I live */}
        <Card>
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><MapPin className="text-clay" /> {L("Dónde vivo", "Where I live")}</h2>
          <p className="mt-2 text-xl font-bold">{region.country === "mx" ? "🇲🇽 " : "🇺🇸 "}{region.country === "mx" ? L("México", "Mexico") : regionLabel(region, lang).replace(/^la /, "")}{region.country === "us" && region.state === "NY" && !region.nyc ? L(" (fuera de la ciudad)", " (outside the city)") : ""}</p>
          <p className="mt-1 text-base text-muted">
            {region.country === "mx"
              ? L("Tu dinero se ve en pesos. Impuestos de México: ISR e IMSS.", "Your money shows in pesos. Mexico's taxes: ISR and IMSS.")
              : L("Tu dinero se ve en dólares. Calculamos los impuestos federales y de tu estado.", "Your money shows in dollars. We figure federal and state taxes.")}
          </p>
          <button
            onClick={() => updateProfile({ married: !p.married })}
            aria-pressed={!!p.married}
            className={cx("mt-4 flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left text-lg font-bold", p.married ? "border-leaf bg-leaf/10" : "border-sand")}
          >
            <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2", p.married ? "border-leaf bg-leaf text-paper" : "border-sand-dark")}>{p.married && <Check size={16} strokeWidth={3} />}</span>
            {region.country === "mx" ? L("Estoy casado(a)", "I'm married") : L("Hago mis impuestos junto con mi esposo(a)", "I file taxes together with my spouse")}
          </button>
          <Button variant="soft" onClick={() => setEditWhere(true)} className="mt-3 w-full">{L("Cambiar dónde vivo", "Change where I live")}</Button>
        </Card>

        {/* Language and security */}
        <Card>
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><ShieldCheck className="text-leaf" /> {L("Idioma y seguridad", "Language and security")}</h2>
          <div className="mt-3 grid gap-2">
            <button onClick={() => setLangOpen(true)} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-left text-lg font-bold hover:border-sand-dark">
              <Languages size={22} className="text-clay" /> <span className="flex-1">{L("Idioma", "Language")}: {langInfo(lang).name}</span>
            </button>
            <button onClick={() => setPinOpen(true)} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-left text-lg font-bold hover:border-sand-dark">
              <KeyRound size={22} className="text-clay" /> <span className="flex-1">{L("Cambiar mi clave", "Change my PIN")}</span>
            </button>
            <button onClick={() => setSafetyOpen(true)} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-left text-lg font-bold hover:border-sand-dark">
              <ShieldCheck size={22} className="text-clay" />
              <span className="flex-1">
                {L("Pregunta por si olvido mi clave", "Question in case I forget my PIN")}
                <span className="block text-base font-normal text-muted">{p.recoveryQ ? (RECOVERY_QUESTIONS.find((q) => q.id === p.recoveryQ)?.label[en ? "en" : "es"] ?? L("Lista", "Set")) : L("Todavía no la eliges", "Not set yet")}</span>
              </span>
            </button>
          </div>
        </Card>

        {/* Privacy and my data */}
        <Card className="md:col-span-2">
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><Lock className="text-clay" /> {L("Mi privacidad y mis datos", "My privacy and my data")} <BetaBadge className="ml-1" /></h2>
          <p className="mt-2 text-base text-muted">{L("Mi Camino está en beta: puede tener errores y cambiar. Tus datos son tuyos.", "Mi Camino is in beta: it may have mistakes and change. Your data is yours.")}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href="/privacidad" className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-lg font-bold hover:border-sand-dark"><ShieldCheck size={22} className="text-leaf" /> {L("Aviso de privacidad", "Privacy notice")}</Link>
            <Link href="/terminos" className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-lg font-bold hover:border-sand-dark"><FileText size={22} className="text-leaf" /> {L("Términos y condiciones", "Terms of use")}</Link>
            <button onClick={() => downloadMyData(me, current)} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-sand px-4 text-left text-lg font-bold hover:border-sand-dark"><Download size={22} className="text-clay" /> {L("Descargar mis datos", "Download my data")}</button>
            <button onClick={() => setDeleteOpen(true)} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-clay/40 px-4 text-left text-lg font-bold text-clay hover:border-clay"><Trash2 size={22} /> {L("Borrar mi cuenta", "Delete my account")}</button>
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
    <Sheet open={open} onClose={onClose} title={lang === "en" ? "Pick your picture" : "Elige tu foto"} wide>
      <p className="mb-4 text-lg">{lang === "en" ? "All of these animals live only in Mexico." : "Todos estos animales solo viven en México."}</p>
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
      <Button onClick={() => { if (sel) onPick(sel); onClose(); }} disabled={!sel} className="mt-4 w-full">{lang === "en" ? "Use this picture" : "Usar esta foto"}</Button>
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
    <Sheet open={open} onClose={onClose} title={en ? "Where do you live?" : "¿Dónde vives?"} wide>
      <RegionPicker lang={lang} value={v} onChange={setV} />
      {switching && hasMoney && (
        <p className="mt-4 rounded-2xl bg-sun-soft px-4 py-3 text-base">
          ⚠️ {v.country === "mx"
            ? (en ? "From now on your money shows in pesos. What you already wrote down does not change: if it was in dollars, edit it." : "Desde ahora tu dinero se ve en pesos. Lo que ya anotaste no cambia: si estaba en dólares, corrígelo.")
            : (en ? "From now on your money shows in dollars. What you already wrote down does not change: if it was in pesos, edit it." : "Desde ahora tu dinero se ve en dólares. Lo que ya anotaste no cambia: si estaba en pesos, corrígelo.")}
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
        {en ? "Save" : "Guardar"}
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
    <Sheet open={open} onClose={onClose} title={en ? "Change my PIN" : "Cambiar mi clave"}>
      {step === 3 ? (
        <div className="text-center">
          <p className="text-2xl font-bold text-leaf">{en ? "Your new PIN is saved." : "Tu nueva clave quedó guardada."}</p>
          <Button onClick={onClose} className="mt-5 w-full">{en ? "Done" : "Listo"}</Button>
        </div>
      ) : (
        <>
          <p className="mb-4 text-center text-xl font-bold">{step === 1 ? (en ? "Type your new 6-digit PIN" : "Escribe tu nueva clave de 6 números") : (en ? "Type it again" : "Escríbela otra vez")}</p>
          {step === 1 ? <PinPad value={pin} onChange={typePin} /> : <PinPad value={pin2} onChange={typePin2} />}
          {error && <p className="mt-4 text-center text-lg font-bold text-clay">{en ? "They don't match. Try again." : "No son iguales. Intenta otra vez."}</p>}
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
    <Sheet open={open} onClose={onClose} title={en ? "In case you forget your PIN" : "Por si olvidas tu clave"}>
      {msg ? (
        <div className="text-center">
          <p className="text-xl font-bold">{msg}</p>
          <Button onClick={onClose} className="mt-5 w-full">{en ? "Done" : "Listo"}</Button>
        </div>
      ) : (
        <RecoveryForm
          busy={busy}
          saveLabel={en ? "Save" : "Guardar"}
          onDone={async (q, a) => {
            setBusy(true);
            const ok = await setRecovery(q, a);
            setBusy(false);
            setMsg(ok ? (en ? "Saved. Only you know the answer." : "Guardada. Solo tú sabes la respuesta.") : (en ? "We couldn't save it online. Check your internet and try again." : "No pudimos guardarla en línea. Revisa tu internet e intenta otra vez."));
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
      ? (en ? "That PIN isn't right. Try again." : "Esa clave no es correcta. Intenta otra vez.")
      : (en ? "We couldn't reach the internet, so nothing was deleted. Try again when you're online." : "No pudimos conectarnos a internet, así que no se borró nada. Intenta otra vez cuando tengas conexión."));
  };
  return (
    <Sheet open={open} onClose={onClose} title={en ? "Delete my account" : "Borrar mi cuenta"}>
      {!sure ? (
        <>
          <p className="text-lg">{en ? "This erases your account and everything you saved: your money, goals, tandas and business, on this device and online. It can't be undone." : "Esto borra tu cuenta y todo lo que guardaste: tu dinero, metas, tandas y negocio, en este aparato y en línea. No se puede deshacer."}</p>
          <p className="mt-3 text-base text-muted">{en ? "Tip: download your data first if you want to keep a copy." : "Consejo: descarga tus datos antes si quieres guardar una copia."}</p>
          <Button onClick={() => setSure(true)} className="mt-5 w-full bg-clay">{en ? "Yes, I want to delete it" : "Sí, quiero borrarla"}</Button>
          <Button variant="soft" onClick={onClose} className="mt-3 w-full">{en ? "Keep my account" : "No, conservar mi cuenta"}</Button>
        </>
      ) : (
        <>
          <p className="mb-4 text-center text-xl font-bold">{en ? "Type your PIN to confirm" : "Escribe tu clave para confirmar"}</p>
          <PinPad value={pin} onChange={(v) => { if (!busy) void typePin(v); }} />
          {busy && <p className="mt-4 text-center text-lg font-bold">{en ? "Deleting…" : "Borrando…"}</p>}
          {msg && <p className="mt-4 text-center text-lg font-bold text-clay">{msg}</p>}
        </>
      )}
    </Sheet>
  );
}
