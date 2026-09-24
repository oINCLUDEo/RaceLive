import { Link } from "next-view-transitions";
import { PlatformIcon } from "@/components/PlatformIcon";
import type { StreamOut } from "@/lib/api";

const platformLabel = (p: string) => (p === "vk" ? "VK Видео" : p === "rutube" ? "Rutube" : p);
const compact = (n: number) => new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const tint = (p: string) => (p === "vk" ? "#3E8FE0" : "#B04CE6");

// Кастеры на главной — постерные карточки: обложка эфира/записи фоном, светящаяся
// рамка у тех, кто в эфире, статус и цифры. Сам эфир показывает шапка.
export function HomeStreams({ streams }: { streams: StreamOut[] }) {
  if (streams.length === 0) return null;
  const liveCount = streams.filter((s) => s.live).length;

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-xl font-semibold">Кастеры</h2>
          <span className="text-sm text-mute">
            {liveCount > 0 ? `сейчас в эфире: ${liveCount}` : "комментаторы сообщества race.live"}
          </span>
        </div>
        <Link href="/live#streams" className="text-sm text-mute hover:text-bone">
          в эфир →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {streams.map((s) => (
          <Link
            key={s.id}
            href="/live#streams"
            className={`group relative flex aspect-[16/10] flex-col justify-between overflow-hidden rounded-[var(--r-card)] border p-4 transition-transform duration-200 hover:-translate-y-1 ${s.live ? "caster-live border-transparent" : "border-line"}`}
            style={{ background: `radial-gradient(120% 90% at 85% 0%, color-mix(in srgb, ${tint(s.platform)} 28%, transparent), var(--surface-1) 65%)` }}
          >
            {s.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.thumb}
                alt=""
                className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${s.live ? "opacity-70" : "opacity-40 grayscale-[35%]"}`}
              />
            ) : (
              <svg className="pointer-events-none absolute -right-6 -top-6 opacity-10" width="160" height="160" viewBox="0 0 24 24" fill={tint(s.platform)} aria-hidden>
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            )}
            <span
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(13,9,11,0.15) 0%, rgba(13,9,11,0.2) 40%, rgba(13,9,11,0.92) 100%)" }}
            />

            {/* статус */}
            <div className="relative flex items-center justify-between">
              {s.live ? (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--ember)" }}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> в эфире
                </span>
              ) : (
                <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-bone/80 backdrop-blur">
                  {s.embed_url ? "запись" : "офлайн"}
                </span>
              )}
              {(s.likes ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[11px] text-bone backdrop-blur">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#FF7A93" aria-hidden>
                    <path d="M12 21s-7.4-4.5-9.5-9.1C.9 8.3 3.1 4.6 6.7 4.6c2.1 0 3.6 1.1 4.4 2.5.8-1.4 2.3-2.5 4.4-2.5 3.6 0 5.8 3.7 4.3 7.3C18.8 16.5 12 21 12 21z" />
                  </svg>
                  <span className="tabular">{compact(s.likes ?? 0)}</span>
                </span>
              )}
            </div>

            {/* имя и цифры */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={s.platform} size={24} />
                <span className="truncate font-display text-lg font-semibold">{s.caster}</span>
              </div>
              <div className="mt-1 truncate text-xs text-bone/70">
                {s.live && s.title ? s.title : platformLabel(s.platform)}
                {s.live && s.viewers ? ` · ${compact(s.viewers)} смотрят` : s.views ? ` · ${compact(s.views)} просмотров` : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
