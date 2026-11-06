// Texts for src/app/(app)/casita/anotar/page.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  oDimeCuantoGanaste: { es: "O dime cuánto ganaste", en: "Or tell me how much you earned" },
  queDineroTeLlegoToca: { es: "¿Qué dinero te llegó? Toca uno", en: "What money came in? Tap one" },
  loQueGanasEnTu: { es: "Lo que ganas en tu trabajo", en: "What you earn at your job" },
  unRegaloUnTrabajitoUn: { es: "Un regalo, un trabajito, un reembolso…", en: "A gift, a side job, a refund…" },
} satisfies Record<string, Msg>;

export default TXT;
