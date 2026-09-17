"use client";

// Кастомный тултип с «хвостиком» вместо нативного title. Пузырёк рисуется в body
// через портал (fixed-позиция), поэтому не обрезается родителями с overflow:hidden
// (строки таблиц, карточки). Появляется при наведении и фокусе.
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Pos = { x: number; y: number };

export function Tip({
  text,
  children,
  className,
  style,
  as: As = "span",
}: {
  text: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "span" | "div";
}) {
  const [pos, setPos] = useState<Pos | null>(null);
  const ref = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2, 14), window.innerWidth - 14);
    setPos({ x, y: r.top });
  }, []);
  const hide = useCallback(() => setPos(null), []);

  return (
    <As
      // @ts-expect-error — ref типизируется под конкретный тег на рантайме
      ref={ref}
      className={className}
      style={style}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {pos &&
        typeof document !== "undefined" &&
        createPortal(
          <span className="tip-bubble" style={{ left: pos.x, top: pos.y }} role="tooltip">
            {text}
          </span>,
          document.body,
        )}
    </As>
  );
}
