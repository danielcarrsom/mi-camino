// Texts for src/app/(app)/negocio/page.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  cambiarNombre: { es: "Cambiar nombre", en: "Rename" },
  elSemaforoDeTuNegocio: { es: "El semáforo de tu negocio · últimos 30 días", en: "Your business traffic light · last 30 days" },
  ultimos30Dias: { es: "Últimos 30 días", en: "Last 30 days" },
  vendiste: { es: "Vendiste", en: "You sold" },
  gastaste: { es: "Gastaste", en: "You spent" },
  teQuedoTuGanancia: { es: "Te quedó (tu ganancia)", en: "You kept (your profit)" },
  teFalto: { es: "Te faltó", en: "You were short" },
  tePagasteDeSueldo: { es: "Te pagaste de sueldo", en: "You paid yourself" },
  apartasteParaTusMetas: { es: "Apartaste para tus metas", en: "Set aside for goals" },
  libreEnElNegocio: { es: "Libre en el negocio", en: "Free in the business" },
  ponermeUnSueldo: { es: "Ponerme un sueldo", en: "Set my salary" },
  vendiOMePagaron: { es: "Vendí o me pagaron", en: "I sold / got paid" },
  gasteOCompre: { es: "Gasté o compré", en: "I spent / bought" },
  sugerenciasParaTi: { es: "Sugerencias para ti", en: "Suggestions for you" },
  verTodas: { es: "Ver todas", en: "See all" },
  loUltimoQueAnotaste: { es: "Lo último que anotaste", en: "Latest entries" },
  verTodo: { es: "Ver todo", en: "See all" },
  todaviaNoAnotasNadaEmpieza: { es: "Todavía no anotas nada. Empieza con tu venta de hoy.", en: "Nothing yet. Start with today's sales." },
  metasDelNegocio: { es: "Metas del negocio", en: "Business goals" },
  verMetas: { es: "Ver metas", en: "See goals" },
  crearUnaMeta: { es: "Crear una meta", en: "Create a goal" },
  unCarritoEquipoNuevoTu: { es: "¿Un carrito, equipo nuevo, tu propio local? Ponle meta y júntalo poco a poco.", en: "A cart, new equipment, your own place? Set a goal and save little by little." },
  de: { es: "de", en: "of" },
  elSemaforoEsUnaGuia: { es: "El semáforo es una guía con lo que anotaste, no una revisión de un contador. Para impuestos o préstamos, pide ayuda gratis en Aprender → ¿Quién me ayuda?", en: "The traffic light is a guide based on what you entered, not an accountant's review. For taxes or loans, get free help in Learn → Who can help?" },
  miNegocio: { es: "Mi Negocio", en: "My Business" },
  llevaLasCuentasDeTu: { es: "Lleva las cuentas de tu negocio, separadas de tu casa", en: "Keep your business money apart from your home" },
  vamosAEmpezarTuNegocio: { es: "Vamos a empezar tu negocio. Escribe cómo se llama y toca qué tipo de negocio tienes.", en: "Let's set up your business. Write its name and tap what kind of business it is." },
  comoSeLlamaTuNegocio: { es: "¿Cómo se llama tu negocio?", en: "What's your business called?" },
  queTipoDeNegocioEs: { es: "¿Qué tipo de negocio es?", en: "What kind of business is it?" },
  empezarMiNegocio: { es: "Empezar mi negocio", en: "Start my business" },
  miNegocio2: { es: "Mi negocio", en: "My business" },
  guardar: { es: "Guardar", en: "Save" },
  miNegocio3: { es: "Mi Negocio · {0}", en: "My Business · {0}" },
  ejTamales: { es: "Ej. Tamales {0}", en: "e.g. {0}'s Tamales" },
} satisfies Record<string, Msg>;

export default TXT;
