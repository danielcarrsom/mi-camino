// Texts for src/app/(app)/casita/metas/[id]/page.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  loQueHasApartado: { es: "Lo que has apartado", en: "What you've saved" },
  todaviaNadaTuPrimerLadrillo: { es: "Todavía nada. ¡Tu primer ladrillo te espera!", en: "Nothing yet. Your first brick is waiting!" },
  tanda: { es: "tanda", en: "tanda" },
  plan: { es: "plan", en: "plan" },
  borrarEstaMeta: { es: "¿Borrar esta meta?", en: "Delete this goal?" },
  pusisteMas: { es: "¡Pusiste {0} {1} más! {2} {3}.", en: "You added {0} {4}! {2} {5}." },
  guardadoTeFaltanParaEl: { es: "Guardado. Te faltan {0} para el siguiente.", en: "Saved. {1} more for the next one." },
  cada: { es: "Cada {0} = {1}", en: "Each {2} = {1}" },
  teFaltanPara: { es: "Te faltan {0} para {1}", en: "{0} more for the next {2}" },
} satisfies Record<string, Msg>;

export default TXT;
