"use client";

// Общее подключение к Centrifugo для «комнат» стримов (реакции + счётчик зрителей).
// Одно на вкладку; тайминг держит своё подключение отдельно (LiveTiming).
import type { Centrifuge } from "centrifuge";

let inst: Promise<Centrifuge | null> | null = null;

export function getCentrifuge(): Promise<Centrifuge | null> {
  const url = process.env.NEXT_PUBLIC_CENTRIFUGO_URL;
  if (!url || typeof window === "undefined") return Promise.resolve(null);
  if (!inst) {
    inst = import("centrifuge")
      .then(({ Centrifuge }) => {
        const c = new Centrifuge(url);
        c.connect();
        return c;
      })
      .catch(() => null);
  }
  return inst;
}
