"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/ui";
import { useLang, useMe, type Tanda } from "@/lib/store";
import { tx } from "@/lib/i18n";
import TXT from "@/messages/casita-tanda";
import { TandaForm } from "./_parts/TandaForm";
import { TandaCircle, TandaView } from "./_parts/TandaView";
import { WhatIsTanda } from "./_parts/WhatIsTanda";

export default function TandaPage() {
  const lang = useLang();
  const me = useMe()!;
  const tandas = me.tandas ?? [];
  const [editing, setEditing] = useState<Tanda | "new" | null>(null);

  const intro = tx(lang, TXT.miTandaAquiLlevasLa);

  return (
    <>
      <PageHeader
        title={tx(lang, TXT.miTanda)}
        sub={tx(lang, TXT.ahorrarJuntosPorTurnos)}
        say={intro}
        right={tandas.length > 0 ? <span className="hidden md:block"><Button onClick={() => setEditing("new")} className="min-h-12 px-4 text-base"><Plus size={20} /> {tx(lang, TXT.nuevaTanda)}</Button></span> : undefined}
      />

      {tandas.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Card className="flex flex-col items-center py-10 text-center">
            <TandaCircle people={8} current={2} myTurn={5} paidRounds={[0, 1]} size={220} lang={lang} />
            <h2 className="mt-4 text-2xl font-semibold">{tx(lang, TXT.estasEnUnaTanda)}</h2>
            <p className="mt-2 max-w-md text-lg text-muted">
              {tx(lang, TXT.anotalaAquiYTeAvisamos)}
            </p>
            <Button onClick={() => setEditing("new")} className="mt-6"><Plus size={22} /> {tx(lang, TXT.anotarMiTanda)}</Button>
          </Card>
          <WhatIsTanda lang={lang} />
        </div>
      ) : (
        <div className="space-y-8">
          {tandas.map((t) => <TandaView key={t.id} t={t} onEdit={() => setEditing(t)} />)}
          <Button onClick={() => setEditing("new")} variant="soft" className="w-full md:hidden"><Plus size={22} /> {tx(lang, TXT.nuevaTanda)}</Button>
          <WhatIsTanda lang={lang} />
        </div>
      )}

      <TandaForm open={editing !== null} tanda={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
    </>
  );
}
