import { hasVoice } from "@/lib/server/ai";

// Voice → text with ElevenLabs speech-to-text. Audio is not stored.
export async function POST(req: Request) {
  if (!hasVoice()) return Response.json({ error: "voice not configured" }, { status: 501 });
  const form = await req.formData();
  const audio = form.get("audio");
  const locale = String(form.get("locale") || "es-MX");
  if (!(audio instanceof Blob) || audio.size === 0) return Response.json({ text: "" });
  if (audio.size > 15 * 1024 * 1024) return Response.json({ error: "too long" }, { status: 413 });

  const fd = new FormData();
  fd.append("file", audio, "voz.webm");
  fd.append("model_id", process.env.ELEVENLABS_STT_MODEL || "scribe_v1");
  fd.append("language_code", locale.startsWith("en") ? "eng" : "spa");
  fd.append("tag_audio_events", "false");

  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
    body: fd,
  });
  if (!r.ok) return Response.json({ error: "stt failed" }, { status: 502 });
  const j = (await r.json()) as { text?: string };
  return Response.json({ text: j.text ?? "" });
}
