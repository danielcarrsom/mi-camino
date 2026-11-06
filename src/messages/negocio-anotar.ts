// Texts for src/app/(app)/negocio/anotar/page.tsx. Spanish and English; another language can be added to any message
// (for example `mix: "…"` for Mixteco) and is used when present.
import type { Msg } from "@/lib/i18n";

const TXT = {
  anotado: { es: "¡Anotado!", en: "Saved!" },
  anotarEnMiNegocio: { es: "Anotar en mi negocio", en: "Add to my business" },
  vendisteOGastasteTocaUno: { es: "¿Vendiste o gastaste? Toca uno.", en: "Did you sell or spend? Tap one." },
  vendiOMePagaron: { es: "Vendí o me pagaron", en: "I sold / got paid" },
  gasteOCompre: { es: "Gasté o compré", en: "I spent / bought" },
  anotarOtro: { es: "Anotar otro", en: "Add another" },
  verMiSemaforo: { es: "Ver mi semáforo", en: "See my traffic light" },
  oEscribeloComoLoDirias: { es: "O escríbelo como lo dirías", en: "Or type it like you'd say it" },
  vendi40TamalesA20: { es: "vendí 40 tamales a 20 pesos", en: "sold 40 tamales at 20 pesos" },
  compreMasa900Pesos: { es: "compré masa 900 pesos", en: "bought dough 900 pesos" },
  vendi40TamalesA3: { es: "vendí 40 tamales a 3 dólares", en: "sold 40 tamales at 3 dollars" },
  compreMasa120Dolares: { es: "compré masa 120 dólares", en: "bought dough 120 dollars" },
  entender: { es: "Entender", en: "Understand" },
  queVendisteTocaPorCada: { es: "¿Qué vendiste? Toca + por cada uno", en: "What did you sell? Tap + for each" },
  cadaUno: { es: "cada uno", en: "each" },
  deDondeVino: { es: "¿De dónde vino?", en: "Where did it come from?" },
  enQueFue: { es: "¿En qué fue?", en: "What was it for?" },
  loQueComprasParaVender: { es: "Lo que compras para vender", en: "What you buy to sell" },
  gastosFijosSeRepiten: { es: "Gastos fijos (se repiten)", en: "Fixed costs (they repeat)" },
  cuanto: { es: "¿Cuánto?", en: "How much?" },
  deQueFueEsteDinero: { es: "¿De qué fue este dinero?", en: "What was this money for?" },
  queGastoEs: { es: "¿Qué gasto es?", en: "What cost is it?" },
  ejMePagaronUnPrestamo: { es: "Ej. Me pagaron un préstamo", en: "e.g. A loan was paid back" },
  ejSeguroDelCarrito: { es: "Ej. Seguro del carrito", en: "e.g. Cart insurance" },
  queVendisteOpcional: { es: "¿Qué vendiste? (opcional)", en: "What did you sell? (optional)" },
  queComprasteOpcional: { es: "¿Qué compraste? (opcional)", en: "What did you buy? (optional)" },
  hoy: { es: "Hoy", en: "Today" },
  ayer: { es: "Ayer", en: "Yesterday" },
  guardar: { es: "Guardar", en: "Save" },
  noEncontreUnaCantidadIntenta: { es: "No encontré una cantidad. Intenta: “vendí 300 {0}”.", en: "I couldn't find an amount. Try: “I sold 300 {0}”." },
  entendiRevisaYGuarda: { es: "Entendí: {0}, {1}. Revisa y guarda.", en: "Got it: {0}, {1}. Check and save." },
  dimeCuantoVendistePorEjemplo: { es: "Dime cuánto vendiste. Por ejemplo: vendí cuarenta tamales a {0}. O toca tus productos.", en: "Tell me how much you sold. For example: I sold forty tamales at {1}. Or tap your products." },
  dimeQueComprasteOPagaste: { es: "Dime qué compraste o pagaste. Por ejemplo: compré masa y carne, {0}.", en: "Tell me what you bought or paid. For example: I bought dough and meat, {1}." },
} satisfies Record<string, Msg>;

export default TXT;
