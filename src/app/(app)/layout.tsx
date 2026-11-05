"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { NewPin } from "@/components/NewPin";
import { useHydrated } from "@/lib/hooks";
import { useLang, useStore } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const current = useStore((s) => s.current);
  const lang = useLang();
  const router = useRouter();
  const applyPlans = useStore((s) => s.applyPlans);
  const syncDown = useStore((s) => s.syncDown);
  const syncUp = useStore((s) => s.syncUp);
  const needsNewPin = useStore((s) => s.needsNewPin);

  // Savings plans add their bricks automatically when a new week/month arrives;
  // then bring in anything saved online from another device.
  useEffect(() => {
    if (!hydrated || !current) return;
    applyPlans();
    void syncDown();
  }, [hydrated, current, applyPlans, syncDown]);

  // Save online a moment after each change (and when leaving the page).
  useEffect(() => {
    if (!hydrated || !current) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useStore.subscribe((s, prev) => {
      const now = s.current ? s.accounts[s.current]?.data : undefined;
      const before = prev.current ? prev.accounts[prev.current]?.data : undefined;
      if (!now || now === before || s.current !== prev.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void syncUp(), 1500);
    });
    const flush = () => { if (timer) { clearTimeout(timer); timer = null; void syncUp(); } };
    window.addEventListener("pagehide", flush);
    return () => { unsub(); window.removeEventListener("pagehide", flush); if (timer) clearTimeout(timer); };
  }, [hydrated, current, syncUp]);

  useEffect(() => {
    if (hydrated && !current) router.replace("/");
  }, [hydrated, current, router]);

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "es";
  }, [lang]);

  if (!hydrated || !current) return <div className="min-h-dvh bg-cream" />;
  if (needsNewPin) return <NewPin />;
  return <AppShell>{children}</AppShell>;
}
