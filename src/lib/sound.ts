"use client";

/**
 * Все звуки синтезируются Web Audio API — никаких аудиофайлов.
 * «Щёлк» кости о кость — короткий отфильтрованный шум, громкость
 * зависит от силы удара.
 */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function ac() {
  if (!enabled || typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBurst(duration: number, freq: number, q: number, gain: number) {
  const c = ac();
  if (!c) return;
  const len = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(c.destination);
  src.start();
}

function tone(freq: number, duration: number, gain: number, type: OscillatorType = "sine", delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export const sfx = {
  /** Разблокировать звук на iOS — вызвать из обработчика касания. */
  unlock() {
    ac();
  },
  click(strength: number) {
    const s = Math.min(1, strength);
    noiseBurst(0.05 + s * 0.04, 2200 + s * 1400, 3, 0.25 + s * 0.9);
  },
  stone(strength: number) {
    noiseBurst(0.08, 900, 2, 0.3 + Math.min(1, strength) * 0.6);
  },
  whoosh(power: number) {
    noiseBurst(0.18 + power * 0.1, 600 + power * 500, 0.8, 0.12 + power * 0.2);
  },
  knock(combo: number) {
    const base = 520 + combo * 90;
    tone(base, 0.18, 0.18, "triangle");
    tone(base * 1.5, 0.22, 0.12, "triangle", 0.07);
  },
  penalty() {
    tone(220, 0.25, 0.15, "sawtooth");
    tone(160, 0.3, 0.12, "sawtooth", 0.1);
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 0.16, "triangle", i * 0.11));
  },
  lose() {
    [392, 330, 262].forEach((f, i) => tone(f, 0.3, 0.12, "sine", i * 0.14));
  },
};

export function vibrate(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}
