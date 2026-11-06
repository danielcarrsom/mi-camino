// Texts for src/components/RegionPicker.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  vivoEnEstadosUnidos: { es: "Vivo en Estados Unidos", en: "I live in the United States" },
  vivoEnMexico: { es: "Vivo en México", en: "I live in Mexico" },
  tuDineroSeVeraEn: { es: "Tu dinero se verá en pesos mexicanos, con los impuestos de México (ISR e IMSS).", en: "Your money will show in Mexican pesos, with Mexico's taxes (ISR and IMSS)." },
  enQueEstado: { es: "¿En qué estado?", en: "Which state?" },
  otroEstado: { es: "Otro estado", en: "Another state" },
  todosLosEstados: { es: "Todos los estados", en: "All states" },
  eligeTuEstado: { es: "Elige tu estado", en: "Choose your state" },
  vivesEnLaCiudadDe: { es: "¿Vives en la Ciudad de Nueva York?", en: "Do you live in New York City?" },
  si: { es: "Sí", en: "Yes" },
  noOtraParteDeNy: { es: "No, otra parte de NY", en: "No, elsewhere in NY" },
  noCobraImpuestoEstatalAl: { es: "{0} no cobra impuesto estatal al salario. ¡Buena noticia!", en: "{0} has no state tax on pay. Good news!" },
} satisfies Record<string, Msg>;

export default TXT;
