"use client";

// Напоминание о старте, пока сайт открыт. Показываем уведомление ПРЯМО В ОКНЕ сайта
// (тост) — без запроса разрешений браузера. За 10 минут до старта и в момент старта.
// Если разрешение на системные уведомления уже выдано — продублируем и в ОС (бонус,
// сами не просим). Работает, пока вкладка открыта.
import { useEffect, useRef, useState } from "react";

const KEY = "racelive:notify";

export function NotifyBell({ iso, label, compact }: { iso: string | null; label: string; compact?: boolean }) {
  const [on, setOn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fired = useRef<{ soon?: boolean; start?: boolean }>({});
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      setOn(localStorage.getItem(KEY) === "1");
    } catch {
      /* приватный режим */
    }
  }, []);

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 9000);
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
          {Bell}
        </button>
      ) : on ? (
        <button
          onClick={disable}
          className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium"
          style={onStyle}
        >
          {Bell} Напоминание включено
        </button>
      ) : (
        <button
          onClick={enable}
          className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-xs font-medium text-bone transition-colors hover:bg-surface-2"
        >
          {Bell} Напомнить о старте
        </button>
      )}

      {toast && (
        <div className="card-soft fixed bottom-5 left-5 z-40 flex max-w-[320px] items-start gap-2.5 px-4 py-3 text-sm shadow-[var(--soft)]">
          <span className="mt-0.5 shrink-0" style={{ color: "var(--ember)" }}>{Bell}</span>
          <span className="leading-snug">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-1 shrink-0 text-mute hover:text-bone" aria-label="Закрыть">
            ✕
          </button>
        </div>
      )}
    </>
  );
}
