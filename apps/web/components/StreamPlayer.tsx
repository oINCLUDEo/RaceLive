"use client";

// «Ленивый» плеер: до клика — обложка + кнопка play (iframe не грузится, экономим
// трафик и загрузку). По клику подставляем официальный iframe площадки (VK/Rutube).
// Видео не наше (ADR-007) — только встраиваем чужой плеер.
import { useState } from "react";

function withAutoplay(src: string): string {
  // Пользователь нажал play — просим автозапуск (площадка проигнорирует, если не поддержит).
  return src + (src.includes("?") ? "&" : "?") + "autoplay=1";
}

export function StreamPlayer({
  src,
  title,
  poster,
  live,
}: {
  src: string;
  title: string;
  poster?: string | null;
  live?: boolean;
}) {
  const [play, setPlay] = useState(false);

  return (
    <div
      className="relative w-full overflow-hidden rounded-[var(--r-card)] border border-line bg-black shadow-[var(--soft)]"
      style={{ aspectRatio: "16 / 9" }}
    >
      {play ? (
        <iframe
          src={withAutoplay(src)}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlay(true)}
          className="group absolute inset-0 flex items-center justify-center"
          aria-label={`Смотреть: ${title}`}
        >
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-65 transition-opacity duration-200 group-hover:opacity-85"
            />
          )}
          <span
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(13,7,9,0.15), rgba(13,7,9,0.55))" }}
          />
          {live && (
            <span
              className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "#fff", background: "var(--ember)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> В эфире
            </span>
          )}
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-line-strong bg-black/50 backdrop-blur-sm transition-transform duration-200 group-hover:scale-105">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
