// Small Web Audio chimes (replaces Tone.js from the prototype).

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq: number, at: number, dur: number, gainDb: number) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const peak = Math.pow(10, gainDb / 20);
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Focus: session finished — two notes (C5, G5)
export function chimeSession() {
  tone(523.25, 0, 0.6, -8);
  tone(783.99, 0.18, 0.6, -8);
}

// Habits: habit checked — single E5
export function chimeHabit() {
  tone(659.25, 0, 0.5, -10);
}

// Tasks: task done — short quiet A5
export function chimeTodo() {
  tone(880, 0, 0.25, -14);
}
