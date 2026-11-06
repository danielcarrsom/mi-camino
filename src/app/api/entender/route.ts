import { guard } from "@/lib/server/guard";
import { ai, currencyLine, hasAI, model, MONEY_SYSTEM, parseModelJson, textOf } from "@/lib/server/ai";
import { understandLocally } from "@/lib/understand";

// What someone said or typed → money entries. Tolerates spelling mistakes.
export async function POST(req: Request) {
  const refused = guard(req, "entender");
  if (refused) return refused;
  const { text, kind, currency } = ((await req.json().catch(() => ({}))) ?? {}) as { text?: string; kind?: "in" | "out"; currency?: string };
  if (typeof text !== "undefined" && typeof text !== "string") return Response.json({ error: "bad text" }, { status: 400 });
  const k = kind === "in" ? "in" : "out";
  if (!text?.trim()) return Response.json({ entries: [], work: null, heard: "" });
  const clean = text.slice(0, 1000);

  if (hasAI()) {
    try {
      const msg = await ai().messages.create({
        model: model(),
        max_tokens: 800,
        system: MONEY_SYSTEM,
        messages: [
          {
            role: "user",
            content: `${currencyLine(currency)}\nThe person is recording money they ${k === "in" ? "EARNED or RECEIVED" : "SPENT"}.\nWhat they said: """${clean}"""`,
          },
        ],
      });
      const parsed = parseModelJson(textOf(msg), clean);
      if (parsed && (parsed.entries.length || parsed.work)) return Response.json({ ...parsed, by: "ai" });
    } catch (e) {
      console.error("entender ai error", e);
    }
  }
  return Response.json({ ...understandLocally(clean, k), by: "local" });
}
