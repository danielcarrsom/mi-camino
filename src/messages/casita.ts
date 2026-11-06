// Texts for src/app/(app)/casita/page.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  despuesDeImpuestosTeLlegan: { es: "Después de impuestos te llegan", en: "After taxes you take home" },
  teLlega: { es: "Te llega", en: "You take home" },
  verTodas: { es: "Ver todas", en: "See all" },
  yaLaRecibiste: { es: "Ya la recibiste", en: "You already got it" },
  teToca: { es: "Te toca:", en: "Your turn:" },
  sacaste: { es: "Sacaste", en: "Taken out" },
  deTuTanda: { es: "De tu tanda", en: "From your tanda" },
  planDeAhorro: { es: "Plan de ahorro", en: "Savings plan" },
  apartaste: { es: "Apartaste", en: "Set apart" },
  seRepite: { es: "Se repite", en: "Repeats" },
} satisfies Record<string, Msg>;

export default TXT;
