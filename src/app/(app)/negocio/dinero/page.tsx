"use client";
import { useResetOn } from "@/lib/hooks";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calculator, Receipt, Telescope } from "lucide-react";
import { PageHeader, cx } from "@/components/ui";
import { Semaforo, useBiz } from "@/components/Biz";
import { tx } from "@/lib/i18n";
import TXT from "@/messages/negocio-dinero";
import { Costos } from "./_parts/Costos";
import { Futuro } from "./_parts/Futuro";
import { Movimientos } from "./_parts/Movimientos";

type Tab = "movimientos" | "costos" | "futuro";

export default function DineroNegocioPage() {
  return (
    <Suspense>
      <Dinero />
    </Suspense>
  );
}

function Dinero() {
  const { biz, lang, health } = useBiz();
  const params = useSearchParams();
  const router = useRouter();
  const initial = (params.get("tab") as Tab) || "movimientos";
  const [tab, setTab] = useState<Tab>(["movimientos", "costos", "futuro"].includes(initial) ? initial : "movimientos");
  useResetOn(initial, () => { if (["movimientos", "costos", "futuro"].includes(initial)) setTab(initial); });
  useEffect(() => { if (!biz) router.replace("/negocio"); }, [biz, router]);
  if (!biz) return null;

  const pickTab = (t: Tab) => { setTab(t); router.replace(`/negocio/dinero?tab=${t}`, { scroll: false }); };
  const tabs: { id: Tab; label: string; short: string; icon: React.ReactNode }[] = [
    { id: "movimientos", label: tx(lang, TXT.ventasYGastos), short: tx(lang, TXT.ventasYGastos2), icon: <Receipt size={22} /> },
    { id: "costos", label: tx(lang, TXT.misCostos), short: tx(lang, TXT.costos), icon: <Calculator size={22} /> },
    { id: "futuro", label: tx(lang, TXT.aFuturo), short: tx(lang, TXT.aFuturo2), icon: <Telescope size={22} /> },
  ];

  return (
    <div>
      <PageHeader
        title={tx(lang, TXT.elDineroDeMiNegocio)}
        say={tx(lang, TXT.aquiAnotasLoQueVendes)}
        right={<span className="hidden md:block"><Semaforo light={health.light} size={18} horizontal /></span>}
      />

      <div role="tablist" className="mb-6 grid grid-cols-3 gap-2 rounded-3xl bg-sand/60 p-1.5">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => pickTab(t.id)}
            className={cx("flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.95rem] leading-tight font-extrabold transition sm:flex-row sm:gap-2 sm:text-lg", tab === t.id ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink")}>
            {t.icon}<span className="text-center sm:hidden">{t.short}</span><span className="hidden text-center sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "movimientos" && <Movimientos />}
      {tab === "costos" && <Costos />}
      {tab === "futuro" && <Futuro />}
    </div>
  );
}
