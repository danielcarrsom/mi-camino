"use client";
// Small React helpers shared by the screens.
import { useEffect, useState, useSyncExternalStore } from "react";
import { translate, type TKey } from "./i18n";
import { useLang } from "./store";

/** True once the browser has loaded saved data (avoids server/client mismatch). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useT() {
  const lang = useLang();
  return (key: TKey) => translate(lang, key);
}

export function useIsDesktop(): boolean {
  const [d, setD] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 900px)");
    const on = () => setD(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return d;
}

const FIRST = Symbol("first render");

/**
 * Runs `reset` while rendering, on the first render and whenever `key` changes
 * (for example when a sheet opens, or a different item is being edited). This is React's
 * recommended way to reset state from props without an extra render pass:
 * https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
 * `reset` must only set state: no speaking, navigating or fetching.
 */
export function useResetOn(key: unknown, reset: () => void) {
  const [prev, setPrev] = useState<unknown>(FIRST);
  if (!Object.is(prev, key)) {
    setPrev(key);
    reset();
  }
}

/** The current time, read once when the screen opens (and refreshed every `everyMs` if given). */
export function useNow(everyMs?: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!everyMs) return;
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}
