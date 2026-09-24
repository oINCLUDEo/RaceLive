import { Link } from "next-view-transitions";
import { PlatformIcon } from "@/components/PlatformIcon";
import type { StreamOut } from "@/lib/api";

const platformLabel = (p: string) => (p === "vk" ? "VK Видео" : p === "rutube" ? "Rutube" : p);
const compact = (n: number) => new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(n);

// Компактная полоса кастеров на главной. Сам эфир показывает шапка (подложка + карточка),
// здесь — кто есть, кто в эфире, и быстрый переход на «Эфир».
export function HomeStreams({ streams }: { streams: StreamOut[] }) {
  if (streams.length === 0) return null;
  const liveCount = streams.filter((s) => s.live).length;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-xl font-semibold">Кастеры</h2>
          <span className="text-sm text-mute">
            {liveCount > 0 ? `в эфире: ${liveCount}` : "смотрим гонки вместе с комментаторами сообщества"}
          </span>
        </div>
        <Link href="/live#streams" className="text-sm text-mute hover:text-bone">
          в эфир →
        </Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {streams.map((s) => (
          <Link
            key={s.id}
            href="/live#streams"
            className={`pressable flex min-w-[220px] flex-1 items-center gap-3 rounded-[var(--r-card)] border px-4 py-3 ${s.live ? "border-[var(--ember-soft)] bg-[linear-gradient(110deg,var(--ember-soft),var(--surface-1)_70%)]" : "border-line bg-surface-1"}`}
          >
            <PlatformIcon platform={s.platform} size={30} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{s.caster}</div>
              <div className="truncate text-xs text-mute">
                {platformLabel(s.platform)}
                {s.live && s.viewers ? ` · ${compact(s.viewers)} смотрят` : s.views ? ` · ${compact(s.views)} просмотров` : ""}
              </div>
            </div>
            {s.live ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--ember)" }}>
                <span className="live-dot" aria-hidden /> live
              </span>
            ) : (
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-mute">{s.embed_url ? "запись" : "офлайн"}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
