"use client";
// What a tanda is, in plain words, and how to stay safe.
import { ShieldAlert, Lightbulb } from "lucide-react";
import { Card, ListenButton } from "@/components/ui";
import type { Lang } from "@/lib/i18n";
import { tx } from "@/lib/i18n";
import TXT from "@/messages/casita-tanda";


// ---------- Plain explanation + safety ----------
export function WhatIsTanda({ lang }: { lang: Lang }) {
  const what = tx(lang, TXT.unaTandaEsUnGrupo);
  const safe = tx(lang, TXT.hazTandasSoloConPersonas);
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><Lightbulb size={22} className="text-sun" /> {tx(lang, TXT.queEsUnaTanda)}</h3>
          <ListenButton compact text={what} />
        </div>
        <p className="mt-2 text-lg">{what}</p>
        <p className="mt-3 text-base text-muted">{tx(lang, TXT.ejemploSon10PersonasY)}</p>
      </Card>
      <div className="rounded-3xl border-2 border-sun bg-sun-soft/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><ShieldAlert size={22} className="text-clay" /> {tx(lang, TXT.cuidaTuDinero)}</h3>
          <ListenButton compact text={safe} />
        </div>
        <p className="mt-2 text-lg">{safe}</p>
      </div>
    </div>
  );
}
