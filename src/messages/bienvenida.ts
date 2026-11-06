// Texts for src/app/bienvenida/page.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  dondeVivesEnMexicoO: { es: "¿Dónde vives? ¿En México o en Estados Unidos? Lo usamos para calcular los impuestos de tu sueldo y para mostrar tu dinero en dólares o en pesos.", en: "Where do you live? In Mexico or in the United States? We use it to figure the taxes on your pay and to show your money in dollars or pesos." },
  siUnDiaOlvidasTu: { es: "Si un día olvidas tu clave, te haremos una pregunta. Elige una y contéstala. Solo tú debes saber la respuesta.", en: "If you ever forget your PIN, we'll ask you a question. Pick one and answer it. Only you should know the answer." },
  dondeVives: { es: "¿Dónde vives?", en: "Where do you live?" },
  porSiOlvidasTuClave: { es: "Por si olvidas tu clave", en: "In case you forget your PIN" },
  loUsamosParaTusImpuestos: { es: "Lo usamos para tus impuestos y para mostrar tu dinero en dólares o pesos. Lo puedes cambiar después en Mi perfil.", en: "We use it for taxes and to show your money in dollars or pesos. You can change it later in My profile." },
  esteNumeroYaTieneCuenta: { es: "Este número ya tiene cuenta. Mejor entra con tu clave.", en: "This number already has an account. Sign in instead." },
  hacerloDespues: { es: "Hacerlo después", en: "Skip for now" },
} satisfies Record<string, Msg>;

export default TXT;
