"use client";
// Voice: hear every screen and answer by talking.
// Uses ElevenLabs through our server when the key is set (better, natural
// voices); otherwise falls back to the browser's built-in voice so the
// platform always works.
import { useCallback, useEffect, useRef, useState } from "react";
import { langInfo, AUDIO_READY, type Lang } from "./i18n";

type Status = { voice: boolean; ai: boolean };
let statusPromise: Promise<Status> | null = null;
export function getStatus(): Promise<Status> {
  if (!statusPromise) {
    statusPromise = fetch("/api/estado")
      .then((r) => r.json())
      .catch(() => ({ voice: false, ai: false }));
  }
  return statusPromise;
}

// ---------- speaking ----------

let currentAudio: HTMLAudioElement | null = null;
let speakToken = 0;
const listeners = new Set<(speaking: boolean) => void>();
function emit(v: boolean) { listeners.forEach((l) => l(v)); }

export function stopSpeaking() {
  speakToken++;
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  emit(false);
}

const ttsCache = new Map<string, string>();

export async function speak(text: string, lang: Lang, audioKey?: string) {
  stopSpeaking();
  const token = ++speakToken;
  emit(true);
  const done = () => { if (token === speakToken) emit(false); };

  // 1) Native-speaker recording for indigenous languages, when we have it
  if (audioKey && AUDIO_READY[lang]?.includes(audioKey)) {
    const a = new Audio(`/audio/${lang}/${audioKey}.mp3`);
    currentAudio = a;
    a.onended = done; a.onerror = done;
    await a.play().catch(done);
    return;
  }

  const locale = langInfo(lang).speechLocale;

  // 2) ElevenLabs via our server
  const status = await getStatus();
  if (token !== speakToken) return;
  if (status.voice) {
    try {
      const cacheKey = `${locale}|${text}`;
      let url = ttsCache.get(cacheKey);
      if (!url) {
        const r = await fetch("/api/voz/hablar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, locale }),
        });
        if (!r.ok) throw new Error("tts");
        url = URL.createObjectURL(await r.blob());
        ttsCache.set(cacheKey, url);
      }
      if (token !== speakToken) return;
      const a = new Audio(url);
      currentAudio = a;
      a.onended = done; a.onerror = done;
      await a.play();
      return;
    } catch {
      /* fall through to the browser voice */
    }
  }

  // 3) Browser voice
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = 0.92;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((x) => x.lang === locale) ?? voices.find((x) => x.lang.startsWith(locale.slice(0, 2)));
    if (v) u.voice = v;
    u.onend = done; u.onerror = done;
    window.speechSynthesis.speak(u);
  } else done();
}

export function useSpeaking(): boolean {
  const [s, setS] = useState(false);
  useEffect(() => { listeners.add(setS); return () => { listeners.delete(setS); }; }, []);
  return s;
}

// ---------- listening ----------

type SR = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null;
  start: () => void; stop: () => void;
};

function browserRecognizer(): SR | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return C ? new C() : null;
}

export type ListenState = "idle" | "listening" | "thinking" | "error";

/**
 * Tap once to start, tap again to finish. Returns what the person said.
 * ElevenLabs speech-to-text when available (records audio), else the
 * browser's recognizer.
 */
export function useListen(lang: Lang) {
  const [state, setState] = useState<ListenState>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const srRef = useRef<SR | null>(null);
  const resolver = useRef<((t: string) => void) | null>(null);

  const finish = useCallback((t: string) => {
    setText(t);
    setState("idle");
    resolver.current?.(t);
    resolver.current = null;
  }, []);

  const start = useCallback(async (): Promise<string> => {
    stopSpeaking();
    setError(null);
    setText("");
    const status = await getStatus();
    const locale = langInfo(lang).speechLocale;
    return new Promise<string>(async (resolve) => {
      resolver.current = resolve;
      if (status.voice && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const rec = new MediaRecorder(stream);
          chunks.current = [];
          rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
          rec.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            setState("thinking");
            try {
              const fd = new FormData();
              fd.append("audio", new Blob(chunks.current, { type: rec.mimeType || "audio/webm" }), "voz.webm");
              fd.append("locale", locale);
              const r = await fetch("/api/voz/escuchar", { method: "POST", body: fd });
              const j = await r.json();
              finish((j.text ?? "").trim());
            } catch {
              setError("stt"); setState("error"); finish("");
            }
          };
          recRef.current = rec;
          rec.start();
          setState("listening");
          return;
        } catch {
          /* mic blocked or recorder failed: try browser recognizer */
        }
      }
      const sr = browserRecognizer();
      if (!sr) { setError("unsupported"); setState("error"); finish(""); return; }
      sr.lang = locale;
      sr.interimResults = true;
      sr.continuous = true;
      let latest = "";
      sr.onresult = (e) => {
        let all = "";
        for (let i = 0; i < e.results.length; i++) all += e.results[i][0].transcript + " ";
        latest = all.trim();
        setText(latest);
      };
      sr.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") setError(e.error); };
      sr.onend = () => { srRef.current = null; finish(latest); };
      srRef.current = sr;
      sr.start();
      setState("listening");
    });
  }, [lang, finish]);

  const stop = useCallback(() => {
    if (recRef.current && recRef.current.state === "recording") { recRef.current.stop(); recRef.current = null; return; }
    srRef.current?.stop(); // onend delivers the text
  }, []);

  return { state, text, error, start, stop };
}
