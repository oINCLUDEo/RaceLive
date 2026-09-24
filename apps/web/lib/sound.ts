"use client";

// Короткие звуковые сигналы уведомлений — синтез через WebAudio (без аудиофайлов).
// Браузер разрешает звук только после взаимодействия со страницей, поэтому контекст
// «разблокируем» на первом клике. Выключается пользователем (запоминаем в localStorage).
import type { ToastKind } from "@/lib/toast";

const KEY = "racelive:sound";
let ctx: AudioContext | null = null;

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* приватный режим */
  }
}

export function unlockAudio() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    /* без звука */
  }
}

function tone(freq: number, start: number, dur: number, gain: number, type: OscillatorType = "triangle") {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

// live — «стартовые огни»: три коротких сигнала и высокий финальный;
// reminder — мягкий двухтональный «динь-дон»; info — одиночный тихий тон.
export function playChime(kind: ToastKind) {
  if (!soundEnabled()) return;
  unlockAudio();
  if (!ctx || ctx.state !== "running") return;
  const t = ctx.currentTime + 0.02;
  if (kind === "live") {
    [0, 0.16, 0.32].forEach((d) => tone(660, t + d, 0.1, 0.05, "square"));
    tone(1320, t + 0.52, 0.32, 0.06, "triangle");
  } else if (kind === "reminder") {
    tone(988, t, 0.22, 0.06);
    tone(740, t + 0.18, 0.34, 0.06);
  } else {
    tone(880, t, 0.18, 0.04);
  }
}
