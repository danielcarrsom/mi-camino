"use client";
// Small celebration sounds made in the browser (no files to download).
let ctx: AudioContext | null = null;
function ac() {
  if (typeof window === "undefined") return null;
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  ctx ??= new C();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.18) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

/** A brick being set: a soft "tock" and a bright chime. */
export function playBrick() {
  tone(180, 0, 0.12, "triangle", 0.25);
  tone(784, 0.08, 0.35);
  tone(1047, 0.16, 0.45);
}

/** Goal reached: a short happy melody. */
export function playGoal() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.4));
  tone(1319, 0.55, 0.8, "sine", 0.14);
}

export function playSaved() {
  tone(660, 0, 0.18);
  tone(880, 0.1, 0.3);
}
