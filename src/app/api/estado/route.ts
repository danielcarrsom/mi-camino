import { connection } from "next/server";
import { hasAI, hasVoice } from "@/lib/server/ai";

// Tells the browser which services are connected (never the keys themselves).
// Checked on every request so newly added keys take effect without a rebuild.
export async function GET() {
  await connection();
  return Response.json({ voice: hasVoice(), ai: hasAI() });
}
