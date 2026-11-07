// End-to-end smoke test: the main flows in a real browser, on a phone-sized screen.
// Nothing reaches Supabase: its calls are answered by fakes, so no real accounts are made.
//
//   npm run build && npx next start -p 3100
//   BASE_URL=http://localhost:3100 node e2e/smoke.mjs
//
// Needs Playwright with Chromium (`npx playwright install chromium`), or set
// CHROME_PATH to an installed Chrome.
import { createRequire } from "node:module";

// Works with Playwright installed in the project or globally.
const { chromium } = await import("playwright").catch(() => createRequire(import.meta.url)("playwright"));

const BASE = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? "✓" : "✗"} ${what}`); if (!ok) failed++; };

async function page({ entrar = 403, width = 390, height = 844 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, acceptDownloads: true });
  // Fake Supabase: sign-up fails as if offline; sign-in answers `entrar` (403 = no online account).
  // Playwright uses the route added last first, so the specific one goes last.
  await ctx.route("**/functions/v1/**", (r) => r.fulfill({ status: 500, json: {} }));
  await ctx.route("**/auth/v1/**", (r) => r.fulfill({ status: 400, json: {} }));
  await ctx.route("**/functions/v1/entrar", (r) => r.fulfill({ status: entrar, json: { error: "x" } }));
  const p = await ctx.newPage();
  const problems = [];
  p.on("pageerror", (e) => problems.push(`page error: ${e.message}`));
  p.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) problems.push(`CSP: ${m.text().slice(0, 160)}`); });
  return { ctx, p, problems };
}
const pinpad = async (p, digits) => { for (const d of digits) await p.getByRole("button", { name: d, exact: true }).click(); await p.waitForTimeout(700); };
async function finishTour(p) {
  for (let k = 0; k < 40; k++) {
    const next = p.getByRole("button", { name: /Siguiente|Empezar a usar/ });
    if (!(await next.count())) break;
    await next.click(); await p.waitForTimeout(700);
  }
}

// 1) Demo account: every screen opens without errors
{
  const { ctx, p, problems } = await page();
  await p.goto(BASE + "/");
  check(await p.getByText("Beta", { exact: true }).isVisible(), "welcome shows the Beta badge");
  await p.getByText(/Probar con un ejemplo/).click(); await p.waitForURL("**/casita");
  await p.getByText(/Saltar recorrido/).click();
  for (const path of ["/casita", "/casita/dinero", "/casita/metas", "/casita/tanda", "/casita/enviar", "/casita/documentos", "/aprender", "/negocio", "/negocio/dinero?tab=costos", "/negocio/dinero?tab=futuro", "/negocio/metas", "/negocio/aprender", "/perfil", "/privacidad", "/terminos"]) {
    await p.goto(BASE + path); await p.waitForTimeout(500);
    check((await p.locator("h1").count()) > 0, `demo opens ${path}`);
  }
  // Restarting the tour from the phone menu must close the menu, so the tour can point at things
  await p.goto(BASE + "/casita"); await p.waitForTimeout(400);
  await p.locator('[data-tour="menu"]').click(); await p.waitForTimeout(300);
  await p.getByRole("button", { name: /Ver el recorrido otra vez/ }).click(); await p.waitForTimeout(900);
  const others = await p.locator('[role="dialog"]:not([aria-label="Recorrido guiado"])').count();
  check(others === 0, "restarting the tour from the menu closes the menu");
  // Every step lights up the part it explains, and the card doesn't cover it
  const missed = [];
  for (let k = 1; k <= 40; k++) {
    await p.waitForTimeout(600);
    const step = await p.evaluate(() => {
      const ring = document.querySelector(".ring-sun.pointer-events-none")?.getBoundingClientRect();
      if (!ring) return { ok: true };
      const hit = (a, x, y) => x > a.left && x < a.right && y > a.top && y < a.bottom;
      const lit = [...document.querySelectorAll("[data-tour], main h1")].some((e) => {
        const t = e.getBoundingClientRect();
        return t.width > 0 && hit(ring, t.left + t.width / 2, Math.min(t.top + t.height / 2, t.top + 30));
      });
      const c = document.querySelector('[aria-label="Recorrido guiado"] .shadow-2xl').getBoundingClientRect();
      const covered = !(c.bottom <= ring.top + 8 || c.top >= ring.bottom - 8 || c.right <= ring.left + 8 || c.left >= ring.right - 8);
      return { ok: lit && !covered };
    });
    if (!step.ok) missed.push(k);
    const next = p.getByRole("button", { name: /Siguiente|Empezar a usar/ });
    if (!(await next.count())) break;
    if (/Empezar a usar/.test(await next.textContent())) { await next.click(); break; }
    await next.click();
  }
  check(missed.length === 0, `each tour step lights up what it explains ${missed.join(",")}`);
  check(problems.length === 0, `demo has no page errors or blocked content ${problems.join(" | ")}`);
  await ctx.close();
}

// 2) Sign up in México: consent is required, money shows in pesos, taxes are ISR + IMSS
{
  const { ctx, p, problems } = await page();
  await p.goto(BASE + "/bienvenida");
  await p.getByRole("button", { name: /Siguiente/ }).click();
  await p.locator("input").first().fill("Lupita"); await p.getByRole("button", { name: /Siguiente/ }).click();
  await p.getByRole("button", { name: /Vivo en México/ }).click(); await p.getByRole("button", { name: /Siguiente/ }).click();
  await p.locator('input[inputmode="tel"]').fill("5512345678"); await p.getByRole("button", { name: /Siguiente/ }).click();
  await pinpad(p, "246810"); await pinpad(p, "246810");
  await p.getByText("Hacerlo después").click();
  const start = p.getByRole("button", { name: "Empezar", exact: true });
  check(await start.isDisabled(), "sign-up can't finish before accepting privacy and terms");
  await p.getByRole("checkbox").click();
  check(await start.isEnabled(), "accepting enables the last step");
  await start.click(); await p.waitForTimeout(1200);
  await finishTour(p);
  await p.goto(BASE + "/casita/anotar?tipo=gane"); await p.waitForTimeout(500);
  await p.getByRole("button", { name: /Mi salario/ }).click();
  await p.locator('[role="dialog"] input[inputmode="decimal"]').first().fill("4000");
  await p.getByRole("button", { name: /A dónde se van/ }).click();
  const sheet = await p.locator('[role="dialog"]').innerText();
  check(/ISR/.test(sheet) && /IMSS/.test(sheet), "México salary shows ISR and IMSS");
  await p.keyboard.press("Escape");
  // help for people in México: Mexican agencies, not New York ones
  await p.goto(BASE + "/aprender#ayuda"); await p.waitForTimeout(600);
  const help = await p.locator("main").innerText();
  check(/Condusef/.test(help) && /Profeco/.test(help) && !/NYC|311/.test(help), "México sees Mexican help resources, not New York ones");
  // download my data
  await p.goto(BASE + "/perfil"); await p.waitForTimeout(500);
  const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: /Descargar mis datos/ }).click()]);
  check(/mi-camino-.*\.json$/.test(dl.suggestedFilename()), "profile downloads the person's data");
  // delete account (no online account: entrar answers 403)
  await p.getByRole("button", { name: /Borrar mi cuenta/ }).click();
  await p.getByRole("button", { name: /Sí, quiero borrarla/ }).click();
  await pinpad(p, "246810");
  await p.waitForURL((u) => new URL(u).pathname === "/", { timeout: 5000 }).catch(() => {});
  const accounts = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("mi-camino-v1") || "{}").state?.accounts ?? {}));
  check(!accounts.includes("525512345678"), "deleting the account removes it from the device");
  check(problems.length === 0, `México flow has no page errors ${problems.join(" | ")}`);
  await ctx.close();
}

// 3) Too many wrong PINs: the person is told to wait
{
  const { ctx, p } = await page({ entrar: 429 });
  await p.goto(BASE + "/entrar");
  await p.locator('input[inputmode="tel"]').fill("9175550123");
  await p.getByRole("button", { name: /Siguiente/ }).click();
  await pinpad(p, "111111"); await p.waitForTimeout(800);
  check(/espera 15 minutos/.test(await p.locator("main").innerText()), "locked sign-in explains the 15-minute wait");
  await ctx.close();
}

// 4) Paid routes refuse calls that don't come from our pages
{
  const r = await fetch(BASE + "/api/entender", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://evil.example" }, body: JSON.stringify({ text: "vendí 10", kind: "in" }) });
  check(r.status === 403, "AI route refuses other websites");
  const h = (await fetch(BASE + "/")).headers;
  check(/frame-ancestors 'none'/.test(h.get("content-security-policy") ?? ""), "security headers are sent");
}

await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
