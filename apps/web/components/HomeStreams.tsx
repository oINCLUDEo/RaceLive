import { Link } from "next-view-transitions";
import { PlatformIcon } from "@/components/PlatformIcon";
import { StreamPlayer } from "@/components/StreamPlayer";
import type { StreamOut } from "@/lib/api";

const platformLabel = (p: string) => (p === "vk" ? "VK Видео" : p === "rutube" ? "Rutube" : p);

// Компактный блок стримов на главной: если кто-то в эфире — встроенный плеер;
// иначе — карточки кастеров со ссылкой в раздел «Стримы».
export function HomeStreams({ streams }: { streams: StreamOut[] }) {
  if (streams.length === 0) return null;
  const live = streams.find((s) => s.live && s.embed_url);

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-xl font-semibold">Стримы кастеров</h2>
          {live && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--ember)", background: "var(--ember-soft)" }}
            >
              <span className="live-dot" aria-hidden /> В эфире
            </span>
          )}
        </div>
        <Link href="/streams" className="text-sm text-mute hover:text-bone">
          все стримы →
        </Link>
      </div>

      {live ? (
        <div className="flex flex-col gap-3">
          <StreamPlayer src={live.embed_url} title={live.title ?? live.caster} />
          <div className="flex flex-wrap items-center gap-2.5">
            <PlatformIcon platform={live.platform} />
            <span className="font-display font-semibold">{live.caster}</span>
            <span className="text-sm text-mute">{live.title ?? platformLabel(live.platform)}</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {streams.slice(0, 3).map((s) => (
            <Link
              key={s.id}
              href="/streams"
              className="pressable card-soft flex items-center gap-3 p-4"
            >
              <PlatformIcon platform={s.platform} size={30} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{s.caster}</div>
                <div className="text-xs text-mute">{platformLabel(s.platform)}</div>
              </div>
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-mute">офлайн</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
