// Mi Negocio: categories, the business "semáforo", product costs, the
// look-ahead calculator and plain-language suggestions. All of it works
// offline, without AI.
import { pick, type Label } from "./catalog";
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

/** Something you keep in stock: ingredients, materials or products. */
export type StockItem = {
  id: string;
  name: string;
  unit: string;         // piezas, kilos, paquetes…
  have: number;         // how many you have now
  perWeek: number;      // how many you use or sell in a normal week
  cost: number;         // what one unit costs you
  updatedAt: string;
};

/** Your salary from the business: how much and how often. */
export type MyPay = { amount: number; every: "week" | "2weeks" | "month"; since: string; paid: string[] };

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

/** "What if" in plain dollars: sell $X more a week, charge $Y more per piece, spend $Z less a week. */
export type DollarScenario = { moreWeekly: number; pricePerPiece: number; cutWeekly: number };

export function monthlyProfitDollars(base: { weeklySales: number; weeklyVar: number; fixed: number }, unitsPerWeek: number, s: DollarScenario): number {
  const costShare = base.weeklySales > 0 ? base.weeklyVar / base.weeklySales : 0; // selling more also costs more to make
  const sales = base.weeklySales + s.moreWeekly + s.pricePerPiece * unitsPerWeek;
  const vars = base.weeklyVar + s.moreWeekly * costShare;
  const weeklyCosts = vars + base.fixed / WEEKS_PER_MONTH;
  const cut = Math.min(s.cutWeekly, weeklyCosts);
  return (sales - weeklyCosts + cut) * WEEKS_PER_MONTH;
}

// ---------- Suggestions ----------
export type Tip = { id: string; tone: "good" | "warn" | "bad" | "tip"; icon: string; text: string; action?: { href: string; label: string } };

const INDUSTRY_TIPS: Record<string, Label> = {
  comida: { es: "Anota lo que se te echa a perder cada semana: si tiras mucho, prepara un poco menos o véndelo en combo antes de que se pase.", en: "Write down what spoils each week: if you throw out a lot, make a bit less or sell it as a combo before it goes bad." },
  tienda: { es: "Revisa qué productos no se vendieron en un mes y no los vuelvas a surtir; mete más de los que se acaban rápido.", en: "Check which products didn't sell in a month and don't restock them; buy more of the ones that sell out." },
  ropa: { es: "Pide la mitad por adelantado en arreglos y pedidos: así no pones tu dinero en material que no te pagan.", en: "Ask for half upfront on alterations and orders, so you don't pay for material nobody picks up." },
  belleza: { es: "Confirma tus citas por WhatsApp un día antes: menos citas perdidas, más dinero.", en: "Confirm appointments by WhatsApp the day before: fewer no-shows, more money." },
  limpieza: { es: "Ofrece un precio fijo por mes a los clientes que se repiten: te da un ingreso seguro.", en: "Offer a fixed monthly price to repeat clients: it gives you steady income." },
  construccion: { es: "Pide anticipo para materiales antes de empezar cada trabajo y deja todo por escrito.", en: "Ask for a deposit for materials before each job and put everything in writing." },
  catalogo: { es: "Lleva una lista de quién te debe y desde cuándo: cobra cada semana el mismo día.", en: "Keep a list of who owes you and since when: collect the same day each week." },
  transporte: { es: "Calcula cuánto gastas de gasolina por viaje y súmalo a tu precio.", en: "Work out the gas per trip and add it to your price." },
};

export function bizTips(n: BizNumbers, products: Product[], entries: BizEntry[], goals: { preset: string }[], lang: Lang, extra: { type?: string; stock?: StockItem[]; hasPay?: boolean } = {}): Tip[] {
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
  // Stock running out
  for (const i of extra.stock ?? []) {
    const d = i.perWeek > 0 ? (i.have / i.perWeek) * 7 : Infinity;
    if (d < 3) tips.push({ id: "stock-" + i.id, tone: "bad", icon: "package", text: L(
      `Se te acaba ${i.name} ${d < 1 ? "hoy" : `en ${Math.floor(d)} días`}. Cómpralo antes para no dejar de vender.`,
      `You're running out of ${i.name} ${d < 1 ? "today" : `in ${Math.floor(d)} days`}. Buy more so you don't stop selling.`), action: { href: "/negocio/dinero?tab=costos", label: L("Ver mi inventario", "See my inventory") } });
  }
  for (const p of products) {
    if (productLight(p) === "rojo" || productLight(p) === "amarillo") {
      const sp = suggestedPrice(p.cost);
      if (sp > p.price) tips.push({ id: "price-" + p.id, tone: "warn", icon: "coins", text: L(
        `Tu ${p.name} te cuesta ${money(p.cost, lang, true)} y lo vendes a ${money(p.price, lang, true)}. Si lo cobras a ${money(sp, lang, true)}, ganas 40 centavos de cada dólar.`,
        `Your ${p.name} costs ${money(p.cost, lang, true)} and sells for ${money(p.price, lang, true)}. At ${money(sp, lang, true)} you'd keep 40 cents of every dollar.`), action: { href: "/negocio/dinero?tab=costos", label: L("Ver mis costos", "See my costs") } });
    }
  }
  // What earns the most
  const best = [...products].filter((p) => p.price > p.cost && p.perWeek > 0).sort((a, b) => (b.price - b.cost) * b.perWeek - (a.price - a.cost) * a.perWeek)[0];
  if (best && products.length > 1) {
    tips.push({ id: "best", tone: "good", icon: "star", text: L(
      `Tu ${best.name} es lo que más te deja: unos ${money((best.price - best.cost) * best.perWeek, lang)} a la semana. Ofrécelo primero o en combo con lo que menos se vende.`,
      `Your ${best.name} earns you the most: about ${money((best.price - best.cost) * best.perWeek, lang)} a week. Offer it first or in a combo with slower items.`) });
  }
  // Best days of the week
  const DAYS = lang === "en" ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] : ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const recentSales = entries.filter((e) => e.kind === "in" && e.repeat === "once" && Date.now() - new Date(e.date).getTime() < 56 * DAY);
  if (recentSales.length >= 6) {
    const byDay = Array(7).fill(0) as number[];
    for (const e of recentSales) byDay[new Date(e.date).getDay()] += e.amount;
    const tot = byDay.reduce((a, b) => a + b, 0);
    const top = byDay.map((v, d) => ({ v, d })).sort((a, b) => b.v - a.v).slice(0, 2).filter((x) => x.v > 0);
    if (tot > 0 && top.reduce((a, x) => a + x.v, 0) / tot >= 0.45) {
      const names = top.map((x) => DAYS[x.d]).join(L(" y ", " and "));
      tips.push({ id: "days", tone: "tip", icon: "calendar-days", text: L(
        `Tus mejores días son ${names}: ahí vendes ${Math.round((top.reduce((a, x) => a + x.v, 0) / tot) * 100)} de cada 100 dólares. Prepara más esos días y descansa o surte los días flojos.`,
        `Your best days are ${names}: ${Math.round((top.reduce((a, x) => a + x.v, 0) / tot) * 100)} of every 100 dollars come then. Prepare more on those days and restock on slow ones.`) });
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
  if (n.profit > 0 && n.paidMe < n.profit * 0.2 && !extra.hasPay) {
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
  if (extra.type && INDUSTRY_TIPS[extra.type]) tips.push({ id: "industry", tone: "tip", icon: "lightbulb", text: pick(INDUSTRY_TIPS[extra.type], lang) });
  const m = new Date().getMonth();
  if (m === 9 || m === 10) {
    tips.push({ id: "season", tone: "tip", icon: "gift", text: L("Se acerca diciembre: compra tu mercancía con tiempo y al mayoreo, y avisa a tus clientes de los encargos.", "December is coming: buy stock early and in bulk, and tell customers to order ahead.") });
  }
  tips.push({ id: "separate", tone: "tip", icon: "wallet", text: L("Separa el dinero de tu casa y el de tu negocio, aunque sea en dos sobres.", "Keep home and business money apart, even in two envelopes."), action: { href: "/negocio/aprender", label: L("Aprender cómo", "Learn how") } });
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
export type BizGoalPreset = { id: string; label: Label; icon: string; visual: "house" | "jar"; hint: Label; suggested: (n: BizNumbers, type?: string) => number; why?: (type?: string) => Label };

// Rough costs by type of business, to start the conversation (the person can change them).
const EQUIPO: Record<string, [number, string, string]> = {
  comida: [2500, "un carrito, una estufa o una vaporera grande", "a cart, a stove or a big steamer"],
  tienda: [2000, "un refrigerador o anaqueles", "a fridge or shelves"],
  ropa: [1200, "una máquina de coser buena", "a good sewing machine"],
  belleza: [1500, "un sillón y una secadora profesional", "a chair and a professional dryer"],
  limpieza: [800, "una aspiradora y equipo de limpieza", "a vacuum and cleaning gear"],
  construccion: [2000, "herramienta eléctrica", "power tools"],
  catalogo: [300, "muestras y catálogos", "samples and catalogs"],
  transporte: [1500, "mantenimiento y llantas", "maintenance and tires"],
  otro: [1500, "lo que más usas para trabajar", "what you use most to work"],
};
const PERMISOS: Record<string, number> = { comida: 1200, construccion: 1000, transporte: 800, belleza: 700 };
const round50 = (x: number) => Math.round(x / 50) * 50;

export const BIZ_GOALS: BizGoalPreset[] = [
  { id: "colchon", label: { es: "Colchón del negocio", en: "Business cushion" }, icon: "shield-check", visual: "jar", hint: { es: "1 mes de gastos, para las semanas malas", en: "1 month of costs, for slow weeks" },
    suggested: (n) => Math.max(500, round50(n.varCosts + n.fixed)),
    why: () => ({ es: "Es lo que tu negocio gasta en un mes: así una semana mala no te tumba.", en: "It's what your business spends in a month, so a bad week won't knock you down." }) },
  { id: "equipo", label: { es: "Equipo nuevo", en: "New equipment" }, icon: "hammer", visual: "jar", hint: { es: "Un carrito, una máquina, herramientas", en: "A cart, a machine, tools" },
    suggested: (_n, t) => (EQUIPO[t ?? "otro"] ?? EQUIPO.otro)[0],
    why: (t) => { const e = EQUIPO[t ?? "otro"] ?? EQUIPO.otro; return { es: `Es lo que cuesta más o menos ${e[1]}.`, en: `About what ${e[2]} costs.` }; } },
  { id: "mercancia", label: { es: "Comprar al mayoreo", en: "Buy in bulk" }, icon: "shopping-cart", visual: "jar", hint: { es: "Mercancía para temporada alta, más barata", en: "Stock for the busy season, cheaper" },
    suggested: (n) => Math.max(400, round50(n.weeklyVar * 3)),
    why: () => ({ es: "Son unas 3 semanas de lo que compras: para surtirte antes de la temporada alta.", en: "About 3 weeks of what you buy, to stock up before the busy season." }) },
  { id: "permisos", label: { es: "Permisos y en regla", en: "Permits and paperwork" }, icon: "file-text", visual: "jar", hint: { es: "Trabajar tranquilo y sin multas", en: "Work calmly, without fines" },
    suggested: (_n, t) => PERMISOS[t ?? ""] ?? 500,
    why: () => ({ es: "Una cantidad para empezar; pregunta el costo exacto en los centros gratis de la ciudad.", en: "A starting amount; ask the exact cost at the city's free centers." }) },
  { id: "local", label: { es: "Mi propio local", en: "My own place" }, icon: "store", visual: "house", hint: { es: "Depósito y primeros meses de renta", en: "Deposit and first months of rent" },
    suggested: (n) => Math.max(5000, round50(Math.max(n.fixed, 1200) * 4)),
    why: () => ({ es: "Depósito y unos 3 meses de renta, para abrir sin apuros.", en: "Deposit and about 3 months of rent, to open without stress." }) },
  { id: "carro_negocio", label: { es: "Carro para el negocio", en: "Vehicle for the business" }, icon: "car", visual: "jar", hint: { es: "Para entregar y cargar mercancía", en: "To deliver and carry stock" },
    suggested: (_n, t) => (t === "transporte" ? 8000 : 5000),
    why: () => ({ es: "Un carro usado en buen estado, para empezar.", en: "A good used vehicle, to start." }) },
];

/** How much a week the business can set aside: part of what's left after costs, your salary and other goals. */
export function bizFreeWeekly(n: BizNumbers, plansMonthly: number): number {
  return (n.profit - n.paidMe - plansMonthly) / WEEKS_PER_MONTH;
}
export function recommendBizSaving(freeWeekly: number, missing: number): number | null {
  if (freeWeekly <= 0 || missing <= 0) return null;
  return Math.min(Math.ceil(missing), Math.max(5, Math.floor((freeWeekly * 0.4) / 5) * 5));
}
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
