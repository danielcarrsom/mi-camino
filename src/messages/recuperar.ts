// Texts for src/app/recuperar/page.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  escribeTuNumeroDeTelefono: { es: "Escribe tu número de teléfono para recuperar tu clave.", en: "Type your phone number to recover your PIN." },
  escribeElCodigoDeRecuperacion: { es: "Escribe el código de recuperación que te dieron.", en: "Type the recovery code you were given." },
  eligeTuClaveNuevaDe: { es: "Elige tu clave nueva de 6 números.", en: "Choose your new 6-digit PIN." },
  escribeTuClaveNuevaOtra: { es: "Escribe tu clave nueva otra vez.", en: "Type your new PIN again." },
  unMomento: { es: "Un momento…", en: "One moment…" },
  noHayConexionRevisaTu: { es: "No hay conexión. Revisa tu internet e intenta otra vez.", en: "No connection. Check your internet and try again." },
  listoYaTienesTuClave: { es: "¡Listo! Ya tienes tu clave nueva.", en: "Done! You have your new PIN." },
  porTuSeguridadYaNo: { es: "Por tu seguridad, ya no se puede intentar por una hora. Si necesitas ayuda, llama al Consulado.", en: "For your safety, no more tries for one hour. If you need help, call the Consulate." },
  lasClavesNoSonIguales: { es: "Las claves no son iguales. Intenta otra vez.", en: "The PINs don't match. Try again." },
  regresar: { es: "Regresar", en: "Back" },
  tuClaveNueva: { es: "Tu clave nueva", en: "Your new PIN" },
  otraVezTuClaveNueva: { es: "Otra vez tu clave nueva", en: "New PIN again" },
  recuperarMiClave: { es: "Recuperar mi clave", en: "Recover my PIN" },
  tuNumeroDeTelefono: { es: "Tu número de teléfono", en: "Your phone number" },
  siguiente: { es: "Siguiente", en: "Next" },
  tuRespuesta: { es: "Tu respuesta", en: "Your answer" },
  noImportaSiUsasAcentos: { es: "No importa si usas acentos o mayúsculas.", en: "Accents and capitals don't matter." },
  tuCuentaTodaviaNoTiene: { es: "Tu cuenta todavía no tiene pregunta de seguridad. Pide un código de recuperación al equipo de Mi Camino: revisan que seas tú y te lo dan.", en: "Your account doesn't have a security question yet. Ask the Mi Camino team for a recovery code: they check it's you and give it to you." },
  codigoDeRecuperacion: { es: "Código de recuperación", en: "Recovery code" },
  intentarOtraVez: { es: "Intentar otra vez", en: "Try again" },
  mejorContestoMiPregunta: { es: "Mejor contesto mi pregunta", en: "I'll answer my question instead" },
  noMeAcuerdoTengoUn: { es: "No me acuerdo · tengo un código de recuperación", en: "I don't remember · I have a recovery code" },
  necesitasAyuda: { es: "¿Necesitas ayuda?", en: "Need help?" },
  consuladoDeMexicoEnNueva: { es: "Consulado de México en Nueva York:", en: "Mexican Consulate in New York:" },
  contestaTuPregunta: { es: "Contesta tu pregunta: {0}", en: "Answer your question: {1}" },
  eseCodigoNoSirveO: { es: "Ese código no sirve o ya se usó. Te quedan {0} intentos.", en: "That code doesn't work or was used. {0} tries left." },
  esaRespuestaNoEsLa: { es: "Esa respuesta no es la que guardaste. Te quedan {0} intentos.", en: "That's not the answer you saved. {0} tries left." },
} satisfies Record<string, Msg>;

export default TXT;
