// Content for "Aprender": games, lessons and trusted places to get help.
// Plain words, short sentences. Every piece works read aloud.
import type { Label } from "./catalog";
import type { Region } from "./taxes";

// ---------- Where each piece applies ----------
// nyc: New York City · ny: New York State · us: anywhere in the US · usother: US outside New York · mx: México.
// Content without `places` is for everyone.
export type Place = "nyc" | "ny" | "us" | "usother" | "mx";
export function placesFor(r: Region): Place[] {
  if (r.country === "mx") return ["mx"];
  if (r.state === "NY") return r.nyc ? ["nyc", "ny", "us"] : ["ny", "us"];
  return ["us", "usother"];
}
/** Keep only what applies where this person lives. */
export function forRegion<T extends { places?: Place[] }>(items: T[], r: Region): T[] {
  const here = placesFor(r);
  return items.filter((x) => !x.places || x.places.some((p) => here.includes(p)));
}

// ---------- Games ----------
export type Choice = { label: Label; icon?: string; correct: boolean };
export type Question = { prompt: Label; icon?: string; choices: Choice[]; why: Label };
export type Game = { id: string; title: Label; sub: Label; icon: string; color: string; questions: Question[]; places?: Place[] };

const needWant = (prompt: Label, icon: string, need: boolean, why: Label): Question => ({
  prompt, icon, why,
  choices: [
    { label: { es: "Lo necesito", en: "I need it" }, icon: "house", correct: need },
    { label: { es: "Lo quiero", en: "I want it" }, icon: "star", correct: !need },
  ],
});
const scamOk = (prompt: Label, icon: string, scam: boolean, why: Label): Question => ({
  prompt, icon, why,
  choices: [
    { label: { es: "Es estafa", en: "It's a scam" }, icon: "shield-alert", correct: scam },
    { label: { es: "Es normal", en: "It's normal" }, icon: "shield-check", correct: !scam },
  ],
});

export const GAMES: Game[] = [
  {
    id: "necesito",
    title: { es: "¿Lo necesito o lo quiero?", en: "Need it or want it?" },
    sub: { es: "Aprende a decidir en qué gastar primero", en: "Learn what to pay for first" },
    icon: "shopping-cart",
    color: "#316a42",
    questions: [
      needWant({ es: "Pagar la renta", en: "Paying rent" }, "key-round", true, { es: "La renta es tu techo. Siempre va primero.", en: "Rent is your roof. It always comes first." }),
      needWant({ es: "Un celular nuevo, aunque el tuyo todavía funciona", en: "A new phone, even though yours still works" }, "smartphone", false, { es: "Si el tuyo funciona, es un gusto. Puede esperar.", en: "If yours works, it's a treat. It can wait." }),
      needWant({ es: "Comida del súper para la semana", en: "Groceries for the week" }, "shopping-cart", true, { es: "Comer bien es una necesidad.", en: "Eating well is a need." }),
      needWant({ es: "Tenis de marca", en: "Brand-name sneakers" }, "shirt", false, { es: "Unos tenis sencillos también sirven. La marca es un gusto.", en: "Simple sneakers work too. The brand is a treat." }),
      needWant({ es: "La medicina que te dio el doctor", en: "The medicine your doctor gave you" }, "pill", true, { es: "Tu salud es lo más importante.", en: "Your health matters most." }),
      needWant({ es: "Comer en restaurante el fin de semana", en: "Eating out on the weekend" }, "utensils", false, { es: "Es rico, pero es un gusto. Planéalo en tu presupuesto.", en: "It's nice, but it's a treat. Plan it in your budget." }),
      needWant({ es: "El metro para ir al trabajo", en: "The subway to get to work" }, "train-front", true, { es: "Sin transporte no llegas al trabajo.", en: "Without transport you can't get to work." }),
      needWant({ es: "Ropa de invierno", en: "Winter clothes" }, "shirt", true, { es: "Cuando hace frío, abrigarte es necesario.", en: "When it’s cold, staying warm is a need." }),
    ],
  },
  {
    id: "estafa",
    places: ["us"],
    title: { es: "¿Es estafa?", en: "Is it a scam?" },
    sub: { es: "Descubre las trampas antes de caer", en: "Spot the traps before you fall for them" },
    icon: "shield-alert",
    color: "#b34a2a",
    questions: [
      scamOk({ es: "Te llaman “del IRS” y te piden pagar hoy con tarjetas de regalo", en: "Someone “from the IRS” calls and asks you to pay today with gift cards" }, "smartphone", true, { es: "El IRS nunca pide tarjetas de regalo ni llama para amenazarte.", en: "The IRS never asks for gift cards or calls to threaten you." }),
      scamOk({ es: "Llega tu factura de la luz con lo que gastaste el mes pasado", en: "Your electricity bill arrives with what you used last month" }, "zap", false, { es: "Es normal. Revisa que la cantidad tenga sentido.", en: "That's normal. Check that the amount makes sense." }),
      scamOk({ es: "Un “notario” te ofrece arreglar tus papeles de inmigración por $3,000", en: "A “notario” offers to fix your immigration papers for $3,000" }, "scale", true, { es: "En EE. UU. un notario no es abogado. Pide ayuda gratis en el Consulado o al 311.", en: "In the US a notario is not a lawyer. Ask the Consulate or 311 for free help." }),
      scamOk({ es: "Un mensaje “de tu banco” con un link te pide tu clave", en: "A text “from your bank” with a link asks for your PIN" }, "credit-card", true, { es: "Tu banco nunca te pide tu clave. Llama al número de atrás de tu tarjeta.", en: "Your bank never asks for your PIN. Call the number on the back of your card." }),
      scamOk({ es: "Te ofrecen un trabajo, pero primero tienes que pagar $200", en: "You're offered a job, but first you have to pay $200" }, "hammer", true, { es: "Un trabajo de verdad te paga a ti, no al revés.", en: "A real job pays you, not the other way around." }),
      scamOk({ es: "Tu jefe te da tu talón de pago con impuestos descontados", en: "Your boss gives you your paystub with taxes taken out" }, "wallet", false, { es: "Es normal: los impuestos se descuentan de tu pago.", en: "That's normal: taxes are taken from your pay." }),
      scamOk({ es: "“¡Ganaste un premio!” pero tienes que pagar para recibirlo", en: "“You won a prize!” but you have to pay to receive it" }, "gift", true, { es: "Si tienes que pagar para recibir un premio, es estafa.", en: "If you have to pay to get a prize, it's a scam." }),
    ],
  },
  {
    id: "cuanto",
    places: ["us"],
    title: { es: "¿Cuánto juntas?", en: "How much do you save?" },
    sub: { es: "Mira cómo crece lo poquito", en: "See how little amounts grow" },
    icon: "coins",
    color: "#e0a33a",
    questions: [
      {
        prompt: { es: "Si apartas $10 cada semana, ¿cuánto juntas en un año?", en: "If you set aside $10 every week, how much do you have in a year?" },
        icon: "coins",
        choices: [
          { label: { es: "$120", en: "$120" }, correct: false },
          { label: { es: "$520", en: "$520" }, correct: true },
          { label: { es: "$1,000", en: "$1,000" }, correct: false },
        ],
        why: { es: "Un año tiene 52 semanas: 52 × $10 = $520. ¡Lo poquito suma!", en: "A year has 52 weeks: 52 × $10 = $520. Little amounts add up!" },
      },
      {
        prompt: { es: "Si gastas $5 diarios en café, ¿cuánto es al mes?", en: "If you spend $5 a day on coffee, how much is that a month?" },
        icon: "utensils",
        choices: [
          { label: { es: "$50", en: "$50" }, correct: false },
          { label: { es: "$150", en: "$150" }, correct: true },
          { label: { es: "$500", en: "$500" }, correct: false },
        ],
        why: { es: "30 días × $5 = $150 al mes. Los gastos chiquitos también cuentan.", en: "30 days × $5 = $150 a month. Small spending counts too." },
      },
      {
        prompt: { es: "Envías $200. Una tienda cobra $10 y Finabien $2.99, con el mismo tipo de cambio. ¿Con cuál le llega más a tu familia?", en: "You send $200. A store charges $10 and Finabien $2.99, same exchange rate. Which gets more to your family?" },
        icon: "send",
        choices: [
          { label: { es: "Con la tienda", en: "The store" }, correct: false },
          { label: { es: "Con Finabien", en: "Finabien" }, correct: true },
          { label: { es: "Llega lo mismo", en: "The same" }, correct: false },
        ],
        why: { es: "Con menos comisión, llega más dinero. Siempre compara.", en: "A lower fee means more money arrives. Always compare." },
      },
      {
        prompt: { es: "Debes $1,000 en tu tarjeta y solo pagas el mínimo. ¿Qué pasa?", en: "You owe $1,000 on your card and only pay the minimum. What happens?" },
        icon: "credit-card",
        choices: [
          { label: { es: "La deuda se acaba rápido", en: "The debt ends quickly" }, correct: false },
          { label: { es: "Pagas mucho más por los intereses", en: "You pay much more in interest" }, correct: true },
          { label: { es: "No pasa nada", en: "Nothing happens" }, correct: false },
        ],
        why: { es: "Pagando solo el mínimo, la deuda dura años y pagas mucho más. Paga todo lo que puedas.", en: "Paying only the minimum, the debt lasts years and you pay much more. Pay as much as you can." },
      },
      {
        prompt: { es: "¿Cuánto conviene tener para emergencias?", en: "How much should you have for emergencies?" },
        icon: "shield-check",
        choices: [
          { label: { es: "Nada, no pasa nada", en: "Nothing, nothing happens" }, correct: false },
          { label: { es: "Lo de 3 meses de gastos, poco a poco", en: "3 months of expenses, little by little" }, correct: true },
          { label: { es: "Todo mi sueldo del año", en: "My whole year's pay" }, correct: false },
        ],
        why: { es: "Lo ideal es juntar lo de 3 meses de gastos. Empieza con poquito, como $10 a la semana.", en: "Ideally, save 3 months of expenses. Start small, like $10 a week." },
      },
    ],
  },
  // ----- México -----
  {
    id: "estafa_mx",
    places: ["mx"],
    title: { es: "¿Es estafa?", en: "Is it a scam?" },
    sub: { es: "Descubre las trampas antes de caer", en: "Spot the traps before you fall for them" },
    icon: "shield-alert",
    color: "#b34a2a",
    questions: [
      scamOk({ es: "Te llaman: “tu sobrino está detenido, deposita $5,000 en OXXO ahorita”", en: "A call: “your nephew is detained, deposit $5,000 at OXXO right now”" }, "smartphone", true, { es: "Es extorsión telefónica. Cuelga y llama tú a tu familiar.", en: "It’s phone extortion. Hang up and call your relative yourself." }),
      scamOk({ es: "Te llega tu recibo de luz de la CFE con lo que gastaste", en: "Your CFE electricity bill arrives with what you used" }, "zap", false, { es: "Es normal. Revisa que la cantidad tenga sentido.", en: "That’s normal. Check that the amount makes sense." }),
      scamOk({ es: "Un mensaje “del SAT” dice que debes dinero y te manda un link para pagar", en: "A text “from the SAT” says you owe money and sends a link to pay" }, "credit-card", true, { es: "El SAT no cobra por mensajes con links. Entra tú a sat.gob.mx o llama a MarcaSAT.", en: "The SAT doesn’t collect through texts with links. Go to sat.gob.mx yourself or call MarcaSAT." }),
      scamOk({ es: "Una app te presta $2,000 en minutos, pero pide ver tus contactos y fotos", en: "An app lends you $2,000 in minutes but wants your contacts and photos" }, "smartphone", true, { es: "Muchas de estas apps cobran intereses enormes y acosan a tus contactos. Revisa en Condusef antes.", en: "Many of these apps charge huge interest and harass your contacts. Check with Condusef first." }),
      scamOk({ es: "Tu banco te llama y te pide el código que te llegó por mensaje", en: "Your bank calls and asks for the code you got by text" }, "credit-card", true, { es: "Tu banco nunca te pide códigos ni tu NIP. Cuelga y llama al número de tu tarjeta.", en: "Your bank never asks for codes or your PIN. Hang up and call the number on your card." }),
      scamOk({ es: "Tu recibo de nómina muestra el descuento del IMSS", en: "Your payslip shows the IMSS deduction" }, "wallet", false, { es: "Es normal: es tu parte del seguro social.", en: "That’s normal: it’s your share of social security." }),
    ],
  },
  {
    id: "cuanto_mx",
    places: ["mx"],
    title: { es: "¿Cuánto juntas?", en: "How much do you save?" },
    sub: { es: "Mira cómo crece lo poquito", en: "See how little amounts grow" },
    icon: "coins",
    color: "#e0a33a",
    questions: [
      {
        prompt: { es: "Si apartas $100 cada semana, ¿cuánto juntas en un año?", en: "If you set aside $100 every week, how much do you have in a year?" },
        icon: "coins",
        choices: [
          { label: { es: "$1,200", en: "$1,200" }, correct: false },
          { label: { es: "$5,200", en: "$5,200" }, correct: true },
          { label: { es: "$10,000", en: "$10,000" }, correct: false },
        ],
        why: { es: "Un año tiene 52 semanas: 52 × $100 = $5,200. ¡Lo poquito suma!", en: "A year has 52 weeks: 52 × $100 = $5,200. Little amounts add up!" },
      },
      {
        prompt: { es: "Si gastas $40 diarios en refresco y botana, ¿cuánto es al mes?", en: "If you spend $40 a day on soda and snacks, how much is that a month?" },
        icon: "utensils",
        choices: [
          { label: { es: "$400", en: "$400" }, correct: false },
          { label: { es: "$1,200", en: "$1,200" }, correct: true },
          { label: { es: "$4,000", en: "$4,000" }, correct: false },
        ],
        why: { es: "30 días × $40 = $1,200 al mes. Los gastos chiquitos también cuentan.", en: "30 days × $40 = $1,200 a month. Small spending counts too." },
      },
      {
        prompt: { es: "Debes $10,000 en tu tarjeta y solo pagas el mínimo. ¿Qué pasa?", en: "You owe $10,000 on your card and only pay the minimum. What happens?" },
        icon: "credit-card",
        choices: [
          { label: { es: "La deuda se acaba rápido", en: "The debt ends quickly" }, correct: false },
          { label: { es: "Pagas mucho más por los intereses", en: "You pay much more in interest" }, correct: true },
          { label: { es: "No pasa nada", en: "Nothing happens" }, correct: false },
        ],
        why: { es: "Pagando solo el mínimo, la deuda dura años y pagas mucho más. Paga todo lo que puedas.", en: "Paying only the minimum, the debt lasts years and you pay much more. Pay as much as you can." },
      },
      {
        prompt: { es: "¿Cuánto conviene tener para emergencias?", en: "How much should you have for emergencies?" },
        icon: "shield-check",
        choices: [
          { label: { es: "Nada, no pasa nada", en: "Nothing, nothing happens" }, correct: false },
          { label: { es: "Lo de 3 meses de gastos, poco a poco", en: "3 months of expenses, little by little" }, correct: true },
          { label: { es: "Todo mi sueldo del año", en: "My whole year’s pay" }, correct: false },
        ],
        why: { es: "Lo ideal es juntar lo de 3 meses de gastos. Empieza con poquito, como $100 a la semana.", en: "Ideally, save 3 months of expenses. Start small, like $100 a week." },
      },
    ],
  },
];

// ---------- Lessons ----------
export type Lesson = { id: string; title: Label; icon: string; minutes: number; body: { es: string[]; en: string[] }; keys: { es: string[]; en: string[] }; link?: { href: string; label: Label }; places?: Place[] };

export const LESSONS: Lesson[] = [
  {
    id: "presupuesto",
    title: { es: "Haz tu presupuesto en 3 pasos", en: "Make your budget in 3 steps" },
    icon: "wallet",
    minutes: 2,
    body: {
      es: [
        "Un presupuesto es saber cuánto entra y cuánto sale. Nada más.",
        "Paso 1: anota cuánto ganas cada semana. Paso 2: anota tus gastos fijos, como la renta, la luz y el teléfono. Paso 3: decide cuánto apartas para tus metas antes de gastar en gustos.",
        "Primero lo necesario, luego el ahorro, y al final los gustos. Así el dinero alcanza más.",
      ],
      en: [
        "A budget is knowing how much comes in and how much goes out. That's all.",
        "Step 1: write down how much you earn each week. Step 2: write down your fixed expenses, like rent, electricity and phone. Step 3: decide how much you set aside for your goals before spending on treats.",
        "Needs first, then savings, and treats last. That way your money goes further.",
      ],
    },
    keys: { es: ["Anota lo que ganas", "Anota tus gastos fijos", "Aparta para tus metas antes de los gustos"], en: ["Write down what you earn", "Write down fixed expenses", "Save for goals before treats"] },
    link: { href: "/casita/dinero", label: { es: "Ver mi dinero", en: "See my money" } },
  },
  {
    id: "emergencias",
    places: ["us"],
    title: { es: "Tu dinero para emergencias", en: "Your emergency money" },
    icon: "shield-check",
    minutes: 2,
    body: {
      es: [
        "Las emergencias llegan sin avisar: una enfermedad, perder el trabajo, un viaje urgente a México.",
        "Lo ideal es tener guardado lo que gastas en 3 meses. Parece mucho, pero se junta poco a poco: con $10 a la semana juntas $520 en un año.",
        "Guárdalo en un lugar seguro, como una cuenta de ahorro, y no lo uses para gustos.",
      ],
      en: [
        "Emergencies come without warning: an illness, losing your job, an urgent trip home.",
        "Ideally, keep what you spend in 3 months. It sounds like a lot, but it adds up: $10 a week is $520 in a year.",
        "Keep it somewhere safe, like a savings account, and don't use it for treats.",
      ],
    },
    keys: { es: ["Meta: 3 meses de gastos", "Empieza con poquito", "Guárdalo en un lugar seguro"], en: ["Goal: 3 months of expenses", "Start small", "Keep it somewhere safe"] },
    link: { href: "/casita/metas?nueva=1", label: { es: "Crear mi meta", en: "Create my goal" } },
  },
  {
    id: "banco",
    places: ["us"],
    title: { es: "Tu primera cuenta de banco", en: "Your first bank account" },
    icon: "landmark",
    minutes: 3,
    body: {
      es: [
        "Tener tu dinero en un banco o cooperativa es más seguro que en efectivo en la casa: si te roban o hay un incendio, no lo pierdes.",
        "Muchos bancos y cooperativas aceptan el pasaporte o la matrícula consular, y algunos aceptan IDNYC. Las reglas cambian según el banco, así que pregunta antes de ir.",
        "Busca una cuenta sin cargos mensuales. En los Centros de Empoderamiento Financiero de la ciudad te ayudan gratis a encontrar una cuenta segura: llama al 311.",
      ],
      en: [
        "Keeping your money in a bank or credit union is safer than cash at home: if you're robbed or there's a fire, you don't lose it.",
        "Many banks and credit unions accept a passport or Matrícula Consular, and some accept IDNYC. Rules change by bank, so ask before you go.",
        "Look for an account with no monthly fees. The city's Financial Empowerment Centers help you find a safe account for free: call 311.",
      ],
    },
    keys: { es: ["Más seguro que efectivo", "Pregunta qué identificación aceptan", "Busca una cuenta sin cargos"], en: ["Safer than cash", "Ask which ID they accept", "Find a no-fee account"] },
  },
  {
    id: "credito",
    title: { es: "¿Qué es el crédito?", en: "What is credit?" },
    icon: "credit-card",
    minutes: 3,
    body: {
      es: [
        "El crédito es tu historial de cómo pagas lo que debes. Con buen crédito es más fácil rentar un departamento, comprar un carro o pedir un préstamo.",
        "Para empezar, muchas personas usan una tarjeta asegurada: dejas un depósito y usas la tarjeta solo hasta esa cantidad.",
        "La regla de oro: paga siempre a tiempo y usa poquito de tu límite. Si solo pagas el mínimo, pagas mucho más por los intereses.",
      ],
      en: [
        "Credit is your record of how you pay what you owe. With good credit it's easier to rent an apartment, buy a car or get a loan.",
        "To start, many people use a secured card: you leave a deposit and use the card only up to that amount.",
        "The golden rule: always pay on time and use only a little of your limit. If you only pay the minimum, you pay much more in interest.",
      ],
    },
    keys: { es: ["Paga siempre a tiempo", "Usa poquito de tu límite", "Evita pagar solo el mínimo"], en: ["Always pay on time", "Use little of your limit", "Avoid paying only the minimum"] },
  },
  {
    id: "fraudes",
    places: ["us"],
    title: { es: "Cómo evitar fraudes", en: "How to avoid scams" },
    icon: "shield-alert",
    minutes: 3,
    body: {
      es: [
        "Los estafadores usan miedo y prisa: “paga hoy o te arrestan”, “te van a deportar”, “ganaste un premio”.",
        "Señales de alerta: te piden pagar con tarjetas de regalo, transferencias o cripto; te piden tu clave; te ofrecen arreglar papeles de inmigración. En EE. UU. un notario no es abogado.",
        "Si algo te da desconfianza, cuelga y pregunta en el Consulado o al 311. Puedes denunciar fraudes con la Fiscalía de Nueva York al 1-800-771-7755.",
      ],
      en: [
        "Scammers use fear and rush: “pay today or you'll be arrested”, “you'll be deported”, “you won a prize”.",
        "Warning signs: they ask for gift cards, wires or crypto; they ask for your PIN; they offer to fix immigration papers. In the US a notario is not a lawyer.",
        "If something feels wrong, hang up and ask the Consulate or 311. You can report fraud to the New York Attorney General at 1-800-771-7755.",
      ],
    },
    keys: { es: ["Desconfía de la prisa y las amenazas", "Nunca pagues con tarjetas de regalo", "Un notario no es abogado"], en: ["Distrust rush and threats", "Never pay with gift cards", "A notario is not a lawyer"] },
    link: { href: "/casita/documentos", label: { es: "Revisar un papel", en: "Check a paper" } },
  },
  {
    id: "talon",
    places: ["us"],
    title: { es: "Entiende tu talón de pago", en: "Understand your paystub" },
    icon: "hammer",
    minutes: 2,
    body: {
      es: [
        "Tu talón de pago dice cuánto ganaste antes y después de descuentos.",
        "“Gross” es lo que ganaste en total. “Net” es lo que de verdad te llega. En medio están los descuentos: impuestos federales, del estado y de la ciudad, Seguro Social y Medicare.",
        "Revisa que las horas sean correctas. Si trabajaste más de 40 horas en la semana, normalmente las horas extra se pagan más.",
      ],
      en: [
        "Your paystub shows what you earned before and after deductions.",
        "“Gross” is what you earned in total. “Net” is what actually reaches you. In between are deductions: federal, state and city taxes, Social Security and Medicare.",
        "Check that your hours are right. If you worked more than 40 hours in the week, overtime is usually paid more.",
      ],
    },
    keys: { es: ["Gross = lo que ganaste", "Net = lo que te llega", "Revisa tus horas"], en: ["Gross = what you earned", "Net = what you get", "Check your hours"] },
    link: { href: "/casita/anotar?tipo=gane", label: { es: "Anotar mi pago", en: "Add my pay" } },
  },
  {
    id: "negocio",
    title: { es: "Separa el dinero de tu casa y de tu negocio", en: "Separate home and business money" },
    icon: "store",
    minutes: 2,
    body: {
      es: [
        "Si mezclas el dinero de tu casa con el de tu negocio, no sabes si tu negocio de verdad deja ganancia.",
        "Lo mejor es tener dos bolsas o dos cuentas: una para el negocio y otra para la casa. Del negocio, págate un sueldo fijo cada semana.",
        "Así sabes cuánto gana tu negocio y tu familia tiene un ingreso estable.",
      ],
      en: [
        "If you mix home money with business money, you don't know if your business really makes a profit.",
        "Best is two pouches or two accounts: one for the business and one for home. Pay yourself a fixed salary from the business each week.",
        "That way you know what your business earns and your family has steady income.",
      ],
    },
    keys: { es: ["Dos bolsas o dos cuentas", "Págate un sueldo fijo", "Así ves si hay ganancia"], en: ["Two pouches or accounts", "Pay yourself a fixed salary", "Then you see the profit"] },
    link: { href: "/negocio", label: { es: "Ir a Mi Negocio", en: "Go to Mi Negocio" } },
  },
  // ----- México -----
  {
    id: "emergencias_mx",
    places: ["mx"],
    title: { es: "Tu dinero para emergencias", en: "Your emergency money" },
    icon: "shield-check",
    minutes: 2,
    body: {
      es: [
        "Las emergencias llegan sin avisar: una enfermedad, perder el trabajo o arreglar la casa.",
        "Lo ideal es tener guardado lo que gastas en 3 meses. Se junta poco a poco: con $100 a la semana juntas $5,200 en un año.",
        "Guárdalo en una cuenta de ahorro y no lo uses para gustos. En los bancos, el IPAB protege tus ahorros hasta un límite por persona.",
      ],
      en: [
        "Emergencies come without warning: an illness, losing your job or fixing your home.",
        "Ideally, keep what you spend in 3 months. It adds up little by little: $100 a week is $5,200 in a year.",
        "Keep it in a savings account and don’t use it for treats. In banks, IPAB protects your savings up to a limit per person.",
      ],
    },
    keys: { es: ["Meta: 3 meses de gastos", "Empieza con poquito", "Guárdalo en un lugar seguro"], en: ["Goal: 3 months of expenses", "Start small", "Keep it somewhere safe"] },
    link: { href: "/casita/metas?nueva=1", label: { es: "Crear mi meta", en: "Create my goal" } },
  },
  {
    id: "banco_mx",
    places: ["mx"],
    title: { es: "Tu cuenta de banco en México", en: "Your bank account in Mexico" },
    icon: "landmark",
    minutes: 2,
    body: {
      es: [
        "Tener tu dinero en un banco es más seguro que en efectivo en la casa.",
        "Hay cuentas básicas sin comisiones que puedes abrir con tu INE, y a veces solo con tu teléfono. Pregunta por una cuenta “sin comisión por manejo de cuenta”.",
        "Antes de abrirla, pregunta cuánto cobran por retirar en cajeros de otros bancos. Si tienes un problema con tu banco, Condusef te ayuda gratis.",
      ],
      en: [
        "Keeping your money in a bank is safer than cash at home.",
        "There are basic no-fee accounts you can open with your INE, sometimes just with your phone. Ask for an account “with no account management fee”.",
        "Before opening it, ask what they charge to withdraw at other banks’ ATMs. If you have a problem with your bank, Condusef helps you for free.",
      ],
    },
    keys: { es: ["Más seguro que efectivo", "Busca una cuenta sin comisiones", "Condusef te defiende"], en: ["Safer than cash", "Find a no-fee account", "Condusef defends you"] },
  },
  {
    id: "fraudes_mx",
    places: ["mx"],
    title: { es: "Cómo evitar fraudes en México", en: "How to avoid scams in Mexico" },
    icon: "shield-alert",
    minutes: 3,
    body: {
      es: [
        "Los estafadores usan miedo y prisa: “tu familiar está detenido, deposita ya”, “tienes una deuda con el SAT”, “ganaste un premio”.",
        "Señales de alerta: te piden depositar en OXXO o a una cuenta personal, te piden tu NIP o el código que te llegó por mensaje, o te prestan dinero por una app que pide acceso a tus contactos.",
        "Si algo te da desconfianza, cuelga y llama tú al número oficial. Puedes denunciar fraudes financieros en Condusef al 55 5340 0999.",
      ],
      en: [
        "Scammers use fear and rush: “your relative is detained, deposit now”, “you owe the SAT”, “you won a prize”.",
        "Warning signs: they ask you to deposit at OXXO or into a personal account, ask for your PIN or the code you got by text, or lend you money through an app that wants your contacts.",
        "If something feels wrong, hang up and call the official number yourself. You can report financial fraud to Condusef at 55 5340 0999.",
      ],
    },
    keys: { es: ["Desconfía de la prisa y las amenazas", "Nunca des tu NIP ni códigos", "Cuidado con apps de préstamos"], en: ["Distrust rush and threats", "Never give your PIN or codes", "Beware of loan apps"] },
    link: { href: "/casita/documentos", label: { es: "Revisar un papel", en: "Check a paper" } },
  },
  {
    id: "nomina_mx",
    places: ["mx"],
    title: { es: "Entiende tu recibo de nómina", en: "Understand your payslip" },
    icon: "hammer",
    minutes: 3,
    body: {
      es: [
        "Tu recibo de nómina dice cuánto ganaste (percepciones), cuánto te descontaron (deducciones) y cuánto te depositaron (neto).",
        "Los descuentos más comunes son el ISR (impuesto) y la cuota del IMSS. Si ganas poco, el subsidio para el empleo baja tu ISR, y si ganas el salario mínimo no te deben quitar ISR.",
        "Revisa que aparezca tu número de seguridad social: así sabes que tu patrón te registró en el IMSS.",
      ],
      en: [
        "Your payslip shows what you earned (percepciones), what was taken out (deducciones) and what was deposited (net).",
        "The most common deductions are ISR (income tax) and the IMSS fee. If you earn little, the employment subsidy lowers your ISR, and on minimum wage no ISR should be taken out.",
        "Check that your social security number appears: that’s how you know your employer registered you with IMSS.",
      ],
    },
    keys: { es: ["Percepciones = lo que ganaste", "Neto = lo que te depositan", "Revisa tu número del IMSS"], en: ["Percepciones = what you earned", "Net = what is deposited", "Check your IMSS number"] },
    link: { href: "/casita/anotar?tipo=gane", label: { es: "Anotar mi pago", en: "Add my pay" } },
  },
];

// ---------- Trusted help ----------
export type Need = "dinero" | "impuestos" | "fraude" | "documentos" | "envios" | "casa";
export type Resource = { id: string; name: Label; what: Label; needs: string[]; places: Place[]; icon: string; phone?: { tel: string; show: string }; phone2?: { tel: string; show: string; label: Label }; web?: { href: string; show: string }; free: boolean; note?: Label };

export type NeedItem = { id: string; label: Label; icon: string };
export const NEEDS: NeedItem[] = [
  { id: "todos", label: { es: "Todo", en: "All" }, icon: "star" },
  { id: "dinero", label: { es: "Dinero y crédito", en: "Money and credit" }, icon: "wallet" },
  { id: "impuestos", label: { es: "Impuestos", en: "Taxes" }, icon: "landmark" },
  { id: "fraude", label: { es: "Fraudes", en: "Scams" }, icon: "shield-alert" },
  { id: "documentos", label: { es: "Documentos", en: "Documents" }, icon: "file-text" },
  { id: "envios", label: { es: "Enviar dinero", en: "Sending money" }, icon: "send" },
  { id: "casa", label: { es: "Vivienda y ayuda legal", en: "Housing and legal help" }, icon: "house" },
];

export const RESOURCES: Resource[] = [
  {
    id: "consulado", icon: "building-2", free: true,
    places: ["nyc", "ny"],
    name: { es: "Consulado General de México en Nueva York", en: "Consulate General of Mexico in New York" },
    what: { es: "Documentos, protección y orientación para mexicanos. 27 E 39th St, Manhattan.", en: "Documents, protection and guidance for Mexicans. 27 E 39th St, Manhattan." },
    needs: ["documentos", "fraude", "envios", "casa"],
    phone: { tel: "+12122176400", show: "(212) 217-6400" },
    phone2: { tel: "+19174592143", show: "(917) 459-2143", label: { es: "Emergencias", en: "Emergencies" } },
    web: { href: "https://consulmex.sre.gob.mx/nuevayork/", show: "consulmex.sre.gob.mx/nuevayork" },
  },
  {
    id: "fec", icon: "wallet", free: true,
    places: ["nyc"],
    name: { es: "Centros de Empoderamiento Financiero (NYC)", en: "NYC Financial Empowerment Centers" },
    what: { es: "Asesoría financiera gratis, uno a uno y en tu idioma: presupuesto, crédito, deudas y abrir una cuenta segura. Para mayores de 18 que viven o trabajan en NYC.", en: "Free one-on-one financial counseling in your language: budget, credit, debt and opening a safe account. For adults who live or work in NYC." },
    needs: ["dinero"],
    phone: { tel: "311", show: "311" },
    web: { href: "https://nyc.gov/TalkMoney", show: "nyc.gov/TalkMoney" },
  },
  {
    id: "taxprep", icon: "landmark", free: true,
    places: ["nyc"],
    name: { es: "Preparación de impuestos gratis (NYC Free Tax Prep)", en: "NYC Free Tax Prep" },
    what: { es: "Te hacen tus impuestos gratis si ganas hasta $68,000 al año (o $97,000 con dependientes). Más de 140 lugares en la ciudad.", en: "They do your taxes for free if you earn up to $68,000 a year ($97,000 with dependents). Over 140 sites in the city." },
    needs: ["impuestos"],
    phone: { tel: "311", show: "311" },
    web: { href: "https://nyc.gov/TaxPrep", show: "nyc.gov/TaxPrep" },
    note: { es: "Límites de la temporada 2026.", en: "2026 season limits." },
  },
  {
    id: "ag", icon: "scale", free: true,
    places: ["ny"],
    name: { es: "Fiscalía General de Nueva York (fraudes al consumidor)", en: "New York Attorney General (consumer fraud)" },
    what: { es: "Para denunciar estafas, cobros injustos o negocios que te engañaron.", en: "To report scams, unfair charges or businesses that cheated you." },
    needs: ["fraude"],
    phone: { tel: "+18007717755", show: "1-800-771-7755" },
    web: { href: "https://ag.ny.gov/file-complaint", show: "ag.ny.gov/file-complaint" },
  },
  {
    id: "ftc", icon: "shield-alert", free: true,
    places: ["us"],
    name: { es: "Comisión Federal de Comercio (FTC)", en: "Federal Trade Commission (FTC)" },
    what: { es: "Para reportar fraudes en internet, por teléfono o por mensaje. Tiene página en español.", en: "To report fraud online, by phone or by text. Available in Spanish." },
    needs: ["fraude"],
    web: { href: "https://reportefraude.ftc.gov", show: "reportefraude.ftc.gov" },
  },
  {
    id: "311", icon: "phone", free: true,
    places: ["nyc"],
    name: { es: "Ciudad de Nueva York · 311", en: "New York City · 311" },
    what: { es: "Para casi todo de la ciudad: problemas con tu casero, ayuda legal gratis, IDNYC y servicios. Pide intérprete en tu idioma.", en: "For almost anything city-related: landlord problems, free legal help, IDNYC and services. Ask for an interpreter." },
    needs: ["casa", "documentos", "dinero"],
    phone: { tel: "311", show: "311" },
    web: { href: "https://portal.311.nyc.gov", show: "portal.311.nyc.gov" },
  },
  {
    id: "finabien", icon: "send", free: true,
    places: ["us", "mx"],
    name: { es: "Finabien (Financiera para el Bienestar)", en: "Finabien" },
    what: { es: "Tarjeta del gobierno de México para enviar dinero con menos costo. Gratis, en el Consulado o en línea.", en: "Mexican government card to send money for less. Free, at the Consulate or online." },
    needs: ["envios", "dinero"],
    web: { href: "https://www.finabien.gob.mx", show: "finabien.gob.mx" },
  },
  // ----- Anywhere in the US (outside New York City) -----
  {
    id: "consulados", icon: "building-2", free: true, places: ["usother"],
    name: { es: "Consulados de México en Estados Unidos", en: "Mexican Consulates in the United States" },
    what: { es: "Hay más de 50 consulados. Te ayudan con documentos, protección y orientación. Busca el tuyo en la página oficial.", en: "There are more than 50 consulates. They help with documents, protection and guidance. Find yours on the official site." },
    needs: ["documentos", "fraude", "envios", "casa"],
    web: { href: "https://directorio.sre.gob.mx", show: "directorio.sre.gob.mx" },
  },
  {
    id: "vita", icon: "landmark", free: true, places: ["usother"],
    name: { es: "Ayuda gratis con impuestos (VITA del IRS)", en: "Free tax help (IRS VITA)" },
    what: { es: "Voluntarios certificados te hacen tus impuestos gratis si tus ingresos son bajos o medios. Busca el lugar más cercano.", en: "Certified volunteers do your taxes for free if your income is low or moderate. Find the closest site." },
    needs: ["impuestos"],
    phone: { tel: "+18009069887", show: "1-800-906-9887" },
    web: { href: "https://www.irs.gov/vita", show: "irs.gov/vita" },
  },
  {
    id: "cfpb", icon: "wallet", free: true, places: ["us"],
    name: { es: "Oficina para la Protección Financiera del Consumidor (CFPB)", en: "Consumer Financial Protection Bureau (CFPB)" },
    what: { es: "Para quejas contra bancos, tarjetas, préstamos o envíos de dinero. Atiende en español.", en: "For complaints about banks, cards, loans or money transfers. Help in Spanish." },
    needs: ["dinero", "envios", "fraude"],
    phone: { tel: "+18554112372", show: "1-855-411-2372" },
    web: { href: "https://www.consumerfinance.gov/es/", show: "consumerfinance.gov/es" },
  },
  {
    id: "211", icon: "phone", free: true, places: ["usother"],
    name: { es: "Línea 211", en: "211 helpline" },
    what: { es: "Te conecta con ayuda local: comida, renta, servicios, ayuda legal e impuestos. Pide atención en español.", en: "Connects you with local help: food, rent, utilities, legal help and taxes. Ask for Spanish." },
    needs: ["casa", "dinero", "impuestos"],
    phone: { tel: "211", show: "211" },
  },
  // ----- México -----
  {
    id: "condusef", icon: "shield-alert", free: true, places: ["mx"],
    name: { es: "Condusef", en: "Condusef (financial consumer protection)" },
    what: { es: "Te defiende contra bancos, tarjetas, préstamos, seguros y Afores: quejas, cobros que no reconoces y fraudes financieros. Revisa si una financiera es real antes de pedirle un préstamo.", en: "Defends you against banks, cards, loans, insurers and Afores: complaints, charges you don’t recognize and financial fraud. Check if a lender is real before borrowing." },
    needs: ["dinero", "fraude"],
    phone: { tel: "+525553400999", show: "55 5340 0999" },
    web: { href: "https://www.condusef.gob.mx", show: "condusef.gob.mx" },
  },
  {
    id: "profeco", icon: "scale", free: true, places: ["mx"],
    name: { es: "Profeco (Procuraduría Federal del Consumidor)", en: "Profeco (consumer protection)" },
    what: { es: "Para quejas contra tiendas, servicios, rentas y compras en línea que no cumplen.", en: "For complaints about stores, services, rentals and online purchases that don’t deliver." },
    needs: ["fraude", "casa"],
    phone: { tel: "+528004688722", show: "800 468 8722" },
    phone2: { tel: "+525555688722", show: "55 5568 8722", label: { es: "Ciudad de México", en: "Mexico City" } },
    web: { href: "https://www.gob.mx/profeco", show: "gob.mx/profeco" },
  },
  {
    id: "sat", icon: "landmark", free: true, places: ["mx"],
    name: { es: "SAT (impuestos en México)", en: "SAT (Mexican taxes)" },
    what: { es: "Orientación gratis sobre tu RFC, tu recibo de nómina, la declaración y el RESICO. El SAT nunca te pide pagar por WhatsApp ni a cuentas personales.", en: "Free guidance on your RFC, payslip, tax return and RESICO. The SAT never asks you to pay by WhatsApp or into personal accounts." },
    needs: ["impuestos", "documentos"],
    phone: { tel: "+525562722728", show: "MarcaSAT 55 627 22 728" },
    web: { href: "https://www.sat.gob.mx", show: "sat.gob.mx" },
  },
  {
    id: "imss", icon: "shield-check", free: true, places: ["mx"],
    name: { es: "IMSS", en: "IMSS (Mexican Social Security)" },
    what: { es: "Revisa si tu patrón te tiene registrado, tus semanas cotizadas y tu número de seguridad social.", en: "Check whether your employer registered you, your contribution weeks and your social security number." },
    needs: ["documentos", "dinero"],
    phone: { tel: "+528006232323", show: "800 623 2323" },
    web: { href: "https://www.imss.gob.mx", show: "imss.gob.mx" },
  },
];
