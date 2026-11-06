// Texts for src/app/page.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  versionBetaPuedeTenerErrores: { es: "Versión beta: puede tener errores y cambiar. ", en: "Beta version: it may have mistakes and change. " },
  privacidad: { es: "Privacidad", en: "Privacy" },
  terminos: { es: "Términos", en: "Terms" },
} satisfies Record<string, Msg>;

export default TXT;
