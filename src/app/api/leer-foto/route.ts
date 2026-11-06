import { guard } from "@/lib/server/guard";
import { ai, currencyLine, hasAI, model, MONEY_SYSTEM, parseModelJson, textOf } from "@/lib/server/ai";

// Photo of a paystub or receipt → numbers only. The image is never stored.
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImgType = (typeof TYPES)[number];

export async function POST(req: Request) {
  const refused = guard(req, "foto");
  if (refused) return refused;
  if (!hasAI()) return Response.json({ error: "ai not configured" }, { status: 501 });
  const { image, mediaType, kind, currency } = ((await req.json().catch(() => ({}))) ?? {}) as { image?: string; mediaType?: string; kind?: "in" | "out"; currency?: string };
  if (typeof image !== "string" || !image || !TYPES.includes(mediaType as ImgType)) return Response.json({ error: "bad image" }, { status: 400 });
  if (image.length > 7_000_000) return Response.json({ error: "too big" }, { status: 413 });
  const k = kind === "in" ? "in" : "out";

  try {
    const msg = await ai().messages.create({
      model: model(),
      max_tokens: 1000,
      system:
        MONEY_SYSTEM +
        `\n${currencyLine(currency)}\nYou are reading a PHOTO. ${
          k === "in"
            ? "It is probably a paystub or pay slip: read GROSS pay (before deductions) with \"taxMode\":\"withheld\", the pay period and hours worked. Ignore names, SSN, RFC, CURP, employer IDs and addresses."
            : "It is probably a receipt or a bill (rent, Con Edison, phone, groceries). Use the TOTAL; for bills, use the amount due. One entry per bill; group a grocery receipt into one entry."
        }`,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType as ImgType, data: image } },
            { type: "text", text: "Read the money information from this photo and return the JSON." },
          ],
        },
      ],
    });
    const parsed = parseModelJson(textOf(msg), "");
    return Response.json(parsed ?? { entries: [], work: null, heard: "" });
  } catch (e) {
    console.error("leer-foto error", e);
    return Response.json({ error: "read failed" }, { status: 502 });
  }
}
