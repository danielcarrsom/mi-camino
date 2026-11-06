// Texts for src/components/RecoverySetup.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  siUnDiaOlvidasTu: { es: "Si un día olvidas tu clave, te haremos esta pregunta para que puedas entrar otra vez. Elige una que solo tú sepas.", en: "If you ever forget your PIN, we'll ask this question so you can get back in. Pick one only you know." },
  tuRespuesta: { es: "Tu respuesta", en: "Your answer" },
  noImportaSiUsasAcentos: { es: "No importa si usas acentos o mayúsculas.", en: "Accents and capital letters don't matter." },
  guardarMiPregunta: { es: "Guardar mi pregunta", en: "Save my question" },
  protegeTuCuenta: { es: "Protege tu cuenta.", en: "Protect your account." },
  eligeUnaPreguntaParaRecuperar: { es: "Elige una pregunta para recuperar tu clave si la olvidas.", en: "Pick a question to recover your PIN if you forget it." },
  elegir: { es: "Elegir", en: "Choose" },
  despues: { es: "Después", en: "Later" },
  tuPreguntaDeSeguridad: { es: "Tu pregunta de seguridad", en: "Your security question" },
  noSePudoGuardarRevisa: { es: "No se pudo guardar. Revisa tu internet e intenta otra vez.", en: "Couldn't save. Check your internet and try again." },
} satisfies Record<string, Msg>;

export default TXT;
