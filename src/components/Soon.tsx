"use client";
import type { ReactNode } from "react";
import { Hammer } from "lucide-react";
import { Card, PageHeader } from "./ui";
import { useT } from "@/lib/hooks";

/** Placeholder for parts being built this week. */
export function Soon({ title, what, back = "/casita", children }: { title: string; what: string; back?: string; children?: ReactNode }) {
  const t = useT();
  return (
    <>
      <PageHeader title={title} say={`${title}. ${what} ${t("soonText")}`} back={back} />
      <Card className="flex flex-col items-center py-12 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sun-soft text-clay"><Hammer size={40} /></span>
        <h2 className="mt-5 text-2xl font-semibold">{t("soon")}</h2>
        <p className="mt-2 max-w-md text-lg text-muted">{what}</p>
        {children}
      </Card>
    </>
  );
}
