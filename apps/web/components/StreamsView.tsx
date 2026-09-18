"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { StreamPlayer } from "@/components/StreamPlayer";
import type { StreamOut } from "@/lib/api";

const platformLabel = (p: string) => (p === "vk" ? "VK Видео" : p === "rutube" ? "Rutube" : p);

function LiveBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: "var(--ember)", background: "var(--ember-soft)" }}
    >
      <span className="live-dot" aria-hidden /> В эфире
    </span>
  );
}

export function StreamsView({ streams }: { streams: StreamOut[] }) {
  const [sel, setSel] = useState<string>(() => streams.find((s) => s.live)?.id ?? streams[0]?.id ?? "");
  const current = streams.find((s) => s.id === sel) ?? streams[0];
  if (!current) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* ПЛЕЕР */}
      <div className="flex min-w-0 flex-col gap-3">
        {current.embed_url ? (
          <StreamPlayer src={current.embed_url} title={current.title ?? current.caster} />
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-[var(--r-card)] border border-line bg-surface-1 text-center text-mute"
            style={{ aspectRatio: "16 / 9" }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--disabled)" }} aria-hidden />
            <span className="text-sm">Кастер сейчас не в эфире</span>
            {current.channel_url && (
              <a href={current.channel_url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-bone underline underline-offset-2">
                Открыть канал
              </a>
            )}
          </div>
        )}
        {current.title && <div className="truncate text-sm text-mute">{current.title}</div>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            {current.live && <LiveBadge />}
            <PlatformIcon platform={current.platform} size={26} />
            <span className="truncate font-display text-lg font-semibold">{current.caster}</span>
            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide text-mute">
              {platformLabel(current.platform)}
            </span>
          </div>
          {current.channel_url && (
            <a
              href={current.channel_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="pressable inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs text-bone hover:bg-surface-2"
            >
              Канал
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </a>
          )}
        </div>
        {current.note && <p className="text-xs text-mute">{current.note}</p>}
      </div>

      {/* СПИСОК КАСТЕРОВ */}
      <div className="flex flex-col gap-2">
        <div className="px-1 text-xs uppercase tracking-wide text-mute">Кастеры</div>
        {streams.map((s) => {
          const on = s.id === current.id;
          return (
            <button
              key={s.id}
              onClick={() => setSel(s.id)}
              className={`pressable flex items-center gap-3 rounded-[var(--r-card)] border px-4 py-3 text-left ${on ? "border-line-strong bg-surface-2" : "border-line bg-surface-1 hover:bg-surface-2"}`}
            >
              <PlatformIcon platform={s.platform} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{s.caster}</span>
                <span className="text-[11px] text-mute">{platformLabel(s.platform)}</span>
              </span>
              {s.live ? (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--ember)" }}>
                  live
                </span>
              ) : (
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-mute">офлайн</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
