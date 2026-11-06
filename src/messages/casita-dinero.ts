// Texts for src/app/(app)/casita/dinero/page.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  recibes: { es: "recibes", en: "you receive" },
  seApartaSolo: { es: "se aparta solo", en: "set apart automatically" },
  enTotal: { es: "En total", en: "Total" },
  estoEsLoQueTe: { es: "Esto es lo que te llega (ya sin impuestos).", en: "This is what reaches you (after taxes)." },
  despuesDeImpuestosTeLlegan: { es: "Después de impuestos te llegan aprox.", en: "After taxes, reaches you approx." },
  aLaSemana: { es: "a la semana", en: "a week" },
  antesDeImpuestosUnosDe: { es: "Antes de impuestos {0} · unos {1} de impuestos · {2}", en: "Before taxes {0} · about {1} in taxes · {2}" },
} satisfies Record<string, Msg>;

export default TXT;
