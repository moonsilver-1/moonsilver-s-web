"use client";

type Note = [freq: number, dur: number];

let ctx: AudioContext | null = null;
let muted = false;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSfxMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem("pixel-sfx-muted", value ? "1" : "0");
  }
}

export function isSfxMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("pixel-sfx-muted") === "1";
}

export function initSfxMuted() {
  muted = isSfxMuted();
}

/** Play a short square-wave jingle, 8-bit style. */
export function playNotes(notes: Note[], type: OscillatorType = "square", volume = 0.08) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  let t = ac.currentTime;
  for (const [freq, dur] of notes) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur);
    t += dur;
  }
}

/** Chicken cluck: two quick descending blips. */
export function playCluck() {
  playNotes(
    [
      [740, 0.06],
      [520, 0.09],
    ],
    "square",
    0.06,
  );
}

/** Coin pickup: classic rising arpeggio. */
export function playCoin() {
  playNotes(
    [
      [988, 0.07],
      [1319, 0.16],
    ],
    "square",
    0.07,
  );
}

/** Theme switch swoosh: quick slide. */
export function playSweep() {
  playNotes(
    [
      [330, 0.05],
      [440, 0.05],
      [587, 0.07],
    ],
    "triangle",
    0.05,
  );
}
