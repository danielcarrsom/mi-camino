// Texts for src/components/Bills.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  esteMes: { es: "este mes", en: "this month" },
  estaQuincena: { es: "esta quincena", en: "this pay period" },
  estaSemana: { es: "esta semana", en: "this week" },
  tusPagosFijos: { es: "Tus pagos fijos", en: "Your fixed payments" },
  anotaUnaVezTuRenta: { es: "Anota una vez tu renta, luz o teléfono y aquí te los recordamos cada mes.", en: "Add your rent, light or phone once and we'll remind you each month." },
  anotarUnPago: { es: "Anotar un pago", en: "Add a payment" },
  teFaltaPagar: { es: "Te falta pagar", en: "Still to pay" },
  tusPagosDeEsteMes: { es: "Tus pagos de este mes", en: "Your payments this month" },
  tocaYaLoPagueCuando: { es: "Toca “Ya lo pagué” cuando pagues cada uno.", en: "Tap “I paid it” when you pay each one." },
  yaPagaste: { es: "Ya pagaste", en: "Already paid" },
  deshacer: { es: "Deshacer", en: "Undo" },
  yaLoPague: { es: "Ya lo pagué", en: "I paid it" },
  hasPagadoDe: { es: "Has pagado {0} de {1}. {2}", en: "You've paid {0} of {1}. {3}" },
} satisfies Record<string, Msg>;

export default TXT;
