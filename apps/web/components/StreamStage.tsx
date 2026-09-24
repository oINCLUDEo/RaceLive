"use client";

// Компактный стрим-блок для раскладки «бок о бок» на «Эфире»: ленивый плеер,
// подпись (эфир/запись), напоминание об эфире, реакции и чипы кастеров.
import { useState } from "react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Reactions } from "@/components/Reactions";
import { StreamLiveWatcher } from "@/components/StreamLiveWatcher";
import { StreamPlayer } from "@/components/StreamPlayer";
import type { StreamOut } from "@/lib/api";
import { useReminder } from "@/lib/reminders";

const platformLabel = (p: string) => (p === "vk" ? "VK Видео" : p === "rutube" ? "Rutube" : p);
const compact = (n: number) => new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(n);

function StatusChip({ live, hasRec }: { live: boolean; hasRec: boolean }) {
  if (live)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--ember)", background: "var(--ember-soft)" }}>
        <span className="live-dot" aria-hidden /> В эфире
      </span>
    );
  if (hasRec)
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-mute" style={{ background: "var(--surface-2)" }} title="Кастер не в эфире — показана последняя запись">
        Запись
      </span>
    );
  return null;
}

function ReminderBell({ id, live }: { id: string; live: boolean }) {
  const [on, toggle] = useReminder(id);
  if (live) return null; // уже в эфире — напоминать не о чем
  return (
    <button
      onClick={toggle}
      title={on ? "Напоминание включено — нажмите, чтобы выключить" : "Напомнить, когда кастер выйдет в эфир"}
      className="pressable inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
      style={on ? { borderColor: "var(--accent2-soft)", background: "var(--accent2-soft)", color: "var(--accent2)" } : { borderColor: "var(--line)", color: "var(--bone)" }}
    >
      <span className={on ? "bell-ring" : ""}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 004 0" />
        </svg>
      </span>
      {on ? "Напомним" : "Напомнить"}
    </button>
  );
}

export function StreamStage({ streams }: { streams: StreamOut[] }) {
  const [sel, setSel] = useState<string>(
    () =>
      streams.find((s) => s.live)?.id ??
      streams.find((s) => s.embed_url)?.id ??
      streams[0]?.id ??
      "",
  );
  const current = streams.find((s) => s.id === sel) ?? streams[0];
  if (!current) return null;

  const liveCount = streams.filter((s) => s.live).length;
  const anyRec = streams.some((s) => s.embed_url);

  return (
    <div className="flex flex-col gap-3">
      <StreamLiveWatcher initial={streams} />

      <div className="text-sm text-mute">
        {liveCount > 0 ? (
          <>
            Сейчас в эфире: <span className="font-medium text-bone">{liveCount}</span>
          </>
        ) : anyRec ? (
          "Сейчас никто не в эфире — можно посмотреть последние записи кастеров."
        ) : (
          "Сейчас никто не в эфире — загляните в дни этапов."
        )}
      </div>

      {current.embed_url ? (
        <StreamPlayer src={current.embed_url} title={current.title ?? current.caster} poster={current.thumb} live={current.live} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--r-card)] border border-line bg-surface-1 text-center text-mute" style={{ aspectRatio: "16 / 9" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--disabled)" }} aria-hidden />
          <span className="text-sm">Кастер сейчас не в эфире</span>
          {current.channel_url && (
            <a href={current.channel_url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-bone underline underline-offset-2">
              Открыть канал
            </a>
          )}
        </div>
      )}

      {(current.title || current.viewers || current.views) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mute">
          {current.title && <span className="min-w-0 truncate">{current.title}</span>}
          {current.viewers ? (
            <span className="tabular shrink-0" style={{ color: "var(--ember)" }}>
              {compact(current.viewers)} смотрят на {platformLabel(current.platform)}
            </span>
          ) : current.views ? (
            <span className="tabular shrink-0">{compact(current.views)} просмотров</span>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <StatusChip live={current.live} hasRec={!!current.embed_url} />
          <PlatformIcon platform={current.platform} size={26} />
          <span className="truncate font-display text-lg font-semibold">{current.caster}</span>
          <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide text-mute">
            {platformLabel(current.platform)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ReminderBell id={current.id} live={current.live} />
          {current.channel_url && (
            <a href={current.channel_url} target="_blank" rel="noopener noreferrer nofollow" className="pressable inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs text-bone hover:bg-surface-2">
              Канал
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </a>
          )}
        </div>
      </div>

      <Reactions streamId={current.id} initialLikes={current.likes ?? 0} />

      {/* ЧИПЫ КАСТЕРОВ */}
      <div className="flex flex-wrap gap-2">
        {streams.map((s) => {
          const on = s.id === current.id;
          return (
            <button
              key={s.id}
              onClick={() => setSel(s.id)}
              className={`pressable inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${on ? "border-line-strong bg-surface-2" : "border-line bg-surface-1 hover:bg-surface-2"}`}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.live ? "var(--ember)" : "var(--disabled)" }} />
              <span className="max-w-[150px] truncate">{s.caster}</span>
              {s.live && (
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--ember)" }}>
                  live
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
