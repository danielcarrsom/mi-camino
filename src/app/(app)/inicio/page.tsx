"use client";
import Link from "next/link";
import { ArrowRight, Lightbulb, Store } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { GoalVisual } from "@/components/GoalVisual";
import { useT } from "@/lib/hooks";
import { useMe } from "@/lib/store";

export default function Hub() {
  const t = useT();
  const me = useMe()!;
  return (
    <>
      <PageHeader title={`${t("hello")}, ${me.profile.name}`} say={`${t("hello")}, ${me.profile.name}. ${t("hubSay")}`} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Link href="/casita" className="group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-[2rem] bg-ink p-6 text-paper md:min-h-80 md:p-8">
          <div>
            <h2 className="text-4xl font-semibold">{t("casita")}</h2>
            <p className="mt-2 max-w-[14rem] text-lg text-paper/75">{t("casitaWhat")}</p>
          </div>
          <span className="inline-flex h-14 w-fit items-center gap-2 rounded-2xl bg-clay px-5 text-lg font-extrabold group-hover:bg-clay-dark">
            {t("start")} <ArrowRight size={22} />
          </span>
          <div className="pointer-events-none absolute -right-4 -bottom-4 opacity-95">
            <GoalVisual visual="house" progress={0.7} size={190} />
          </div>
        </Link>

        <Link href="/negocio" className="group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-[2rem] border-2 border-sand bg-paper p-6 md:min-h-80 md:p-8">
          <div>
            <h2 className="text-4xl font-semibold">{t("negocio")}</h2>
            <p className="mt-2 max-w-[14rem] text-lg text-muted">{t("negocioWhat")}</p>
          </div>
          <span className="inline-flex h-14 w-fit items-center gap-2 rounded-2xl bg-leaf px-5 text-lg font-extrabold text-paper group-hover:brightness-110">
            {t("start")} <ArrowRight size={22} />
          </span>
          <span className="pointer-events-none absolute right-6 bottom-6 flex h-32 w-32 items-center justify-center rounded-full bg-leaf-soft text-leaf md:h-40 md:w-40">
            <Store size={72} strokeWidth={1.6} />
          </span>
        </Link>
      </div>

      <div className="mt-6 flex items-start gap-4 rounded-3xl bg-sun-soft p-5 md:p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sun text-ink"><Lightbulb size={26} /></span>
        <p className="text-lg">{t("separateLesson")}</p>
      </div>
    </>
  );
}
