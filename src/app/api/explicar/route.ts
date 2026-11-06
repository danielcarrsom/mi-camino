import { guard } from "@/lib/server/guard";
import { ai, hasAI, model, textOf } from "@/lib/server/ai";

// Photo(s) or a PDF of a letter, bill or contract → a plain-language
// explanation with a scam check. Nothing is stored.
export const maxDuration = 60;

const IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type Img = (typeof IMG)[number];
type Part = { type: "image" | "pdf"; data: string; mediaType?: string };

const SCAMS_US = `Common ones: someone asking for payment in gift cards, Zelle, wire transfer or crypto; fake IRS/ICE/USCIS/police letters or threats of arrest or deportation; "notarios" offering immigration help (in the US a notario is NOT a lawyer); prizes or lotteries; urgent deadlines with pressure; fake bank or utility notices asking for your PIN or password; job offers that ask you to pay first; QR codes or links from unknown senders.`;
const SCAMS_MX = `Common ones in Mexico: phone extortion ("your relative is detained, deposit now"); fake SAT, CFE, IMSS or court notices asking for payment by link, WhatsApp, OXXO deposit or into a personal account; fake loans or "apoyos del Bienestar" that ask for an upfront fee; loan apps that demand access to contacts and harass them; messages asking for your NIP, token or SMS code; prizes or lotteries; urgent deadlines with pressure; job offers that ask you to pay first.`;
const HELP_US = `"help": pick which helpers fit: consulado (Mexican Consulate: documents, protection, any doubt), 311 (local city services: landlord problems, consumer fraud, free legal help), banco (anything about a bank account or card), abogado (court, immigration, contracts, big debts), remitente (call the sender using a number from their official website).`;
const HELP_MX = `"help": pick which helpers fit: condusef (banks, loans, cards, insurance, financial fraud), profeco (stores, services, rentals, purchases), sat (anything that says it comes from the SAT or about taxes), banco (anything about a bank account or card), abogado (lawsuits, contracts, big debts), remitente (call the sender using a number from their official website).`;

const SYSTEM = (lang: "es" | "en", mx: boolean) => `You explain documents to Latino ${mx ? "families in Mexico" : "immigrants in the United States"}, many with little schooling, some who cannot read.
Write in ${lang === "en" ? "plain English" : "español sencillo de México"}: short sentences, everyday words, no legal or financial jargon. Talk directly to the person ("tú").

Never repeat Social Security numbers, ITIN, A-numbers, CURP, RFC, passport numbers, bank account or card numbers: if you mention one, write only the last 4 digits.
You are not a lawyer. Do not give legal advice${mx ? "" : " on immigration status"} or on court cases: explain what the paper says and send them to a professional.

Check for scams. ${mx ? SCAMS_MX : SCAMS_US} Mark "scam" only when there are clear signs; "caution" when something is unclear, very costly, legally binding (a lease, a contract, a debt, a court paper) or time-sensitive.

Return ONLY JSON:
{"title": "what this paper is, in 3-8 words",
 "from": "who sent it, or empty",
 "summary": "2 or 3 short sentences: what it says and what it means for the person",
 "keyPoints": [{"label": "short label like ¿Cuánto? / ¿Para cuándo? / ¿Quién?", "value": "short value"}],
 "whatToDo": ["1 to 4 short steps"],
 "risk": "ok" | "caution" | "scam",
 "riskReasons": ["short reasons, empty if ok"],
 "help": [${mx ? '"condusef" | "profeco" | "sat"' : '"consulado" | "311"'} | "banco" | "abogado" | "remitente"],
 "money": null | {"amount": number, "due": "date as written or empty", "what": "short description"}}
${mx ? HELP_MX : HELP_US}
"money": only if the paper asks the person to pay a specific amount.
If you can't read the document, say so in "summary", set risk to "caution" and suggest taking a clearer photo.`;

export async function POST(req: Request) {
  const refused = await guard(req, "explicar");
  if (refused) return refused;
  if (!hasAI()) return Response.json({ error: "ai not configured" }, { status: 501 });
  let body: { parts?: Part[]; lang?: string; country?: string };
  try { body = await req.json(); } catch { return Response.json({ error: "bad json" }, { status: 400 }); }
  const parts = (body.parts ?? []).slice(0, 5);
  if (!parts.length) return Response.json({ error: "empty" }, { status: 400 });
  const size = parts.reduce((a, p) => a + (p.data?.length ?? 0), 0);
  if (size > 5_500_000) return Response.json({ error: "too big" }, { status: 413 });
  const lang = body.lang === "en" ? "en" : "es";
  const mx = body.country === "mx";

  const content: Array<
    | { type: "image"; source: { type: "base64"; media_type: Img; data: string } }
    | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
    | { type: "text"; text: string }
  > = [];
  for (const p of parts) {
    if (p.type === "pdf") content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: p.data } });
    else if (IMG.includes(p.mediaType as Img)) content.push({ type: "image", source: { type: "base64", media_type: p.mediaType as Img, data: p.data } });
  }
  if (!content.length) return Response.json({ error: "bad files" }, { status: 400 });
  content.push({ type: "text", text: parts.length > 1 ? "These are the pages of one paper. Explain it and return the JSON." : "Explain this paper and return the JSON." });

  try {
    const msg = await ai().messages.create({ model: model(), max_tokens: 1500, system: SYSTEM(lang, mx), messages: [{ role: "user", content }] });
    const raw = textOf(msg);
    const j = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    const HELP = mx ? ["condusef", "profeco", "sat", "banco", "abogado", "remitente"] : ["consulado", "311", "banco", "abogado", "remitente"];
    const out = {
      title: String(j.title ?? "").slice(0, 120),
      from: String(j.from ?? "").slice(0, 120),
      summary: String(j.summary ?? "").slice(0, 900),
      keyPoints: (Array.isArray(j.keyPoints) ? j.keyPoints : []).slice(0, 6).map((k: { label?: string; value?: string }) => ({ label: String(k.label ?? "").slice(0, 40), value: String(k.value ?? "").slice(0, 160) })),
      whatToDo: (Array.isArray(j.whatToDo) ? j.whatToDo : []).slice(0, 5).map((s: unknown) => String(s).slice(0, 220)),
      risk: ["ok", "caution", "scam"].includes(j.risk) ? j.risk : "caution",
      riskReasons: (Array.isArray(j.riskReasons) ? j.riskReasons : []).slice(0, 5).map((s: unknown) => String(s).slice(0, 220)),
      help: (Array.isArray(j.help) ? j.help : []).filter((h: string) => HELP.includes(h)),
      money: j.money && Number(j.money.amount) > 0 ? { amount: Number(j.money.amount), due: String(j.money.due ?? "").slice(0, 60), what: String(j.money.what ?? "").slice(0, 80) } : null,
    };
    return Response.json(out);
  } catch (e) {
    console.error("explicar error", e);
    return Response.json({ error: "read failed" }, { status: 502 });
  }
}
