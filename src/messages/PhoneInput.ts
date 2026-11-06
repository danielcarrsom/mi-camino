// Texts for src/components/PhoneInput.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  paisDeTuNumero: { es: "País de tu número", en: "Country of your number" },
  primeroTocaDeQuePais: { es: "Primero toca de qué país es tu número.", en: "First, tap which country your number is from." },
  tuNumero: { es: "Tu número:", en: "Your number:" },
} satisfies Record<string, Msg>;

export default TXT;
