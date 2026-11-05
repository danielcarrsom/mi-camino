"use client";
import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { Volume2, Square, ArrowLeft, Mic, X, Delete } from "lucide-react";
import { speak, stopSpeaking, useSpeaking, useListen } from "@/lib/voice";
import { useLang, useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import type { TKey } from "@/lib/i18n";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// ---------- Logo ----------
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#2c3a35" />
      <path d="M8 40 C 16 34, 22 38, 30 32" stroke="#e0a33a" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="0.1 5.5" />
      <path d="M22 21 L32 12 L42 21 Z" fill="#b34a2a" />
      <rect x="25" y="21" width="14" height="12" rx="1.5" fill="#fffbf3" />
      <rect x="30" y="25" width="4" height="8" rx="1" fill="#e0a33a" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className={cx("font-serif text-2xl font-semibold", light ? "text-paper" : "text-ink")}>Mi Camino</span>
    </span>
  );
}

// ---------- Listening to the screen ----------
export function ListenButton({ text, audioKey, compact = false, light = false }: { text: string; audioKey?: string; compact?: boolean; light?: boolean }) {
  const lang = useLang();
  const t = useT();
  const speaking = useSpeaking();
  return (
    <button
      type="button"
      onClick={() => (speaking ? stopSpeaking() : speak(text, lang, audioKey))}
      aria-label={speaking ? t("stop") : t("listen")}
      className={cx(
        "inline-flex shrink-0 items-center gap-2 rounded-full font-bold transition",
        compact ? "h-12 w-12 justify-center" : "h-12 px-4",
        light ? "bg-paper/15 text-paper hover:bg-paper/25" : "bg-sun-soft text-ink hover:bg-sun/60",
      )}
    >
      {speaking ? <Square size={20} fill="currentColor" /> : <Volume2 size={22} />}
      {!compact && <span>{speaking ? t("stop") : t("listen")}</span>}
    </button>
  );
}

/** Page title with a listen button. Reads itself aloud if the person turned voice on. */
export function PageHeader({ title, say, sub, back, audioKey, right }: { title: string; say: string; sub?: string; back?: string; audioKey?: string; right?: ReactNode }) {
  const lang = useLang();
  const voiceOn = useStore((s) => s.voiceOn);
  const t = useT();
  useEffect(() => {
    if (voiceOn) speak(say, lang, audioKey);
    return () => stopSpeaking();
  }, [say, voiceOn, lang, audioKey]);
  return (
    <header className="mb-6">
      {back && (
        <Link href={back} className="mb-3 inline-flex h-11 items-center gap-2 rounded-full pr-3 text-base font-bold text-muted hover:text-ink">
          <ArrowLeft size={22} /> {t("back")}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.9rem] leading-tight font-semibold md:text-[2.4rem]">{title}</h1>
          {sub && <p className="mt-1 text-lg text-muted">{sub}</p>}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <ListenButton text={say} audioKey={audioKey} compact />
        </div>
      </div>
    </header>
  );
}

// ---------- Buttons and cards ----------
type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "dark" | "soft" | "ghost" | "green";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
};
export function Button({ children, onClick, href, variant = "primary", disabled, className, type = "button" }: BtnProps) {
  const cls = cx(
    "inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl px-6 text-lg font-extrabold transition active:scale-[0.98] disabled:opacity-40",
    variant === "primary" && "bg-clay text-paper shadow-[0_4px_0_#8f3a20] hover:bg-clay-dark",
    variant === "dark" && "bg-ink text-paper hover:bg-ink-soft",
    variant === "green" && "bg-leaf text-paper shadow-[0_4px_0_#2d5c3a] hover:brightness-110",
    variant === "soft" && "border-2 border-sand bg-paper text-ink hover:border-sand-dark",
    variant === "ghost" && "text-ink hover:bg-sand/60",
    className,
  );
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}

export function Card({ children, className, dark }: { children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={cx("rounded-3xl p-5 md:p-6", dark ? "bg-ink text-paper" : "border border-sand bg-paper", className)}>
      {children}
    </div>
  );
}

/** Big square tile with an icon and a word: the main way to choose things. */
export function Tile({ icon, label, sub, onClick, href, selected, color = "#b34a2a", className, vertical }: {
  icon: ReactNode; label: string; sub?: string; onClick?: () => void; href?: string; selected?: boolean; color?: string; className?: string; vertical?: boolean;
}) {
  const inner = (
    <>
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: color + "1f", color }}>{icon}</span>
      <span className="text-left">
        <span className="block text-lg leading-tight font-extrabold">{label}</span>
        {sub && <span className="mt-0.5 block text-base leading-snug text-muted">{sub}</span>}
      </span>
    </>
  );
  const cls = cx(
    "flex min-h-24 w-full min-w-0 items-center gap-4 rounded-3xl border-2 bg-paper p-4 text-ink transition active:scale-[0.98]",
    vertical && "sm:flex-col sm:items-start sm:justify-between sm:gap-3",
    selected ? "border-clay ring-4 ring-clay/15" : "border-sand hover:border-sand-dark",
    className,
  );
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cls} aria-pressed={selected}>{inner}</button>;
}

// ---------- Dialog: bottom sheet on phones, centered box on computers ----------
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 md:items-center md:p-6" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cx("pop-in max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] bg-cream p-5 pb-8 outline-none md:rounded-[2rem] md:p-7", wide ? "md:max-w-2xl" : "md:max-w-lg")}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label={t("close")} className="flex h-12 w-12 items-center justify-center rounded-full bg-sand/70 hover:bg-sand">
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- Money input ----------
export function AmountInput({ value, onChange, autoFocus, label }: { value: string; onChange: (v: string) => void; autoFocus?: boolean; label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-lg font-bold">{label}</span>}
      <span className="flex items-center rounded-2xl border-2 border-sand bg-paper px-4 focus-within:border-clay">
        <span className="font-serif text-4xl text-muted">$</span>
        <input
          inputMode="decimal"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
          placeholder="0"
          className="h-20 w-full min-w-0 bg-transparent px-2 font-serif text-5xl font-semibold outline-none placeholder:text-sand-dark"
          aria-label={label ?? "$"}
        />
      </span>
    </label>
  );
}

export function QuickAmounts({ amounts, onPick }: { amounts: number[]; onPick: (n: number) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {amounts.map((a) => (
        <button key={a} type="button" onClick={() => onPick(a)} className="h-12 rounded-full border-2 border-sand bg-paper px-5 text-lg font-bold hover:border-clay">
          ${a}
        </button>
      ))}
    </div>
  );
}

// ---------- PIN pad: big buttons, easier than a tiny keyboard ----------
export function PinPad({ value, onChange, length = 4 }: { value: string; onChange: (v: string) => void; length?: number }) {
  const press = (d: string) => value.length < length && onChange(value + d);
  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="mb-6 flex justify-center gap-4" aria-live="polite" aria-label={`${value.length} / ${length}`}>
        {Array.from({ length }).map((_, i) => (
          <span key={i} className={cx("h-6 w-6 rounded-full border-[3px] transition", i < value.length ? "border-clay bg-clay" : "border-sand-dark")} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" onClick={() => press(d)} className="h-[4.5rem] rounded-2xl bg-paper font-serif text-3xl font-semibold shadow-[0_3px_0_#d9cbb2] active:translate-y-0.5 active:shadow-none">
            {d}
          </button>
        ))}
        <span />
        <button type="button" onClick={() => press("0")} className="h-[4.5rem] rounded-2xl bg-paper font-serif text-3xl font-semibold shadow-[0_3px_0_#d9cbb2] active:translate-y-0.5 active:shadow-none">
          0
        </button>
        <button type="button" onClick={() => onChange(value.slice(0, -1))} aria-label="Borrar" className="flex h-[4.5rem] items-center justify-center rounded-2xl text-muted hover:bg-sand/60">
          <Delete size={30} />
        </button>
      </div>
    </div>
  );
}

// ---------- Talk button ----------
export function MicButton({ onText, example, size = "lg" }: { onText: (t: string) => void; example?: string; size?: "lg" | "md" }) {
  const lang = useLang();
  const t = useT();
  const { state, text, error, start, stop } = useListen(lang);
  const listening = state === "listening";
  const big = size === "lg";
  return (
    <div className="flex flex-col items-center text-center">
      <button
        type="button"
        onClick={async () => {
          if (listening) return stop();
          const said = await start();
          if (said) onText(said);
        }}
        disabled={state === "thinking"}
        aria-label={listening ? t("tapToStop") : t("tapToSpeak")}
        className={cx(
          "flex items-center justify-center rounded-full text-paper transition active:scale-95",
          big ? "h-32 w-32" : "h-20 w-20",
          listening ? "listening bg-clay-dark" : "bg-clay shadow-[0_6px_0_#8f3a20] hover:bg-clay-dark",
        )}
      >
        {listening ? <Square size={big ? 40 : 28} fill="currentColor" /> : <Mic size={big ? 56 : 34} />}
      </button>
      <p className="mt-4 text-xl font-extrabold">
        {state === "thinking" ? t("thinking") : listening ? t("listening") : t("tapToSpeak")}
      </p>
      {listening && <p className="mt-1 text-base text-muted">{t("tapToStop")}</p>}
      {text && <p className="mt-3 max-w-md rounded-2xl bg-paper px-4 py-3 text-lg">«{text}»</p>}
      {!text && example && !listening && <p className="mt-2 max-w-sm text-base text-muted">{example}</p>}
      {error && <p className="mt-2 text-base text-clay">{error === "unsupported" ? "Este navegador no puede escuchar. Usa Chrome o escribe." : "No pude escuchar. Revisa el permiso del micrófono."}</p>}
    </div>
  );
}

export function Disclaimer({ k = "aiDisclaimer" }: { k?: TKey }) {
  const t = useT();
  return <p className="mt-4 rounded-2xl bg-sun-soft/70 px-4 py-3 text-base text-ink">⚠️ {t(k)}</p>;
}
