"use client";

// Стек тостов справа-сверху со slide+fade анимацией входа/выхода (framer-motion).
// Монтируется один раз в layout; источник — глобальный стек lib/toast.
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { dismissToast, subscribeToasts, type Toast } from "@/lib/toast";

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return subscribeToasts(setToasts);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-[76px] z-[60] flex w-[300px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 44, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 44, scale: 0.96 }}
            transition={{ duration: 0.26, ease: [0.2, 0, 0, 1] }}
            className="card-soft pointer-events-auto flex items-start gap-2.5 px-4 py-3 text-sm shadow-[var(--soft)]"
          >
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--ember)" }} aria-hidden />
            <span className="leading-snug">{t.text}</span>
            <button
              onClick={() => dismissToast(t.id)}
              className="ml-1 shrink-0 text-mute hover:text-bone"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
