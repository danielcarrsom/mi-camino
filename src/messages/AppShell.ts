// Texts for src/components/AppShell.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  miPerfil: { es: "Mi perfil", en: "My profile" },
  guardadoEnLinea: { es: "Guardado en línea", en: "Saved online" },
  guardando: { es: "Guardando…", en: "Saving…" },
  soloEnEsteDispositivo: { es: "Solo en este dispositivo", en: "Only on this device" },
  verElRecorridoOtraVez: { es: "Ver el recorrido otra vez", en: "See the tour again" },
  privacidadYTerminos: { es: "Privacidad y términos", en: "Privacy and terms" },
} satisfies Record<string, Msg>;

export default TXT;
