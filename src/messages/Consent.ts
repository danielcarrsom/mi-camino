// Texts for src/components/Consent.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  aceptoElAvisoDePrivacidad: { es: "Acepto el aviso de privacidad y los términos", en: "I accept the privacy notice and terms" },
  leiYAceptoEl: { es: "Leí y acepto el ", en: "I read and accept the " },
  avisoDePrivacidad: { es: "aviso de privacidad", en: "privacy notice" },
  yLos: { es: " y los ", en: " and the " },
  terminosYCondiciones: { es: "términos y condiciones", en: "terms" },
  entiendoQueMiCaminoEsta: { es: ". Entiendo que Mi Camino está en beta y puede cambiar.", en: ". I understand Mi Camino is in beta and may change." },
  privacidadYTerminos: { es: "Privacidad y términos", en: "Privacy and terms" },
  tuPrivacidadEnPalabrasSencillas: { es: "Tu privacidad, en palabras sencillas", en: "Your privacy, in plain words" },
  nuncaTePedimosEstatusMigratorio: { es: "Nunca te pedimos estatus migratorio ni números de cuenta.", en: "We never ask for immigration status or account numbers." },
  noVendemosTusDatosY: { es: "No vendemos tus datos y no hay anuncios.", en: "We don't sell your data and there are no ads." },
  puedesDescargarOBorrarTus: { es: "Puedes descargar o borrar tus datos cuando quieras.", en: "You can download or delete your data any time." },
  miCaminoEstaEnBeta: { es: "Mi Camino está en beta: puede tener errores y cambiar.", en: "Mi Camino is in beta: it may have mistakes and change." },
  continuar: { es: "Continuar", en: "Continue" },
  ahoraNoSalir: { es: "Ahora no, salir", en: "Not now, sign out" },
} satisfies Record<string, Msg>;

export default TXT;
