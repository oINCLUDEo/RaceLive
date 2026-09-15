"use client";

// Переключатель скорости реплея. Пишет общую скорость через /api/live/speed
// (прокси к бэкенду), реплей-цикл подхватывает её на лету.
import { useEffect, useState } from "react";

const fmt = (v: number) => (Number.isInteger(v) ? `${v}×` : `${v}×`);

export function ReplaySpeed() {
  const [speed, setSpeed] = useState<number | null>(null);
  const [opts, setOpts] = useState<number[]>([0.5, 1, 2, 5, 15, 60]);

  useEffect(() => {
    let alive = true;
    fetch("/api/live/speed")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (typeof d.speed === "number") setSpeed(d.speed);
        if (Array.isArray(d.options) && d.options.length) setOpts(d.options);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const set = async (v: number) => {
    setSpeed(v); // оптимистично
    try {
      const r = await fetch("/api/live/speed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ speed: v }),
      });
      const d = await r.json();
      if (typeof d.speed === "number") setSpeed(d.speed);
    } catch {
      /* оставим оптимистичное значение */
    }
  };

  const seekStart = async () => {
    try {
      await fetch("/api/live/seek-start", { method: "POST" });
    } catch {
      /* noop */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={seekStart}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-bone transition-colors hover:bg-surface-2"
        title="Перемотать к старту гонки (пропустить прогрев)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 5h2v14H6zM20 5l-11 7 11 7z" />
        </svg>
        К старту
      </button>
      <span className="mx-1 h-4 w-px bg-line" aria-hidden />
      <span className="mr-0.5 text-[11px] uppercase tracking-wide text-mute">Скорость</span>
      {opts.map((o) => {
        const active = speed === o;
        return (
          <button
            key={o}
            onClick={() => set(o)}
            className="tabular rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
            style={
              active
                ? { borderColor: "var(--accent2-soft)", background: "var(--accent2-soft)", color: "var(--accent2)" }
                : { borderColor: "var(--line)", color: "var(--mute)" }
            }
          >
            {fmt(o)}
          </button>
        );
      })}
    </div>
  );
}
