"use client";
// Small display pieces shared by the Mi Negocio money tabs.
import { cx } from "@/components/ui";

export function MiniRow({ label, value, strong, bad }: { label: string; value: string; strong?: boolean; bad?: boolean }) {
  return (
    <div className={cx("flex min-w-0 items-center justify-between gap-2 rounded-2xl px-4 py-3", strong ? "bg-leaf/12" : bad ? "bg-clay/10" : "bg-paper border border-sand")}>
      <span className="text-base font-bold">{label}</span>
      <span className={cx("text-xl font-extrabold", strong && "text-leaf", bad && "text-clay")}>{value}</span>
    </div>
  );
}

export function Mini({ label, value, strong, bad }: { label: string; value: string; strong?: boolean; bad?: boolean }) {
  return (
    <div className={cx("min-w-0 rounded-2xl px-1 py-2", strong ? "bg-leaf/12" : bad ? "bg-clay/10" : "bg-cream")}>
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className={cx("truncate text-lg font-extrabold", strong && "text-leaf", bad && "text-clay")}>{value}</p>
    </div>
  );
}

export function DarkStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cx("min-w-0 rounded-2xl p-3", accent ? "bg-sun text-ink" : "bg-paper/10")}>
      <p className={cx("text-base font-bold", accent ? "text-ink" : "text-paper/80")}>{label}</p>
      <p className="truncate font-serif text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function Choice({ label, hint, options, value, onPick, fmt }: { label: string; hint?: string; options: number[]; value: number; onPick: (v: number) => void; fmt: (x: number) => string }) {
  return (
    <div>
      <p className="text-lg font-bold">{label}</p>
      {hint && <p className="text-base text-muted">{hint}</p>}
      <div className="mb-2" />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onPick(o)} aria-pressed={value === o} className={cx("h-12 min-w-16 rounded-2xl border-2 px-3 text-lg font-extrabold", value === o ? "border-ink bg-ink text-paper" : "border-sand bg-paper")}>
            {fmt(o)}
          </button>
        ))}
      </div>
    </div>
  );
}
