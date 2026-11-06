// Texts for src/components/ui.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  comoSeUsa: { es: "¿Cómo se usa?", en: "How does this work?" },
  comoSeUsaEstaPantalla: { es: "Cómo se usa esta pantalla", en: "How to use this screen" },
  entendido: { es: "Entendido", en: "Got it" },
} satisfies Record<string, Msg>;

export default TXT;
