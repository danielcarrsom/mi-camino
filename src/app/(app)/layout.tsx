"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useHydrated } from "@/lib/hooks";
import { useLang, useStore } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const current = useStore((s) => s.current);
  const lang = useLang();
  const router = useRouter();
  const applyPlans = useStore((s) => s.applyPlans);

  // Savings plans add their bricks automatically when a new week/month arrives.
  useEffect(() => {
    if (hydrated && current) applyPlans();
  }, [hydrated, current, applyPlans]);

  useEffect(() => {
    if (hydrated && !current) router.replace("/");
  }, [hydrated, current, router]);

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "es";
  }, [lang]);

  if (!hydrated || !current) return <div className="min-h-dvh bg-cream" />;
  return <AppShell>{children}</AppShell>;
}
