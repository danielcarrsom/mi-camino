"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  House, Target, Wallet, Users, Cloud, CloudOff, RefreshCw, FileSearch, Send, BookOpen, Store, Plus, Menu, LogOut, Languages, Volume2, VolumeX
} from "lucide-react";
import { Logo, Sheet, cx } from "./ui";
import { useLang, useMe, useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { LANGS, langInfo } from "@/lib/i18n";
import { stopSpeaking } from "@/lib/voice";
import type { TKey } from "@/lib/i18n";

type NavItem = { href: string; key: TKey; icon: typeof House; exact?: boolean };

const CASITA: NavItem[] = [
  { href: "/casita", key: "home", icon: House, exact: true },
  { href: "/casita/metas", key: "myGoals", icon: Target },
  { href: "/casita/dinero", key: "myMoney", icon: Wallet },
  { href: "/casita/tanda", key: "myTanda", icon: Users },
  { href: "/casita/documentos", key: "documents", icon: FileSearch },
  { href: "/casita/enviar", key: "send", icon: Send },
  { href: "/aprender", key: "learn", icon: BookOpen },
];

const NEGOCIO: NavItem[] = [
  { href: "/negocio", key: "home", icon: Store, exact: true },
  { href: "/negocio/dinero", key: "myMoney", icon: Wallet },
  { href: "/negocio/metas", key: "myGoals", icon: Target },
  { href: "/aprender", key: "learn", icon: BookOpen },
];
const NEGOCIO_MORE: NavItem[] = [
  { href: "/aprender", key: "learn", icon: BookOpen },
  { href: "/casita/documentos", key: "documents", icon: FileSearch },
];

function isActive(path: string, item: NavItem) {
  return item.exact ? path === item.href : path === item.href || path.startsWith(item.href + "/");
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const t = useT();
  const me = useMe();
  const [more, setMore] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const inNegocio = path.startsWith("/negocio");

  return (
    <div className="min-h-dvh md:flex">
      {/* ---------- Computer: sidebar ---------- */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col bg-ink p-5 text-paper md:flex">
        <Link href="/inicio" className="mb-8 px-2"><Logo light /></Link>

        <ModuleSwitch inNegocio={inNegocio} />

        <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label={t("menu")}>
          {(inNegocio ? NEGOCIO : CASITA).map((item) => {
            const active = isActive(path, item);
            const I = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex h-13 items-center gap-3 rounded-2xl px-4 text-[1.05rem] font-bold transition",
                  active ? "bg-paper text-ink" : "text-paper/80 hover:bg-paper/10 hover:text-paper",
                )}
                aria-current={active ? "page" : undefined}
              >
                <I size={22} /> {t(item.key)}
              </Link>
            );
          })}
          <Link href={inNegocio ? "/negocio/anotar" : "/casita/anotar"} className="mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-clay text-lg font-extrabold text-paper hover:bg-clay-dark">
            <Plus size={24} /> {t("addSpent").split(" ")[0]}
          </Link>
        </nav>

        <div className="mt-6 space-y-1 border-t border-paper/15 pt-4">
          <SettingsButtons onLang={() => setLangOpen(true)} dark />
          {me && <p className="px-4 pt-2 text-sm text-paper/60">{me.profile.name}</p>}
          <CloudBadge dark />
        </div>
      </aside>

      {/* ---------- Phone: top bar ---------- */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-sand bg-cream/95 px-4 backdrop-blur md:hidden">
        <Link href="/inicio"><Logo /></Link>
        <div className="flex items-center gap-1">
          <VoiceToggle />
          <button onClick={() => setLangOpen(true)} className="flex h-12 items-center gap-1.5 rounded-full px-3 font-bold hover:bg-sand/60" aria-label="Idioma">
            <Languages size={22} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-32 md:px-10 md:pt-10 md:pb-16">{children}</main>

      {/* ---------- Phone: bottom tabs ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-paper pb-[env(safe-area-inset-bottom)] md:hidden" aria-label={t("menu")}>
        <div className="mx-auto grid h-20 max-w-lg grid-cols-5 items-center">
          {inNegocio ? (
            <>
              <Tab href="/negocio" icon={Store} label={t("home")} active={path === "/negocio"} />
              <Tab href="/negocio/metas" icon={Target} label={t("myGoals").replace("Mis ", "").replace("My ", "")} active={path.startsWith("/negocio/metas")} />
              <Link href="/negocio/anotar" aria-label={t("addSpent")} className="mx-auto -mt-8 flex h-18 w-18 items-center justify-center rounded-full bg-clay text-paper shadow-[0_5px_0_#8f3a20]">
                <Plus size={36} strokeWidth={2.5} />
              </Link>
              <Tab href="/negocio/dinero" icon={Wallet} label={t("myMoney").replace("Mi ", "").replace("My ", "")} active={path.startsWith("/negocio/dinero")} />
            </>
          ) : (
            <>
              <Tab href="/casita" icon={House} label={t("home")} active={path === "/casita"} />
              <Tab href="/casita/metas" icon={Target} label={t("myGoals").replace("Mis ", "").replace("My ", "")} active={path.startsWith("/casita/metas")} />
              <Link href="/casita/anotar" aria-label={t("addSpent")} className="mx-auto -mt-8 flex h-18 w-18 items-center justify-center rounded-full bg-clay text-paper shadow-[0_5px_0_#8f3a20]">
                <Plus size={36} strokeWidth={2.5} />
              </Link>
              <Tab href="/casita/dinero" icon={Wallet} label={t("myMoney").replace("Mi ", "").replace("My ", "")} active={path.startsWith("/casita/dinero")} />
            </>
          )}
          <button onClick={() => setMore(true)} className="flex flex-col items-center gap-1 text-sm font-bold text-muted">
            <Menu size={26} /> {t("menu")}
          </button>
        </div>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title={t("menu")}>
        <div className="mb-4"><ModuleSwitch inNegocio={inNegocio} onPick={() => setMore(false)} /></div>
        <div className="grid grid-cols-2 gap-3">
          {(inNegocio ? NEGOCIO_MORE : CASITA.slice(3)).map((item) => {
            const I = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setMore(false)} className="flex min-h-24 flex-col items-start justify-between rounded-3xl border-2 border-sand bg-paper p-4 font-extrabold">
                <I size={28} className="text-clay" /> {t(item.key)}
              </Link>
            );
          })}
        </div>
        <div className="mt-4"><CloudBadge /></div>
        <div className="mt-3 space-y-1">
          <SettingsButtons onLang={() => { setMore(false); setLangOpen(true); }} />
        </div>
      </Sheet>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </div>
  );
}

function CloudBadge({ dark }: { dark?: boolean }) {
  const status = useStore((s) => s.cloud);
  const lang = useLang();
  if (status === "off") return null;
  const en = lang === "en";
  const text = status === "saved" ? (en ? "Saved online" : "Guardado en línea") : status === "syncing" ? (en ? "Saving…" : "Guardando…") : en ? "Only on this device" : "Solo en este dispositivo";
  const I = status === "saved" ? Cloud : status === "syncing" ? RefreshCw : CloudOff;
  return (
    <p className={cx("flex items-center gap-2 px-4 text-sm font-bold", dark ? (status === "local" ? "text-sun" : "text-paper/60") : status === "local" ? "text-warn" : "text-muted")}>
      <I size={16} className={status === "syncing" ? "animate-spin" : undefined} /> {text}
    </p>
  );
}

function Tab({ href, icon: I, label, active }: { href: string; icon: typeof House; label: string; active: boolean }) {
  return (
    <Link href={href} className={cx("flex flex-col items-center gap-1 text-sm font-bold", active ? "text-clay" : "text-muted")} aria-current={active ? "page" : undefined}>
      <I size={26} strokeWidth={active ? 2.6 : 2} /> <span className="capitalize">{label}</span>
    </Link>
  );
}

function ModuleSwitch({ inNegocio, onPick }: { inNegocio: boolean; onPick?: () => void }) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-sand/40 p-1 md:bg-paper/10">
      <Link href="/casita" onClick={onPick} className={cx("flex h-12 items-center justify-center gap-2 rounded-xl font-extrabold", !inNegocio ? "bg-clay text-paper" : "text-ink md:text-paper/80")}>
        <House size={20} /> {t("casita")}
      </Link>
      <Link href="/negocio" onClick={onPick} className={cx("flex h-12 items-center justify-center gap-2 rounded-xl font-extrabold", inNegocio ? "bg-clay text-paper" : "text-ink md:text-paper/80")}>
        <Store size={20} /> {t("negocio")}
      </Link>
    </div>
  );
}

function VoiceToggle({ dark }: { dark?: boolean }) {
  const voiceOn = useStore((s) => s.voiceOn);
  const setVoiceOn = useStore((s) => s.setVoiceOn);
  return (
    <button
      onClick={() => { if (voiceOn) stopSpeaking(); setVoiceOn(!voiceOn); }}
      aria-pressed={voiceOn}
      aria-label="Leer en voz alta"
      className={cx("flex h-12 w-12 items-center justify-center rounded-full", voiceOn ? "bg-sun text-ink" : dark ? "text-paper/80 hover:bg-paper/10" : "hover:bg-sand/60")}
    >
      {voiceOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
    </button>
  );
}

function SettingsButtons({ onLang, dark }: { onLang: () => void; dark?: boolean }) {
  const t = useT();
  const lang = useLang();
  const voiceOn = useStore((s) => s.voiceOn);
  const setVoiceOn = useStore((s) => s.setVoiceOn);
  const logout = useStore((s) => s.logout);
  const router = useRouter();
  const row = cx("flex h-12 w-full items-center gap-3 rounded-2xl px-4 font-bold", dark ? "text-paper/80 hover:bg-paper/10" : "hover:bg-sand/60");
  return (
    <>
      <button className={row} onClick={onLang}><Languages size={22} /> {langInfo(lang).name}</button>
      <button className={row} onClick={() => { if (voiceOn) stopSpeaking(); setVoiceOn(!voiceOn); }} aria-pressed={voiceOn}>
        {voiceOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
        {lang === "en" ? (voiceOn ? "Reading aloud: on" : "Reading aloud: off") : voiceOn ? "Leer en voz alta: sí" : "Leer en voz alta: no"}
      </button>
      <button className={row} onClick={() => { logout(); router.push("/"); }}><LogOut size={22} /> {t("logout")}</button>
    </>
  );
}

export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const setLang = useStore((s) => s.setDeviceLang);
  return (
    <Sheet open={open} onClose={onClose} title={t("pickLang")}>
      <div className="grid gap-2">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => { setLang(l.code); onClose(); }}
            className={cx("flex min-h-16 items-center justify-between rounded-2xl border-2 bg-paper px-4 text-left", lang === l.code ? "border-clay" : "border-sand")}
          >
            <span>
              <span className="block text-lg font-extrabold">{l.name}</span>
              <span className="block text-base text-muted">{l.label} · {l.region}</span>
            </span>
            {l.indigenous && <span className="rounded-full bg-sun-soft px-3 py-1 text-sm font-bold">{t("audioComing")}</span>}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

