"use client";

// Пока вкладка открыта — опрашивает /api/streams и шлёт тост, когда кастер, на
// которого включено напоминание, выходит в эфир (переход офлайн→эфир).
import { useEffect, useRef } from "react";
import type { StreamOut } from "@/lib/api";
import { getReminders } from "@/lib/reminders";
import { pushToast } from "@/lib/toast";

export function StreamLiveWatcher({ initial }: { initial: StreamOut[] }) {
  const prevLive = useRef<Record<string, boolean>>(
    Object.fromEntries(initial.map((s) => [s.id, s.live])),
  );

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/streams", { cache: "no-store" });
        const list: StreamOut[] = await r.json();
        if (cancelled || !Array.isArray(list)) return;
        const rem = getReminders();
        for (const s of list) {
          const was = prevLive.current[s.id] ?? false;
          if (s.live && !was && rem.has(s.id)) {
            pushToast({
              kind: "live",
              title: `${s.caster} в эфире!`,
              text: s.title ?? "Трансляция началась — залетай",
              image: s.thumb,
              href: "/live#streams",
            });
          }
          prevLive.current[s.id] = s.live;
        }
      } catch {
        /* сеть моргнула — попробуем в следующий раз */
      }
    };
    const iv = window.setInterval(tick, 45_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  return null;
}
