"use client";

// Напоминание о старте сессии, пока сайт открыт: браузерное уведомление за 10 минут
// до старта и в момент старта. Без серверной части — работает во вкладке.
// (Пуш при закрытом сайте — отдельная фича, потребует Web Push/VAPID.)
import { useEffect, useRef, useState } from "react";

type Perm = "default" | "granted" | "denied" | "unsupported";

function notify(title: string, body: string) {
  try {
    new Notification(title, { body, icon: "/icon.svg" });
  } catch {
    /* Safari/итд иногда требует SW — тихо игнорируем */
  }
}

export function NotifyBell({ iso, label }: { iso: string | null; label: string }) {
  const [perm, setPerm] = useState<Perm>("default");
  const [on, setOn] = useState(false);
  const [hint, setHint] = useState(false);
  const fired = useRef<{ soon?: boolean; start?: boolean }>({});

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission as Perm);
    try {
      setOn(localStorage.getItem("racelive:notify") === "1");
    } catch {
      /* приватный режим */
    }
  }, []);

  useEffect(() => {
    if (!on || perm !== "granted" || !iso) return;
    const start = new Date(iso).getTime();
    if (Number.isNaN(start)) return;

    const tick = () => {
      const ms = start - Date.now();
      if (ms <= 0 && ms > -3 * 3600_000 && !fired.current.start) {
        fired.current.start = true;
        notify("race.live — старт!", `${label} начинается`);
      } else if (ms > 0 && ms <= 10 * 60_000 && !fired.current.soon) {
        fired.current.soon = true;
        notify("race.live — скоро старт", `${label} через ${Math.ceil(ms / 60_000)} мин`);
      }
    };
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, [on, perm, iso, label]);

  if (perm === "unsupported" || !iso) return null;

  const enable = async () => {
    let p = Notification.permission as Perm;
    if (p === "default") p = (await Notification.requestPermission()) as Perm;
    setPerm(p);
    if (p === "granted") {
      fired.current = {};
      setOn(true);
      setHint(false);
      try {
        localStorage.setItem("racelive:notify", "1");
      } catch {
        /* noop */
      }
      notify("race.live", `Напомним о старте: ${label}`);
    } else {
      setHint(true); // отклонено — мягкая подсказка, без пугающего чипа
    }
  };

  const disable = () => {
    setOn(false);
    try {
      localStorage.setItem("racelive:notify", "0");
    } catch {
      /* noop */
    }
  };

  const Bell = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 004 0" />
    </svg>
  );

  if (on && perm === "granted") {
    return (
      <button
        onClick={disable}
        className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium"
        style={{ borderColor: "var(--accent2-soft)", background: "var(--accent2-soft)", color: "var(--accent2)" }}
      >
        {Bell} Напоминание включено
      </button>
    );
  }

  // Кнопка всегда кликабельна; при отказе — тихая подсказка, а не постоянный «заблокировано».
  const denied = perm === "denied" || hint;
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        onClick={enable}
        className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-xs font-medium text-bone transition-colors hover:bg-surface-2"
      >
        {Bell} Напомнить о старте
      </button>
      {denied && (
        <span className="text-[11px] text-mute">Разрешите уведомления для сайта в настройках браузера</span>
      )}
    </span>
  );
}
