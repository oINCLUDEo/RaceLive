"use client";

// Кадры тайминга из Centrifugo (timing:live) с задержкой «под стрим»: трансляции на
// Rutube/VK отстают от реальных данных на десятки секунд, поэтому кадры копим в буфере
// (с временем получения) и показываем тот, что пришёл delaySec назад — обгон в таблице
// совпадает с обгоном на экране. delaySec = 0 → показываем сразу.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Frame } from "@/components/LiveTiming";
import { getCentrifuge } from "@/lib/realtimeClient";

const BUFFER_MS = 3 * 60_000;

export function useTimingFeed(delaySec: number) {
  const [frame, setFrame] = useState<Frame | null>(null);
  const [changes, setChanges] = useState<Record<string, "up" | "down">>({});
  const prevOrder = useRef<string[]>([]);
  const prevPos = useRef<Record<string, number>>({});
  const buf = useRef<{ t: number; f: Frame }[]>([]);
  const shown = useRef<Frame | null>(null);
  const delay = useRef(delaySec);
  const alive = useRef(true);
  delay.current = delaySec;

  const apply = useCallback((data: Frame) => {
    if (shown.current === data) return;
    shown.current = data;
    // кто с кем разменялся позициями — стрелка держится ~6 c
    const np: Record<string, number> = {};
    const nc: Record<string, "up" | "down"> = {};
    for (const r of data.rows) {
      np[r.code] = r.pos;
      const prev = prevPos.current[r.code];
      if (prev != null && prev !== r.pos) nc[r.code] = r.pos < prev ? "up" : "down";
    }
    prevPos.current = np;
    if (Object.keys(nc).length) {
      setChanges((c) => ({ ...c, ...nc }));
      for (const code of Object.keys(nc)) {
        window.setTimeout(() => {
          if (alive.current)
            setChanges((c) => {
              const n = { ...c };
              delete n[code];
              return n;
            });
        }, 6000);
      }
    }
    setFrame(data);
  }, []);

  useEffect(() => {
    alive.current = true;
    let sub: Awaited<ReturnType<typeof subscribe>> = null;
    async function subscribe() {
      const c = await getCentrifuge();
      if (!c || !alive.current) return null;
      const s = c.getSubscription("timing:live") ?? c.newSubscription("timing:live");
      s.on("publication", (ctx) => {
        const d = ctx.data as Frame;
        if (!d?.rows) return;
        const now = Date.now();
        buf.current.push({ t: now, f: d });
        while (buf.current.length && buf.current[0].t < now - BUFFER_MS) buf.current.shift();
        if (delay.current <= 0) apply(d);
      });
      s.subscribe();
      return s;
    }
    void subscribe().then((s) => (sub = s));

    // при задержке раз в полсекунды берём кадр «из прошлого»
    const iv = window.setInterval(() => {
      if (delay.current <= 0) return;
      const target = Date.now() - delay.current * 1000;
      let pick: Frame | null = null;
      for (const x of buf.current) {
        if (x.t <= target) pick = x.f;
        else break;
      }
      if (pick) apply(pick);
    }, 500);

    return () => {
      alive.current = false;
      clearInterval(iv);
      if (sub) {
        const s = sub;
        s.removeAllListeners();
        s.unsubscribe();
        void getCentrifuge().then((c) => c?.removeSubscription(s));
      }
    };
  }, [apply]);

  // задержку убрали — сразу показываем самый свежий кадр
  useEffect(() => {
    const lastF = buf.current[buf.current.length - 1];
    if (delaySec <= 0 && lastF) apply(lastF.f);
  }, [delaySec, apply]);

  return { frame, changes, prevOrder, buffered: buf };
}
