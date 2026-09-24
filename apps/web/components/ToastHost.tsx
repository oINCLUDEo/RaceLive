"use client";

// Уведомления: карточки по центру сверху (под шапкой) — картинка/иконка, заголовок,
// кнопка «Смотреть», полоса времени до исчезновения, пружинная анимация и короткий
// звуковой сигнал (можно выключить прямо в уведомлении).
import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { playChime, setSoundEnabled, soundEnabled, unlockAudio } from "@/lib/sound";
import { dismissToast, subscribeToasts, type Toast } from "@/lib/toast";

const ACCENT: Record<Toast["kind"], string> = {
  live: "var(--ember)",
  reminder: "var(--accent2)",
  info: "var(--bone)",
};

function KindIcon({ kind }: { kind: Toast["kind"] }) {
  const c = ACCENT[kind];
  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${c} 22%, transparent)` }}>
      {kind === "live" && <span className="absolute inset-0 animate-ping rounded-2xl opacity-25" style={{ background: c }} aria-hidden />}
      {kind === "live" ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={c} aria-hidden>
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      ) : kind === "reminder" ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 004 0" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.5" />
        </svg>
      )}
    </span>
  );
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const [muted, setMuted] = useState(false);
  const seen = useRef<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
    setMuted(!soundEnabled());
    // звук в браузере разрешён только после первого взаимодействия со страницей
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    const off = subscribeToasts((list) => {
      for (const t of list) {
        if (!seen.current.has(t.id)) {
          seen.current.add(t.id);
          if (t.sound ?? t.kind !== "info") playChime(t.kind);
        }
      }
      setToasts(list);
    });
    return () => {
      off();
      window.removeEventListener("pointerdown", unlockAudio);
    };
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  const toggleSound = () => {
    const next = muted;
    setSoundEnabled(next);
    setMuted(!next);
  };

  return createPortal(
    <div className="pointer-events-none fixed left-1/2 top-[84px] z-[60] flex w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const c = ACCENT[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-auto relative overflow-hidden rounded-2xl border shadow-[0_28px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              style={{
                borderColor: `color-mix(in srgb, ${c} 30%, var(--line))`,
                background: `linear-gradient(120deg, color-mix(in srgb, ${c} 16%, rgba(20,15,18,0.92)), rgba(20,15,18,0.92) 55%)`,
              }}
              role="status"
            >
              <div className="flex items-center gap-3.5 p-3.5 pr-3">
                {t.image ? (
                  <span className="relative h-12 w-[72px] shrink-0 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.image} alt="" className="h-full w-full object-cover" />
                    {t.kind === "live" && (
                      <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase text-white" style={{ background: "var(--ember)" }}>
                        <span className="h-1 w-1 rounded-full bg-white" /> live
                      </span>
                    )}
                  </span>
                ) : (
                  <KindIcon kind={t.kind} />
                )}
                <div className="min-w-0 flex-1">
                  {t.title && <div className="truncate font-display text-[15px] font-semibold">{t.title}</div>}
                  <div className="line-clamp-2 text-sm leading-snug text-mute">{t.text}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={toggleSound}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-mute hover:text-bone"
                      title={muted ? "Включить звук уведомлений" : "Выключить звук уведомлений"}
                      aria-label={muted ? "Включить звук" : "Выключить звук"}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M11 5L6 9H3v6h3l5 4z" />
                        {muted ? <path d="M22 9l-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />}
                      </svg>
                    </button>
                    <button onClick={() => dismissToast(t.id)} className="flex h-6 w-6 items-center justify-center rounded-full text-mute hover:text-bone" aria-label="Закрыть">
                      ✕
                    </button>
                  </div>
                  {t.href && (
                    <a
                      href={t.href}
                      onClick={() => dismissToast(t.id)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ background: c === "var(--bone)" ? "var(--surface-2)" : c }}
                    >
                      Смотреть
                    </a>
                  )}
                </div>
              </div>
              {/* полоса времени до исчезновения */}
              <span
                className="toast-timer absolute bottom-0 left-0 h-[2px] w-full origin-left"
                style={{ background: c, "--ttl": `${t.ttl}ms` } as CSSProperties}
                aria-hidden
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
