// The example account ("Probar con un ejemplo"): María, a cook in New York City
// who sells tamales on weekends. It never goes online.
import type { Lang } from "./i18n";
import { uid } from "./money";
import { LEGAL } from "./legal";
import { periodKey } from "./model";
import type { BizEntry } from "./business";
import type { Repeat } from "./catalog";
import type { Business, UserData } from "./types";

export const DEMO_PHONE = "0000000000";
export const DEMO_PIN = "123456";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function demoData(lang: Lang): UserData {
  const now = new Date().toISOString();
  const casaId = uid();
  return {
    profile: { name: "María", lang, casita: true, negocio: true, createdAt: now, country: "us", usState: "NY", nyc: true, avatar: "ajolote", termsAccepted: LEGAL.version },
    work: [
      { id: uid(), name: "Restaurante", pay: 864, every: "week", hoursPerWeek: 48, daysPerWeek: 6, source: "foto", createdAt: now, tax: { mode: "withheld" } },
    ],
    entries: [
      { id: uid(), kind: "in", category: "mi_negocio", amount: 200, repeat: "once", note: "Tamales María", date: daysAgo(0), source: "manual" },
      { id: uid(), kind: "out", category: "renta", amount: 1100, repeat: "month", note: "Cuarto en Corona", date: daysAgo(20), source: "voz" },
      { id: uid(), kind: "out", category: "luz", amount: 45, repeat: "month", note: "", date: daysAgo(12), source: "foto" },
      { id: uid(), kind: "out", category: "telefono", amount: 40, repeat: "month", note: "", date: daysAgo(10), source: "texto" },
      { id: uid(), kind: "out", category: "metro", amount: 34, repeat: "week", note: "", date: daysAgo(6), source: "voz" },
      { id: uid(), kind: "out", category: "super", amount: 90, repeat: "week", note: "", date: daysAgo(4), source: "foto" },
      { id: uid(), kind: "out", category: "envio", amount: 300, repeat: "month", note: "A mi mamá en Puebla", date: daysAgo(3), source: "voz" },
      { id: uid(), kind: "out", category: "comida_fuera", amount: 18, repeat: "once", note: "", date: daysAgo(1), source: "texto" },
      { id: uid(), kind: "in", category: "propinas", amount: 60, repeat: "once", note: "", date: daysAgo(1), source: "voz" },
    ],
    goals: [
      {
        id: casaId, preset: "casa_mexico", name: "Mi casita en Puebla", target: 12000, createdAt: daysAgo(90),
        deposits: [
          { id: uid(), amount: 1500, date: daysAgo(80) },
          { id: uid(), amount: 1200, date: daysAgo(50) },
          { id: uid(), amount: 1300, date: daysAgo(20) },
          { id: uid(), amount: 800, date: daysAgo(9) },
          { id: uid(), amount: 120, date: daysAgo(1), auto: true },
        ],
        plan: { amount: 120, every: "week", lastApplied: daysAgo(1) },
      },
      {
        id: uid(), preset: "emergencias", name: "Dinero para emergencias", target: 1500, createdAt: daysAgo(40),
        deposits: [
          { id: uid(), amount: 300, date: daysAgo(30) },
          { id: uid(), amount: 250, date: daysAgo(12) },
        ],
      },
    ],
    tandas: [
      {
        id: uid(), name: "Tanda de las compañeras", amount: 100, every: "week", people: 10,
        names: ["Lupe", "Rosa", "Carmen", "Juana", "Elena", "", "Paty", "Sofía", "Inés", "Marta"],
        myTurn: 6, start: daysAgo(21), paid: [0, 1, 2], received: false, goalId: casaId, createdAt: daysAgo(25),
      },
    ],
    business: demoBusiness(),
  };
}

/** María sells tamales on weekends: about 8 weeks of history, a little better each month. */
export function demoBusiness(): Business {
  const entries: BizEntry[] = [];
  const add = (kind: "in" | "out", category: string, amount: number, ago: number, note = "", repeat: Repeat = "once") =>
    entries.push({ id: uid(), kind, category, amount, repeat, note, date: daysAgo(ago), source: "voz" });
  for (let ago = 1; ago <= 58; ago++) {
    const d = new Date(); d.setDate(d.getDate() - ago);
    const dow = d.getDay();
    const lift = ago < 30 ? 1.12 : 1; // this month went better
    if (dow === 6 || dow === 0) add("in", "ventas", Math.round((dow === 0 ? 330 : 270) * lift + ((ago * 37) % 40)), ago, "Tamales y champurrado");
    if (dow === 5) add("out", "mercancia", Math.round(165 * lift + ((ago * 13) % 20)), ago, "Masa, carne y hojas");
    if (dow === 3 && ago % 2 === 1) add("in", "pedidos", 90 + ((ago * 7) % 50), ago, "Encargo para fiesta");
    if (dow === 5 && ago % 14 < 7) add("out", "empaque", 28, ago, "Vasos y bolsas");
  }
  add("out", "local", 300, 25, "Cocina compartida", "month");
  add("out", "permisos", 30, 25, "Permiso de comida", "month");
  add("out", "servicios", 45, 20, "Gas", "month");
  add("out", "mi_sueldo", 200, 8);
  add("out", "mi_sueldo", 200, 0);
  const since = daysAgo(8);
  return {
    name: "Tamales María", type: "comida", createdAt: daysAgo(60), entries,
    pay: { amount: 200, every: "week", since, paid: [periodKey({ repeat: "week", date: since })] },
    stock: [
      { id: uid(), name: "Masa", unit: "kilos", have: 12, perWeek: 20, cost: 1.8, updatedAt: daysAgo(1) },
      { id: uid(), name: "Hojas de maíz", unit: "paquetes", have: 6, perWeek: 3, cost: 4.5, updatedAt: daysAgo(1) },
      { id: uid(), name: "Vasos para champurrado", unit: "piezas", have: 40, perWeek: 50, cost: 0.15, updatedAt: daysAgo(1) },
    ],
    products: [
      { id: uid(), name: "Tamal", cost: 1.1, price: 3, perWeek: 140, createdAt: daysAgo(40) },
      { id: uid(), name: "Champurrado", cost: 0.6, price: 2.5, perWeek: 50, createdAt: daysAgo(40) },
      { id: uid(), name: "Torta de tamal", cost: 3.9, price: 4.5, perWeek: 20, createdAt: daysAgo(20) },
    ],
    goals: [
      {
        id: uid(), preset: "equipo", name: "Carrito para vender", target: 2500, createdAt: daysAgo(45),
        deposits: [{ id: uid(), amount: 400, date: daysAgo(40) }, { id: uid(), amount: 300, date: daysAgo(20) }, { id: uid(), amount: 50, date: daysAgo(2), auto: true }],
        plan: { amount: 50, every: "week", lastApplied: daysAgo(2) },
      },
    ],
  };
}
