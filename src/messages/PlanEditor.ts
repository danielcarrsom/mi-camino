// Texts for src/components/PlanEditor.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  aLaSemana: { es: "a la semana", en: "a week" },
  cadaQuincena: { es: "cada quincena", en: "every 2 weeks" },
  alMes: { es: "al mes", en: "a month" },
  usarEstaCantidad: { es: "Usar esta cantidad", en: "Use this amount" },
  ahoraTusGastosSeLlevan: { es: "Ahora tus gastos se llevan lo que ganas. Empieza con poquito, aunque sean $5 a la semana, y revisa tus gastos en Mi dinero.", en: "Right now your expenses use up what you earn. Start with a little, even $5 a week, and review your expenses in My money." },
  teSugerimos: { es: "Te sugerimos ${0} {1}", en: "We suggest {2} {1}" },
  despuesDeTusGastosTe: { es: "Después de tus gastos te sobran como ${0} a la semana. Apartar la mitad te deja dinero para vivir. Puedes cambiarlo.", en: "After your expenses you have about ${1} left each week. Saving half still leaves you money to live on. You can change it." },
} satisfies Record<string, Msg>;

export default TXT;
