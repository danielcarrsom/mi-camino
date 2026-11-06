// Texts for src/app/entrar/page.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  demasiadosIntentosConLaClave: { es: "Demasiados intentos con la clave equivocada. Por tu seguridad, espera 15 minutos e intenta otra vez, o recupera tu clave.", en: "Too many wrong PINs. For your safety, wait 15 minutes and try again, or recover your PIN." },
  olvidasteTuClave: { es: "¿Olvidaste tu clave?", en: "Forgot your PIN?" },
} satisfies Record<string, Msg>;

export default TXT;
