"use client";
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
