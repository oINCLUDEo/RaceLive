"use client";

// Напоминание о старте, пока сайт открыт. Показываем уведомление ПРЯМО В ОКНЕ сайта
// (тост) — без запроса разрешений браузера. За 10 минут до старта и в момент старта.
// Если разрешение на системные уведомления уже выдано — продублируем и в ОС (бонус,
// сами не просим). Работает, пока вкладка открыта.
import { useEffect, useRef, useState } from "react";
import { pushToast } from "@/lib/toast";

const KEY = "racelive:notify";

export function NotifyBell({ iso, label, compact }: { iso: string | null; label: string; compact?: boolean }) {
  const [on, setOn] = useState(false);
  const [ringing, setRinging] = useState(false);
  const fired = useRef<{ soon?: boolean; start?: boolean }>({});

  useEffect(() => {
    try {
      setOn(localStorage.getItem(KEY) === "1");
    } catch {
      /* приватный режим */
    }
  }, []);

  const showToast = (text: string) => {
    // в общий стек тостов (slide+fade, копится несколько)
    pushToast(text);
    // бонус: если разрешение на системные уведомления уже есть — продублируем в ОС
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("race.live", { body: text, icon: "/icon.svg" });
      }
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    if (!on || !iso) return;
    const start = new Date(iso).getTime();
    if (Number.isNaN(start)) return;

    const tick = () => {
      const ms = start - Date.now();
      if (ms <= 0 && ms > -3 * 3600_000 && !fired.current.start) {
        fired.current.start = true;
        showToast(`${label} — старт!`);
      } else if (ms > 0 && ms <= 10 * 60_000 && !fired.current.soon) {
        fired.current.soon = true;
        showToast(`Скоро старт: ${label} — через ${Math.ceil(ms / 60_000)} мин`);
      }
    };
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, [on, iso, label]);

  if (!iso) return null;

  const Bell = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 004 0" />
    </svg>
  );

  const enable = () => {
    setOn(true);
    setRinging(true);
    setTimeout(() => setRinging(false), 900);
    fired.current = {};
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* noop */
    }
    showToast(`Напомним о старте: ${label}`);
  };

  const disable = () => {
    setOn(false);
    try {
      localStorage.setItem(KEY, "0");
    } catch {
      /* noop */
    }
  };

  const BellWrap = <span className={ringing ? "bell-ring" : ""}>{Bell}</span>;
  const onStyle = { borderColor: "var(--accent2-soft)", background: "var(--accent2-soft)", color: "var(--accent2)" };

  return (
    <>
      {compact ? (
        <button
          onClick={on ? disable : enable}
          title={on ? "Напоминание включено — нажмите, чтобы выключить" : "Напомнить о старте"}
          aria-label={on ? "Напоминание включено" : "Напомнить о старте"}
          className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border transition-colors"
          style={on ? onStyle : { borderColor: "var(--line)", color: "var(--bone)" }}
        >
          {BellWrap}
        </button>
      ) : on ? (
        <button
          onClick={disable}
          className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium"
          style={onStyle}
        >
          {BellWrap} Напоминание включено
        </button>
      ) : (
        <button
          onClick={enable}
          className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-xs font-medium text-bone transition-colors hover:bg-surface-2"
        >
          {BellWrap} Напомнить о старте
        </button>
      )}
    </>
  );
}
