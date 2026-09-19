"use client";

// Реакции у стрима (тест): клик по эмодзи пускает всплывающую реакцию вверх.
// Локально, без бэкенда — задел под комьюнити-реакции (полноценно — Фаза 5).
import { useState } from "react";

const EMO = ["🔥", "❤️", "👏", "🏎️", "😮"];

export function Reactions() {
  const [items, setItems] = useState<{ id: number; e: string; x: number }[]>([]);

  const add = (e: string) => {
    const id = Date.now() + Math.random();
    const x = Math.round(Math.random() * 60 - 30);
    setItems((v) => [...v, { id, e, x }]);
    window.setTimeout(() => setItems((v) => v.filter((i) => i.id !== id)), 1500);
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <span className="text-xs text-mute">Реакции</span>
      {EMO.map((e) => (
        <button
          key={e}
          onClick={() => add(e)}
          className="pressable rounded-full border border-line bg-surface-1 px-2.5 py-1 text-sm leading-none hover:bg-surface-2"
          aria-label={`Реакция ${e}`}
        >
          {e}
        </button>
      ))}
      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide text-mute">тест</span>
      <div className="pointer-events-none absolute bottom-full left-0 h-24 w-full overflow-visible">
        {items.map((i) => (
          <span key={i.id} className="react-float absolute bottom-0 text-xl" style={{ left: `calc(28px + ${i.x}px)` }}>
            {i.e}
          </span>
        ))}
      </div>
    </div>
  );
}
