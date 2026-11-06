// Mi Negocio: categories, the business "semáforo", product costs, the
// look-ahead calculator and plain-language suggestions. All of it works
// offline, without AI.
import type { Label } from "./catalog";
import type { Repeat } from "./catalog";
import type { Lang } from "./i18n";
import { toMonthly, money } from "./money";
import { numbersIn, repeatIn, strip } from "./understand";

// ---------- Types (stored in UserData.business) ----------
export type BizEntry = {
  id: string;
  kind: "in" | "out";
  category: string;
  amount: number;
  repeat: Repeat;       // once = happened that day; week/month = fixed cost or steady income
  note: string;
  date: string;
  source: "voz" | "texto" | "foto" | "manual";
};

export type Product = {
  id: string;
  name: string;
  cost: number;         // what it costs you to make or buy ONE
  price: number;        // what you sell ONE for
  perWeek: number;      // how many you sell in a normal week
  createdAt: string;
};

export type BizType = "comida" | "tienda" | "ropa" | "belleza" | "limpieza" | "construccion" | "catalogo" | "transporte" | "otro";

// ---------- Categories ----------
export type BizCategory = { id: string; kind: "in" | "out"; label: Label; icon: string; fixed: boolean; repeat: Repeat; keywords: string[]; hidden?: boolean };

export const BIZ_CATEGORIES: BizCategory[] = [
  // money coming in
  { id: "ventas", kind: "in", label: { es: "Ventas", en: "Sales" }, icon: "coins", fixed: false, repeat: "once", keywords: ["vendi", "venta", "ventas", "vendimos", "sold", "sales"] },
  { id: "pedidos", kind: "in", label: { es: "Pedidos y encargos", en: "Orders" }, icon: "gift", fixed: false, repeat: "once", keywords: ["pedido", "encargo", "orden", "order", "catering", "evento", "fiesta"] },
  { id: "servicio", kind: "in", label: { es: "Cobré un trabajo", en: "Paid for a job" }, icon: "wrench", fixed: false, repeat: "once", keywords: ["cobre", "servicio", "trabajo", "limpieza", "corte", "arregle", "job"] },
  { id: "otro_in", kind: "in", label: { es: "Otro dinero", en: "Other money" }, icon: "wallet", fixed: false, repeat: "once", keywords: [] },
  // costs that go up and down with what you sell
  { id: "mercancia", kind: "out", label: { es: "Mercancía o ingredientes", en: "Stock or ingredients" }, icon: "shopping-cart", fixed: false, repeat: "once", keywords: ["mercancia", "ingrediente", "masa", "maiz", "carne", "pollo", "queso", "tortilla", "harina", "aceite", "azucar", "frijol", "verdura", "fruta", "chile", "tela", "hilo", "pintura", "jabon", "cloro", "material", "producto", "surtir", "mayoreo", "restaurant depot", "compre", "stock"] },
  { id: "empaque", kind: "out", label: { es: "Empaques y bolsas", en: "Packaging" }, icon: "package", fixed: false, repeat: "once", keywords: ["empaque", "bolsa", "caja", "vaso", "plato", "servilleta", "hoja", "packaging"] },
  { id: "transporte", kind: "out", label: { es: "Gasolina y transporte", en: "Gas and transport" }, icon: "fuel", fixed: false, repeat: "once", keywords: ["gasolina", "gas del carro", "uber", "taxi", "metro", "transporte", "envio", "delivery"] },
  // fixed costs
  { id: "local", kind: "out", label: { es: "Renta del local o cocina", en: "Rent for space or kitchen" }, icon: "key-round", fixed: true, repeat: "month", keywords: ["renta", "local", "cocina", "puesto", "rent"] },
  { id: "permisos", kind: "out", label: { es: "Permisos y licencias", en: "Permits and licenses" }, icon: "file-text", fixed: true, repeat: "month", keywords: ["permiso", "licencia", "permit", "license", "seguro"] },
  { id: "servicios", kind: "out", label: { es: "Luz, gas y agua", en: "Utilities" }, icon: "zap", fixed: true, repeat: "month", keywords: ["luz", "gas", "agua", "electricidad", "con ed", "coned"] },
  { id: "telefono", kind: "out", label: { es: "Teléfono e internet", en: "Phone and internet" }, icon: "smartphone", fixed: true, repeat: "month", keywords: ["telefono", "celular", "internet", "phone"] },
  { id: "ayudantes", kind: "out", label: { es: "Pago a ayudantes", en: "Helpers' pay" }, icon: "users", fixed: true, repeat: "week", keywords: ["ayudante", "empleado", "trabajador", "le pague a", "sueldo de"] },
  { id: "equipo", kind: "out", label: { es: "Equipo y herramientas", en: "Equipment and tools" }, icon: "hammer", fixed: false, repeat: "once", keywords: ["equipo", "herramienta", "maquina", "estufa", "olla", "carrito", "hielera"] },
  { id: "publicidad", kind: "out", label: { es: "Anuncios y volantes", en: "Ads and flyers" }, icon: "megaphone", fixed: false, repeat: "once", keywords: ["anuncio", "volante", "publicidad", "facebook", "instagram", "ads"] },
  { id: "otro_fijo", kind: "out", label: { es: "Otro gasto fijo", en: "Other fixed cost" }, icon: "circle-ellipsis", fixed: true, repeat: "month", keywords: [] },
  { id: "impuestos", kind: "out", label: { es: "Impuestos", en: "Taxes" }, icon: "landmark", fixed: false, repeat: "once", keywords: ["impuesto", "tax", "irs"] },
  { id: "otro_out", kind: "out", label: { es: "Otro gasto", en: "Other cost" }, icon: "circle-ellipsis", fixed: false, repeat: "once", keywords: [] },
  // owner's pay: not a cost of the business, money moved to your home
  { id: "mi_sueldo", kind: "out", label: { es: "Mi sueldo", en: "My pay" }, icon: "hand-coins", fixed: false, repeat: "once", keywords: [], hidden: true },
];
export const bizCategoryById = (id: string) => BIZ_CATEGORIES.find((c) => c.id === id) ?? BIZ_CATEGORIES.find((c) => c.id === "otro_out")!;

export const BIZ_TYPES: { id: BizType; label: Label; icon: string }[] = [
  { id: "comida", label: { es: "Comida", en: "Food" }, icon: "utensils" },
  { id: "tienda", label: { es: "Tienda o abarrotes", en: "Store" }, icon: "store" },
  { id: "ropa", label: { es: "Ropa o costura", en: "Clothes or sewing" }, icon: "shirt" },
  { id: "belleza", label: { es: "Belleza o barbería", en: "Beauty or barber" }, icon: "scissors" },
  { id: "limpieza", label: { es: "Limpieza", en: "Cleaning" }, icon: "washing-machine" },
  { id: "construccion", label: { es: "Construcción o arreglos", en: "Construction or repairs" }, icon: "hammer" },
  { id: "catalogo", label: { es: "Venta por catálogo", en: "Catalog sales" }, icon: "gift" },
  { id: "transporte", label: { es: "Entregas o transporte", en: "Delivery or transport" }, icon: "car" },
  { id: "otro", label: { es: "Otro", en: "Other" }, icon: "circle-ellipsis" },
];
export const bizTypeById = (id: string) => BIZ_TYPES.find((t) => t.id === id) ?? BIZ_TYPES[BIZ_TYPES.length - 1];

// ---------- Numbers ----------
const DAY = 86400000;
const WEEKS_PER_MONTH = 52 / 12;
const isCost = (e: BizEntry) => e.kind === "out" && e.category !== "mi_sueldo";

export type BizNumbers = {
  sales: number;        // last 30 days, incl. steady monthly income
  varCosts: number;     // one-time costs in the last 30 days
  fixed: number;        // fixed costs per month
  profit: number;       // sales − costs
  margin: number;       // profit / sales (−1 when no sales)
  prevSales: number;    // the 30 days before
  trend: number | null; // change in sales vs the previous 30 days
  paidMe: number;       // what you paid yourself in the last 30 days
  weeklySales: number;  // average of the last 4 weeks
  weeklyVar: number;
  daysOfData: number;
  hasData: boolean;
};

export function bizNumbers(entries: BizEntry[], now = Date.now()): BizNumbers {
  let sales = 0, varCosts = 0, prevSales = 0, paidMe = 0, sales28 = 0, var28 = 0, fixed = 0, steadyIn = 0;
  let first = now;
  for (const e of entries) {
    const t = new Date(e.date).getTime();
    first = Math.min(first, t);
    const age = now - t;
    if (e.repeat !== "once") {
      if (e.kind === "in") steadyIn += toMonthly(e.amount, e.repeat);
      else if (isCost(e)) fixed += toMonthly(e.amount, e.repeat);
      continue;
    }
    if (age < 0) continue;
    if (e.kind === "in") {
      if (age < 30 * DAY) sales += e.amount;
      else if (age < 60 * DAY) prevSales += e.amount;
      if (age < 28 * DAY) sales28 += e.amount;
    } else if (e.category === "mi_sueldo") {
      if (age < 30 * DAY) paidMe += e.amount;
    } else {
      if (age < 30 * DAY) varCosts += e.amount;
      if (age < 28 * DAY) var28 += e.amount;
    }
  }
  sales += steadyIn;
  const profit = sales - varCosts - fixed;
  const daysOfData = entries.length ? Math.max(1, Math.round((now - first) / DAY)) : 0;
  const weeks = Math.min(4, Math.max(1, daysOfData / 7));
  return {
    sales, varCosts, fixed, profit,
    margin: sales > 0 ? profit / sales : -1,
    prevSales: prevSales + (prevSales > 0 ? steadyIn : 0),
    trend: prevSales > 0 ? (sales - (prevSales + steadyIn)) / (prevSales + steadyIn) : null,
    paidMe,
    weeklySales: sales28 / weeks + steadyIn / WEEKS_PER_MONTH,
    weeklyVar: var28 / weeks,
    daysOfData,
    hasData: entries.some((e) => e.category !== "mi_sueldo"),
  };
}

// ---------- The semáforo ----------
export type Light = "verde" | "amarillo" | "rojo" | "gris";
export type Health = { light: Light; title: string; reasons: string[]; say: string };

const pct = (x: number) => Math.round(x * 100);

export function bizHealth(n: BizNumbers, products: Product[], lang: Lang): Health {
  const L = (es: string, en: string) => (lang === "en" ? en : es);
  if (!n.hasData) {
    const title = L("Anota tus ventas y gastos para ver tu semáforo", "Add your sales and costs to see your traffic light");
    return { light: "gris", title, reasons: [L("Con una semana de datos ya te puedo decir cómo va tu negocio.", "With one week of data I can tell you how your business is doing.")], say: title };
  }
  let light: Light = "verde";
  if (n.profit < 0) light = "rojo";
  else if (n.margin < 0.15 || (n.trend !== null && n.trend < -0.2)) light = "amarillo";

  const reasons: string[] = [];
  if (n.sales > 0) {
    reasons.push(n.profit >= 0
      ? L(`De cada $100 que vendes, te quedan $${pct(n.margin)}.`, `Out of every $100 you sell, you keep $${pct(n.margin)}.`)
      : L(`Gastaste ${money(-n.profit, lang)} más de lo que vendiste.`, `You spent ${money(-n.profit, lang)} more than you sold.`));
  } else {
    reasons.push(L("Este mes no has anotado ventas.", "You haven't added any sales this month."));
  }
  if (n.trend !== null && Math.abs(n.trend) >= 0.05) {
    reasons.push(n.trend > 0
      ? L(`Vendiste ${pct(n.trend)}% más que el mes anterior.`, `You sold ${pct(n.trend)}% more than the month before.`)
      : L(`Vendiste ${pct(-n.trend)}% menos que el mes anterior.`, `You sold ${pct(-n.trend)}% less than the month before.`));
  }
  if (n.fixed > 0 && n.sales > 0) {
    reasons.push(L(`Tus gastos fijos se llevan $${pct(n.fixed / n.sales)} de cada $100.`, `Fixed costs take $${pct(n.fixed / n.sales)} of every $100.`));
  }
  const weak = products.filter((p) => p.price > 0 && (p.price - p.cost) / p.price < 0.2);
  if (weak.length) reasons.push(L(`${weak.map((p) => p.name).join(", ")} te deja${weak.length > 1 ? "n" : ""} muy poca ganancia.`, `${weak.map((p) => p.name).join(", ")} leave${weak.length > 1 ? "" : "s"} very little profit.`));
  if (n.daysOfData < 14) reasons.push(L("Todavía hay pocos días anotados: el semáforo se afina con el tiempo.", "Only a few days so far: the light gets more accurate with time."));

  const title = light === "verde" ? L("Tu negocio va bien", "Your business is doing well")
    : light === "amarillo" ? L("Tu negocio va, pero con cuidado", "Your business is OK, but be careful")
    : L("Tu negocio está en rojo", "Your business is in the red");
  return { light, title, reasons, say: `${title}. ${reasons.join(" ")}` };
}

// ---------- Product costs ----------
export const TARGET_MARGIN = 0.4; // keep 40 cents of every dollar before fixed costs

export function productLight(p: Product): Light {
  if (p.price <= 0) return "gris";
  const m = (p.price - p.cost) / p.price;
  return m >= TARGET_MARGIN ? "verde" : m >= 0.2 ? "amarillo" : "rojo";
}

/** A price that keeps TARGET_MARGIN, rounded up to the next 25 cents. */
export function suggestedPrice(cost: number): number {
  return Math.ceil((cost / (1 - TARGET_MARGIN)) * 4) / 4;
}

export function productsMonthly(products: Product[]) {
  const sales = products.reduce((a, p) => a + p.price * p.perWeek, 0) * WEEKS_PER_MONTH;
  const costs = products.reduce((a, p) => a + p.cost * p.perWeek, 0) * WEEKS_PER_MONTH;
  return { sales, costs, gain: sales - costs };
}

// ---------- Looking ahead ----------
export type Scenario = { more: number; price: number; cut: number }; // fractions, e.g. 0.1 = 10%

export function monthlyProfit(base: { weeklySales: number; weeklyVar: number; fixed: number }, s: Scenario): number {
  const sales = base.weeklySales * (1 + s.more) * (1 + s.price);
  const vars = base.weeklyVar * (1 + s.more) * (1 - s.cut);
  return (sales - vars) * WEEKS_PER_MONTH - base.fixed * (1 - s.cut);
}

// ---------- Suggestions ----------
export type Tip = { id: string; tone: "good" | "warn" | "bad" | "tip"; icon: string; text: string; action?: { href: string; label: string } };

export function bizTips(n: BizNumbers, products: Product[], entries: BizEntry[], goals: { preset: string }[], lang: Lang): Tip[] {
  const L = (es: string, en: string) => (lang === "en" ? en : es);
  const tips: Tip[] = [];
  const lastSale = entries.filter((e) => e.kind === "in").map((e) => new Date(e.date).getTime()).sort((a, b) => b - a)[0];

  if (!n.hasData) {
    tips.push({ id: "start", tone: "tip", icon: "coins", text: L("Empieza anotando lo que vendiste hoy. Puedes decirlo con tu voz.", "Start by adding what you sold today. You can say it out loud."), action: { href: "/negocio/anotar?tipo=venta", label: L("Anotar venta", "Add sale") } });
  }
  if (n.profit < 0 && n.hasData) {
    const top = topCost(entries, lang);
    tips.push({ id: "red", tone: "bad", icon: "shield-alert", text: L(
      `Este mes salió más dinero del que entró.${top ? ` Tu gasto más grande es ${top}: revisa si puedes pagar menos.` : ""}`,
      `More money went out than came in this month.${top ? ` Your biggest cost is ${top}: see if you can pay less.` : ""}`) });
  }
  for (const p of products) {
    if (productLight(p) === "rojo" || productLight(p) === "amarillo") {
      const sp = suggestedPrice(p.cost);
      if (sp > p.price) tips.push({ id: "price-" + p.id, tone: "warn", icon: "coins", text: L(
        `Tu ${p.name} te cuesta ${money(p.cost, lang, true)} y lo vendes a ${money(p.price, lang, true)}. Si lo cobras a ${money(sp, lang, true)}, ganas 40 centavos de cada dólar.`,
        `Your ${p.name} costs ${money(p.cost, lang, true)} and sells for ${money(p.price, lang, true)}. At ${money(sp, lang, true)} you'd keep 40 cents of every dollar.`), action: { href: "/negocio/dinero?tab=costos", label: L("Ver mis costos", "See my costs") } });
    }
  }
  if (n.hasData && n.fixed === 0) {
    tips.push({ id: "fixed", tone: "tip", icon: "key-round", text: L("¿Pagas renta de local, cocina o permisos? Anótalos como gasto fijo para ver tu ganancia real.", "Do you pay rent, a kitchen or permits? Add them as fixed costs to see your real profit."), action: { href: "/negocio/anotar?tipo=gasto", label: L("Anotar gasto fijo", "Add fixed cost") } });
  }
  if (n.fixed > 0 && n.sales > 0 && n.fixed / n.sales > 0.4) {
    tips.push({ id: "heavy", tone: "warn", icon: "key-round", text: L("Tus gastos fijos pesan mucho. Vender un poco más cada semana o compartir el local te ayudaría.", "Fixed costs weigh a lot. Selling a bit more each week or sharing the space would help.") });
  }
  if (n.trend !== null && n.trend < -0.15) {
    tips.push({ id: "down", tone: "warn", icon: "megaphone", text: L("Tus ventas bajaron. Prueba vender en otro lugar, ofrecer un combo o avisar en tus redes y grupos de WhatsApp.", "Sales went down. Try another spot, a combo deal, or posting in your WhatsApp groups.") });
  }
  if (n.trend !== null && n.trend > 0.1 && n.profit > 0) {
    tips.push({ id: "up", tone: "good", icon: "sprout", text: L("¡Vas creciendo! Aparta una parte de la ganancia para tus metas del negocio.", "You're growing! Set part of the profit aside for your business goals."), action: { href: "/negocio/metas", label: L("Mis metas", "My goals") } });
  }
  if (lastSale && Date.now() - lastSale > 4 * DAY) {
    tips.push({ id: "log", tone: "tip", icon: "smartphone", text: L("Hace días no anotas ventas. Anótalas aunque sean pocas: así el semáforo dice la verdad.", "You haven't added sales in a few days. Add them even if small, so the light tells the truth.") });
  }
  if (n.profit > 0 && n.paidMe < n.profit * 0.2) {
    tips.push({ id: "pay", tone: "tip", icon: "hand-coins", text: L(
      `Este mes te quedaron ${money(n.profit, lang)}. Págate un sueldo fijo y deja el resto para el negocio.`,
      `You kept ${money(n.profit, lang)} this month. Pay yourself a set amount and leave the rest in the business.`), action: { href: "/negocio?sueldo=1", label: L("Pagarme", "Pay myself") } });
  }
  if (n.hasData && !goals.some((g) => g.preset === "colchon")) {
    const need = Math.max(500, Math.round((n.varCosts + n.fixed) / 100) * 100);
    tips.push({ id: "cushion", tone: "tip", icon: "shield-check", text: L(
      `Junta un colchón para el negocio: lo de 1 mes de gastos, unos ${money(need, lang)}. Así una semana mala no te tumba.`,
      `Build a business cushion: one month of costs, about ${money(need, lang)}. Then a bad week won't knock you down.`), action: { href: "/negocio/metas?nueva=colchon", label: L("Crear meta", "Create goal") } });
  }
  const m = new Date().getMonth();
  if (m === 9 || m === 10) {
    tips.push({ id: "season", tone: "tip", icon: "gift", text: L("Se acerca diciembre: compra tu mercancía con tiempo y al mayoreo, y avisa a tus clientes de los encargos.", "December is coming: buy stock early and in bulk, and tell customers to order ahead.") });
  }
  tips.push({ id: "separate", tone: "tip", icon: "wallet", text: L("Separa el dinero de tu casa y el de tu negocio, aunque sea en dos sobres.", "Keep home and business money apart, even in two envelopes."), action: { href: "/aprender", label: L("Aprender cómo", "Learn how") } });
  return tips;
}

function topCost(entries: BizEntry[], lang: Lang): string | null {
  const by: Record<string, number> = {};
  const now = Date.now();
  for (const e of entries) {
    if (!isCost(e)) continue;
    const v = e.repeat === "once" ? (now - new Date(e.date).getTime() < 30 * DAY ? e.amount : 0) : toMonthly(e.amount, e.repeat);
    by[e.category] = (by[e.category] ?? 0) + v;
  }
  const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 0 ? (lang === "en" ? bizCategoryById(top[0]).label.en : bizCategoryById(top[0]).label.es).toLowerCase() : null;
}

// ---------- Goals for the business ----------
export type BizGoalPreset = { id: string; label: Label; icon: string; visual: "house" | "jar"; hint: Label; suggested: (n: BizNumbers) => number };

export const BIZ_GOALS: BizGoalPreset[] = [
  { id: "colchon", label: { es: "Colchón del negocio", en: "Business cushion" }, icon: "shield-check", visual: "jar", hint: { es: "1 mes de gastos, para las semanas malas", en: "1 month of costs, for slow weeks" }, suggested: (n) => Math.max(500, Math.round((n.varCosts + n.fixed) / 100) * 100) },
  { id: "equipo", label: { es: "Equipo nuevo", en: "New equipment" }, icon: "hammer", visual: "jar", hint: { es: "Un carrito, una máquina, herramientas", en: "A cart, a machine, tools" }, suggested: () => 1500 },
  { id: "mercancia", label: { es: "Comprar al mayoreo", en: "Buy in bulk" }, icon: "shopping-cart", visual: "jar", hint: { es: "Mercancía para temporada alta, más barata", en: "Stock for the busy season, cheaper" }, suggested: (n) => Math.max(400, Math.round((n.weeklyVar * 3) / 50) * 50) },
  { id: "permisos", label: { es: "Permisos y en regla", en: "Permits and paperwork" }, icon: "file-text", visual: "jar", hint: { es: "Trabajar tranquilo y sin multas", en: "Work calmly, without fines" }, suggested: () => 800 },
  { id: "local", label: { es: "Mi propio local", en: "My own place" }, icon: "store", visual: "house", hint: { es: "Depósito y primeros meses de renta", en: "Deposit and first months of rent" }, suggested: (n) => Math.max(5000, Math.round((n.fixed * 4) / 500) * 500) },
  { id: "carro_negocio", label: { es: "Carro para el negocio", en: "Vehicle for the business" }, icon: "car", visual: "jar", hint: { es: "Para entregar y cargar mercancía", en: "To deliver and carry stock" }, suggested: () => 5000 },
];
export const bizGoalPreset = (id: string): BizGoalPreset =>
  BIZ_GOALS.find((g) => g.id === id) ?? { id: "propia", label: { es: "Mi meta", en: "My goal" }, icon: "star", visual: "jar", hint: { es: "", en: "" }, suggested: () => 1000 };

// ---------- Understanding what someone said or typed ----------
export type ParsedBiz = { kind: "in" | "out" | null; category: string | null; amount: number; repeat: Repeat; note: string };

export function parseBiz(text: string, kindHint?: "in" | "out"): ParsedBiz | null {
  const t = strip(text);
  let kind: "in" | "out" | null = kindHint ?? null;
  if (/\b(vend|venta|cobr|me pag|gane|encargo|pedido|entraron|sold|got paid)/.test(t)) kind = "in";
  else if (/\b(compr|pagu|gast|renta|permiso|licencia|bought|paid|spent)/.test(t)) kind = "out";

  // "vendí 40 tamales a 3 dólares" → 40 × 3
  let amount = 0;
  const each = t.match(/(\d+(?:\.\d+)?)\s+[a-zñ ]{2,30}?\s+(?:a|en|de|at|for)\s+\$?\s?(\d+(?:\.\d{1,2})?)\s*(?:dolares|dls|cada|c\/u|each|\b)/);
  if (each) amount = parseFloat(each[1]) * parseFloat(each[2]);
  if (!amount) amount = numbersIn(text)[0] ?? 0;
  if (!amount) return null;

  // Whole words only ("gasté" must not count as "gas"); plurals are fine.
  const has = (k: string) => new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(s|es)?([^a-z0-9]|$)`).test(t);
  let category: string | null = null, best = 0;
  for (const c of BIZ_CATEGORIES) {
    if (c.hidden || (kind && c.kind !== kind)) continue;
    for (const k of c.keywords) if (k.length > best && has(k)) { best = k.length; category = c.id; }
  }
  if (!kind && category) kind = bizCategoryById(category).kind;
  if (!category && kind) category = kind === "in" ? "ventas" : "otro_out";
  const rep = repeatIn(text);
  const repeat: Repeat = rep && rep !== "once" ? rep : category ? (bizCategoryById(category).fixed ? bizCategoryById(category).repeat : "once") : "once";
  return { kind, category, amount: Math.round(amount * 100) / 100, repeat, note: text.trim().slice(0, 80) };
}
