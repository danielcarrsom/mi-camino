import { guard } from "@/lib/server/guard";
import { hasVoice } from "@/lib/server/ai";

// Text → natural voice with ElevenLabs. The key stays on the server.
// Everyone hears the same voice: "Sarah" (soft and calm) speaking through the
// multilingual model, slightly slower and steadier for older listeners.
// To change it for everyone, set ELEVENLABS_VOICE_ID in Vercel.
export async function POST(req: Request) {
  const refused = guard(req, "hablar");
  if (refused) return refused;
  if (!hasVoice()) return new Response("voice not configured", { status: 501 });
  const { text, locale } = ((await req.json().catch(() => ({}))) ?? {}) as { text?: string; locale?: string };
  if (typeof text !== "string" || !text || text.length > 1200) return new Response("bad text", { status: 400 });

  const voiceId =
    (locale?.startsWith("en") ? process.env.ELEVENLABS_VOICE_ID_EN : undefined) ||
    process.env.ELEVENLABS_VOICE_ID ||
    "EXAVITQu4vr4xnSDxMaL";
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
      voice_settings: { stability: 0.7, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 0.9 },
    }),
  });
  if (!r.ok || !r.body) return new Response("tts failed", { status: 502 });
  return new Response(r.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" } });
}
