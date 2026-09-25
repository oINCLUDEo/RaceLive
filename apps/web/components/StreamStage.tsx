"use client";

// Компактный стрим-блок для раскладки «бок о бок» на «Эфире»: ленивый плеер,
// подпись (эфир/запись), напоминание об эфире, реакции и чипы кастеров.
import { useEffect, useState } from "react";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Reactions } from "@/components/Reactions";
import { StreamLiveWatcher } from "@/components/StreamLiveWatcher";
import { StreamPlayer } from "@/components/StreamPlayer";
import type { StreamOut, StreamSource } from "@/lib/api";
import { looksAbroad } from "@/lib/geo";
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

const PREF_KEY = "racelive:platform";

const sourcesOf = (s: StreamOut): StreamSource[] => (s.sources?.length ? s.sources : [s]);

// Какую площадку кастера показать: выбранную зрителем (если там есть что смотреть и
// она не уступает по «эфиру»), иначе живую; из-за рубежа — не Rutube, если есть выбор.
function pickSource(s: StreamOut, pref: string | null, abroad: boolean): StreamSource {
  const all = sourcesOf(s);
  const anyLive = all.some((x) => x.live);
  const byPref = pref ? all.find((x) => x.platform === pref && x.embed_url && (x.live || !anyLive)) : undefined;
  if (byPref) return byPref;
  const pool = anyLive ? all.filter((x) => x.live) : all.filter((x) => x.embed_url);
  if (!pool.length) return all[0];
  return (abroad && pool.find((x) => x.platform !== "rutube")) || pool[0];
}

export function StreamStage({ streams }: { streams: StreamOut[] }) {
  const [sel, setSel] = useState<string>(
    () =>
      streams.find((s) => s.live)?.id ??
      streams.find((s) => s.embed_url)?.id ??
      streams[0]?.id ??
      "",
  );
  const [pref, setPref] = useState<string | null>(null);
  const [abroad, setAbroad] = useState(false);
  useEffect(() => {
    setAbroad(looksAbroad());
    try {
      setPref(localStorage.getItem(PREF_KEY));
    } catch {}
  }, []);
  const choose = (platform: string) => {
    setPref(platform);
    try {
      localStorage.setItem(PREF_KEY, platform);
    } catch {}
  };

  const current = streams.find((s) => s.id === sel) ?? streams[0];
  if (!current) return null;
  const sources = sourcesOf(current);
  const src = pickSource(current, pref, abroad);
  // Поля выбранной площадки поверх записи кастера (id, имя, лайки — общие).
  const v = { ...current, ...src };
  const alt = sources.find((x) => x !== src && x.embed_url && x.platform !== "rutube");

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

      {v.embed_url ? (
        <StreamPlayer key={v.embed_url} src={v.embed_url} title={v.title ?? v.caster} poster={v.thumb} live={v.live} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--r-card)] border border-line bg-surface-1 text-center text-mute" style={{ aspectRatio: "16 / 9" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--disabled)" }} aria-hidden />
          <span className="text-sm">Кастер сейчас не в эфире</span>
          {v.channel_url && (
            <a href={v.channel_url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-bone underline underline-offset-2">
              Открыть канал
            </a>
          )}
        </div>
      )}

      {(sources.length > 1 || (v.platform === "rutube" && abroad)) && (
        <div className="flex flex-col gap-2 rounded-[var(--r-card)] border border-line bg-surface-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          {sources.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-mute">Площадка</span>
              <div className="inline-flex rounded-full border border-line bg-surface-2 p-0.5" role="tablist" aria-label="Площадка трансляции">
                {sources.map((x) => {
                  const on = x === src;
                  const off = !x.embed_url;
                  return (
                    <button
                      key={x.platform}
                      role="tab"
                      aria-selected={on}
                      disabled={off}
                      onClick={() => choose(x.platform)}
                      title={off ? "На этой площадке сейчас нечего смотреть" : undefined}
                      className={`pressable inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${on ? "bg-[var(--bone)] text-[var(--surface-0)]" : "text-bone hover:bg-surface-1"} ${off ? "cursor-not-allowed opacity-40" : ""}`}
                    >
                      {platformLabel(x.platform)}
                      {x.live && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ember)" }} aria-label="в эфире" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {v.platform === "rutube" &&
            (alt ? (
              <button onClick={() => choose(alt.platform)} className="text-left text-xs text-mute hover:text-bone">
                Rutube просит выключить VPN или не открывается за границей?{" "}
                <span className="text-bone underline underline-offset-2">Смотреть на {platformLabel(alt.platform)}</span>
              </button>
            ) : abroad ? (
              <span className="text-xs text-mute">Rutube может не открываться за пределами России или с включённым VPN.</span>
            ) : null)}
        </div>
      )}

      {(v.title || v.viewers || v.views) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mute">
          {v.title && <span className="min-w-0 truncate">{v.title}</span>}
          {v.viewers ? (
            <span className="tabular shrink-0" style={{ color: "var(--ember)" }}>
              {compact(v.viewers)} смотрят на {platformLabel(v.platform)}
            </span>
          ) : v.views ? (
            <span className="tabular shrink-0">{compact(v.views)} просмотров</span>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <StatusChip live={v.live} hasRec={!!v.embed_url} />
          <PlatformIcon platform={v.platform} size={26} />
          <span className="truncate font-display text-lg font-semibold">{v.caster}</span>
          <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide text-mute">
            {platformLabel(v.platform)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ReminderBell id={current.id} live={v.live} />
          {v.channel_url && (
            <a href={v.channel_url} target="_blank" rel="noopener noreferrer nofollow" className="pressable inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs text-bone hover:bg-surface-2">
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
