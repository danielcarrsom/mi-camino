// Spending categories, income kinds and goal presets, in plain words.
import type { Lang } from "./i18n";

export type Label = { es: string; en: string };
export const pick = (l: Label, lang: Lang) => (lang === "en" ? l.en : l.es);

export type CategoryGroup = {
  id: string;
  label: Label;
  icon: string; // lucide icon name, resolved in <Icon>
  color: string;
};

export type Category = {
  id: string;
  group: string;
  label: Label;
  icon: string;
  keywords: string[]; // for the offline understanding fallback
  defaultRepeat: Repeat;
};

export type Repeat = "once" | "week" | "2weeks" | "month";

export const GROUPS: CategoryGroup[] = [
  { id: "casa", label: { es: "Casa", en: "Home" }, icon: "house", color: "#b34a2a" },
  { id: "comida", label: { es: "Comida", en: "Food" }, icon: "utensils", color: "#e0a33a" },
  { id: "transporte", label: { es: "Transporte", en: "Getting around" }, icon: "bus", color: "#3e7d4f" },
  { id: "familia", label: { es: "Familia", en: "Family" }, icon: "users", color: "#7a5c3e" },
  { id: "salud", label: { es: "Salud", en: "Health" }, icon: "heart-pulse", color: "#c0563a" },
  { id: "personal", label: { es: "Personal", en: "Personal" }, icon: "shirt", color: "#5f7a8a" },
  { id: "diversion", label: { es: "Diversión", en: "Fun" }, icon: "party-popper", color: "#9a6fb0" },
  { id: "deudas", label: { es: "Deudas", en: "Debts" }, icon: "credit-card", color: "#55534b" },
];

export const CATEGORIES: Category[] = [
  // Casa
  { id: "renta", group: "casa", label: { es: "Renta", en: "Rent" }, icon: "key-round", keywords: ["renta", "rent", "alquiler", "cuarto", "departamento", "apartamento", "depa"], defaultRepeat: "month" },
  { id: "luz", group: "casa", label: { es: "Luz", en: "Electricity" }, icon: "zap", keywords: ["luz", "electricidad", "electric", "con ed", "coned", "con edison"], defaultRepeat: "month" },
  { id: "agua", group: "casa", label: { es: "Agua", en: "Water" }, icon: "droplet", keywords: ["agua", "water"], defaultRepeat: "month" },
  { id: "gas", group: "casa", label: { es: "Gas", en: "Gas (home)" }, icon: "flame", keywords: ["gas de la casa", "calefaccion", "calefacción", "heating", "national grid"], defaultRepeat: "month" },
  { id: "internet", group: "casa", label: { es: "Internet", en: "Internet" }, icon: "wifi", keywords: ["internet", "wifi", "spectrum", "optimum"], defaultRepeat: "month" },
  { id: "telefono", group: "casa", label: { es: "Teléfono", en: "Phone" }, icon: "smartphone", keywords: ["telefono", "teléfono", "celular", "phone", "cel", "recarga", "metro pcs", "t-mobile", "boost"], defaultRepeat: "month" },
  // Comida
  { id: "super", group: "comida", label: { es: "Súper y mandado", en: "Groceries" }, icon: "shopping-cart", keywords: ["super", "súper", "mandado", "despensa", "groceries", "comida de la casa", "bodega", "mercado", "c-town", "key food"], defaultRepeat: "week" },
  { id: "comida_fuera", group: "comida", label: { es: "Comer fuera", en: "Eating out" }, icon: "utensils", keywords: ["restaurante", "comer fuera", "taqueria", "taquería", "lonche", "lunch", "cafe", "café", "pizza"], defaultRepeat: "once" },
  // Transporte
  { id: "metro", group: "transporte", label: { es: "Metro y camión", en: "Subway and bus" }, icon: "train-front", keywords: ["metro", "subway", "metrocard", "omny", "camion", "camión", "bus", "tren"], defaultRepeat: "week" },
  { id: "gasolina", group: "transporte", label: { es: "Gasolina", en: "Gas (car)" }, icon: "fuel", keywords: ["gasolina", "gas del carro", "gasoline", "gas station"], defaultRepeat: "week" },
  { id: "carro", group: "transporte", label: { es: "Carro (pago y seguro)", en: "Car (payment and insurance)" }, icon: "car", keywords: ["carro", "troca", "seguro del carro", "aseguranza", "car payment", "insurance"], defaultRepeat: "month" },
  { id: "taxi", group: "transporte", label: { es: "Taxi o Uber", en: "Taxi or Uber" }, icon: "car-taxi-front", keywords: ["taxi", "uber", "lyft"], defaultRepeat: "once" },
  // Familia
  { id: "envio", group: "familia", label: { es: "Envío a mi familia", en: "Money sent home" }, icon: "send", keywords: ["envio", "envío", "mande", "mandé", "remesa", "a mi mama", "a mi mamá", "a mi familia", "western union", "remitly"], defaultRepeat: "month" },
  { id: "escuela", group: "familia", label: { es: "Escuela de los niños", en: "Kids' school" }, icon: "school", keywords: ["escuela", "colegiatura", "utiles", "útiles", "school", "uniforme"], defaultRepeat: "month" },
  { id: "cuidado_ninos", group: "familia", label: { es: "Quien cuida a los niños", en: "Childcare" }, icon: "baby", keywords: ["niñera", "guarderia", "guardería", "daycare", "babysitter", "cuidar a los niños"], defaultRepeat: "week" },
  // Salud
  { id: "medicinas", group: "salud", label: { es: "Medicinas", en: "Medicine" }, icon: "pill", keywords: ["medicina", "medicinas", "farmacia", "pharmacy", "pastillas"], defaultRepeat: "once" },
  { id: "doctor", group: "salud", label: { es: "Doctor o dentista", en: "Doctor or dentist" }, icon: "stethoscope", keywords: ["doctor", "dentista", "clinica", "clínica", "consulta", "hospital"], defaultRepeat: "once" },
  // Personal
  { id: "ropa", group: "personal", label: { es: "Ropa y zapatos", en: "Clothes and shoes" }, icon: "shirt", keywords: ["ropa", "zapatos", "tenis", "clothes", "shoes"], defaultRepeat: "once" },
  { id: "cuidado", group: "personal", label: { es: "Corte y cuidado personal", en: "Haircut and personal care" }, icon: "scissors", keywords: ["corte", "peluqueria", "peluquería", "barberia", "barbería", "jabon", "shampoo", "haircut"], defaultRepeat: "once" },
  { id: "lavanderia", group: "personal", label: { es: "Lavandería", en: "Laundry" }, icon: "washing-machine", keywords: ["lavanderia", "lavandería", "laundry", "laundromat"], defaultRepeat: "week" },
  // Diversión
  { id: "salidas", group: "diversion", label: { es: "Salidas y fiestas", en: "Outings and parties" }, icon: "party-popper", keywords: ["fiesta", "salida", "cine", "partido", "boletos", "cerveza", "bar"], defaultRepeat: "once" },
  { id: "suscripciones", group: "diversion", label: { es: "Netflix, música y apps", en: "Netflix, music and apps" }, icon: "tv", keywords: ["netflix", "spotify", "youtube", "disney", "suscripcion", "suscripción"], defaultRepeat: "month" },
  // Deudas
  { id: "tarjeta", group: "deudas", label: { es: "Pago de tarjeta", en: "Card payment" }, icon: "credit-card", keywords: ["tarjeta", "credit card", "pago de la tarjeta"], defaultRepeat: "month" },
  { id: "prestamo", group: "deudas", label: { es: "Préstamo", en: "Loan" }, icon: "hand-coins", keywords: ["prestamo", "préstamo", "loan", "le debo", "debo"], defaultRepeat: "month" },
  // Catch-all
  { id: "otro", group: "personal", label: { es: "Otra cosa", en: "Something else" }, icon: "circle-ellipsis", keywords: [], defaultRepeat: "once" },
];

export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
export const groupById = (id: string) => GROUPS.find((g) => g.id === id) ?? GROUPS[0];

export const INCOME_CATEGORIES: Category[] = [
  { id: "trabajo", group: "ingreso", label: { es: "Pago del trabajo", en: "Pay from work" }, icon: "hammer", keywords: ["pago", "me pagaron", "cheque", "sueldo", "salario", "paycheck", "trabajo", "raya"], defaultRepeat: "week" },
  { id: "propinas", group: "ingreso", label: { es: "Propinas", en: "Tips" }, icon: "coins", keywords: ["propina", "propinas", "tips"], defaultRepeat: "once" },
  { id: "extra", group: "ingreso", label: { es: "Trabajo extra", en: "Extra work" }, icon: "wrench", keywords: ["extra", "chambita", "side", "trabajito"], defaultRepeat: "once" },
  { id: "regalo", group: "ingreso", label: { es: "Me regalaron o prestaron", en: "Gift or loan to me" }, icon: "gift", keywords: ["regalo", "me regalaron", "me prestaron"], defaultRepeat: "once" },
  { id: "mi_negocio", group: "ingreso", label: { es: "Sueldo de mi negocio", en: "Pay from my business" }, icon: "store", keywords: ["mi negocio", "mi sueldo del negocio"], defaultRepeat: "once" },
  { id: "otro_ingreso", group: "ingreso", label: { es: "Otro dinero", en: "Other money" }, icon: "wallet", keywords: [], defaultRepeat: "once" },
];
export const incomeCategoryById = (id: string) => INCOME_CATEGORIES.find((c) => c.id === id) ?? INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1];

export type GoalPreset = {
  id: string;
  label: Label;
  icon: string;
  visual: "house" | "jar";
  suggested: number; // a starting amount the user can change
  hint: Label;
};

export const GOAL_PRESETS: GoalPreset[] = [
  { id: "casa_mexico", label: { es: "Mi casita en México", en: "My home in Mexico" }, icon: "house", visual: "house", suggested: 15000, hint: { es: "Construir o comprar tu casa allá", en: "Build or buy your home back home" } },
  { id: "casa_aqui", label: { es: "Casa o depa aquí", en: "Home or apartment here" }, icon: "building-2", visual: "house", suggested: 6000, hint: { es: "Depósito y primeros meses", en: "Deposit and first months" } },
  { id: "emergencias", label: { es: "Dinero para emergencias", en: "Emergency money" }, icon: "shield-check", visual: "jar", suggested: 1500, hint: { es: "Para cuando algo sale mal", en: "For when something goes wrong" } },
  { id: "escuela", label: { es: "Escuela o universidad", en: "School or college" }, icon: "graduation-cap", visual: "jar", suggested: 5000, hint: { es: "Para ti o tus hijos", en: "For you or your kids" } },
  { id: "negocio", label: { es: "Empezar mi negocio", en: "Start my business" }, icon: "store", visual: "house", suggested: 3000, hint: { es: "Herramientas, puesto o mercancía", en: "Tools, a stand or stock" } },
  { id: "carro", label: { es: "Carro o troca", en: "Car or truck" }, icon: "car", visual: "jar", suggested: 5000, hint: { es: "Para trabajar o moverte", en: "To work or get around" } },
  { id: "viaje", label: { es: "Viaje", en: "Trip" }, icon: "plane", visual: "jar", suggested: 1200, hint: { es: "Visitar a la familia o pasear", en: "Visit family or travel" } },
  { id: "familia", label: { es: "Ayudar a mi familia", en: "Help my family" }, icon: "heart-handshake", visual: "jar", suggested: 2000, hint: { es: "Una fiesta, una operación, un apoyo", en: "A celebration, surgery, support" } },
  { id: "deudas", label: { es: "Pagar mis deudas", en: "Pay off my debts" }, icon: "hand-coins", visual: "jar", suggested: 2000, hint: { es: "Quedar libre de deudas", en: "Become debt free" } },
  { id: "retiro", label: { es: "Para cuando sea mayor", en: "For when I'm older" }, icon: "sprout", visual: "jar", suggested: 10000, hint: { es: "Tu retiro, poco a poco", en: "Your retirement, little by little" } },
];

export const goalPresetById = (id: string): GoalPreset =>
  GOAL_PRESETS.find((g) => g.id === id) ?? { id: "propia", label: { es: "Mi meta", en: "My goal" }, icon: "star", visual: "jar", suggested: 1000, hint: { es: "", en: "" } };
