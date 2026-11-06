// Accessibility check with axe-core on every screen, on a phone-sized display.
// Fails on any "serious" or "critical" problem (contrast, missing names, etc.).
//
//   BASE_URL=http://localhost:3000 node e2e/a11y.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = await import("playwright").catch(() => require("playwright"));
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const STRICT = ["serious", "critical"];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.route("**/functions/v1/**", (r) => r.fulfill({ status: 500, json: {} }));
const p = await ctx.newPage();

const report = [];
async function audit(name) {
  await p.waitForTimeout(400);
  await p.addScriptTag({ content: AXE });
  const res = await p.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => n.target.join(" ")) , count: v.nodes.length }));
  });
  for (const v of res) report.push({ page: name, ...v });
}

// Public screens
for (const path of ["/", "/entrar", "/recuperar", "/privacidad", "/terminos"]) { await p.goto(BASE + path); await audit(path); }
await p.goto(BASE + "/bienvenida"); await audit("/bienvenida (idioma)");

// Example account: every screen behind sign-in
await p.goto(BASE + "/");
await p.getByText(/Probar con un ejemplo/).click(); await p.waitForURL("**/casita");
await p.getByText(/Saltar recorrido/).click();
for (const path of ["/casita", "/casita/anotar?tipo=gane", "/casita/dinero", "/casita/metas", "/casita/tanda", "/casita/enviar", "/casita/documentos", "/aprender", "/negocio", "/negocio/anotar?tipo=venta", "/negocio/dinero", "/negocio/dinero?tab=costos", "/negocio/dinero?tab=futuro", "/negocio/metas", "/negocio/aprender", "/perfil"]) {
  await p.goto(BASE + path); await audit(path);
}
await browser.close();

const strict = report.filter((r) => STRICT.includes(r.impact));
for (const r of report) console.log(`${STRICT.includes(r.impact) ? "✗" : "·"} [${r.impact}] ${r.page} — ${r.id}: ${r.help} (${r.count}) ${r.nodes.join(" | ")}`);
console.log(strict.length ? `\n${strict.length} serious/critical problem(s)` : `\nNo serious or critical problems (${report.length} minor notes)`);
process.exit(strict.length ? 1 : 0);
