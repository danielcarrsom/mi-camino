// Texts for src/components/MoneyForms.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  borrarEsto: { es: "¿Borrar esto?", en: "Delete this?" },
  siMeDescuentanImpuestos: { es: "Sí, me descuentan impuestos", en: "Yes, taxes are taken out" },
  teDanReciboDeNomina: { es: "Te dan recibo de nómina", en: "You get a payslip (recibo de nómina)" },
  tuTalonDePagoDice: { es: "Tu talón de pago dice “taxes”", en: "Your paystub shows taxes" },
  noMePaganCompletoO: { es: "No, me pagan completo o en efectivo", en: "No, I'm paid in full or in cash" },
  oTrabajasPorTuCuenta: { es: "O trabajas por tu cuenta", en: "Or you work on your own" },
  noTeQuitanNada: { es: "No te quitan nada", en: "Nothing is taken out" },
  loQueEscribiYaEs: { es: "Lo que escribí ya es lo que me llega", en: "The amount I wrote is what I get" },
  yaSinImpuestos: { es: "Ya sin impuestos", en: "After taxes" },
  teDescuentanImpuestosDeTu: { es: "¿Te descuentan impuestos de tu pago?", en: "Do they take taxes out of your pay?" },
  impuestosDe: { es: "Impuestos de ", en: "Taxes for " },
  casadoA: { es: ", casado(a)", en: ", married" },
  cambiarEnMiPerfil: { es: "Cambiar en Mi perfil", en: "Change in My profile" },
  loQueTeLlegaCada: { es: "Lo que te llega cada semana", en: "What reaches you each week" },
  teLlegaCadaSemana: { es: "Te llega cada semana", en: "You get each week" },
  antesDeImpuestos: { es: "Antes de impuestos", en: "Before taxes" },
  teLlegaAprox: { es: "Te llega, aprox.", en: "Reaches you, approx." },
  aLaSemana: { es: "a la semana", en: "a week" },
  sinDescuentos: { es: "sin descuentos", en: "no taxes taken out" },
  siGanasElSalarioMinimo: { es: "Si ganas el salario mínimo, no te quitan ISR y tu patrón paga tu parte del IMSS.", en: "If you earn the minimum wage, no ISR is taken out and your employer pays your IMSS." },
  ocultar: { es: "Ocultar", en: "Hide" },
  aDondeSeVanEsos: { es: "¿A dónde se van esos impuestos?", en: "Where do those taxes go?" },
  calculoAproximadoConLasTablas: { es: "Cálculo aproximado con las tablas del SAT 2026 (con el subsidio para el empleo) y las cuotas del IMSS. Tu recibo de nómina tiene la cantidad exacta: si es distinta, elige “Lo que escribí ya es lo que me llega”.", en: "Estimate with the 2026 SAT tables (including the employment subsidy) and IMSS rates. Your payslip has the exact amount: if it's different, choose “The amount I wrote is what I get”." },
  calculoAproximadoConLasTasas: { es: "Cálculo aproximado con las tasas de 2026, un solo trabajo y deducción estándar. Tu talón de pago tiene la cantidad exacta: si es distinta, elige “Lo que escribí ya es lo que me llega” y escribe lo que te llega.", en: "Estimate with 2026 rates, one job, standard deduction. Your paystub has the exact amount: if it's different, choose “The amount I wrote is what I get” and type what reaches you." },
  borrarEsteTrabajo: { es: "¿Borrar este trabajo?", en: "Delete this job?" },
  unosDeImpuestos: { es: "unos {0} de impuestos", en: "about {0} in taxes" },
} satisfies Record<string, Msg>;

export default TXT;
