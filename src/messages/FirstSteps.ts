// Texts for src/components/FirstSteps.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  anotaTuSalario: { es: "Anota tu salario", en: "Add your salary" },
  anotaTuRentaYTus: { es: "Anota tu renta y tus pagos fijos", en: "Add your rent and fixed payments" },
  creaTuPrimeraMeta: { es: "Crea tu primera meta", en: "Create your first goal" },
  juegaUnJuegoParaAprender: { es: "Juega un juego para aprender", en: "Play a game to learn" },
  anotaLoQueVendisteHoy: { es: "Anota lo que vendiste hoy", en: "Add what you sold today" },
  anotaTusGastosFijosRenta: { es: "Anota tus gastos fijos (renta, permisos)", en: "Add your fixed costs (rent, permits)" },
  agregaLoQueVendesY: { es: "Agrega lo que vendes y cuánto te cuesta", en: "Add what you sell and what it costs you" },
  ponteUnSueldo: { es: "Ponte un sueldo", en: "Set your salary" },
  tusPrimerosPasos: { es: "Tus primeros pasos", en: "Your first steps" },
  ocultar: { es: "Ocultar", en: "Hide" },
  sigue: { es: "Sigue:", en: "Next:" },
  tusPrimerosPasosLlevasDe: { es: "Tus primeros pasos. Llevas {0} de {1}. Lo que sigue: {2}.", en: "Your first steps. You've done {0} of {1}. Next: {2}." },
  llevasDe: { es: "Llevas {0} de {1}", en: "{0} of {1} done" },
} satisfies Record<string, Msg>;

export default TXT;
