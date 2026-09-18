import { StreamsView } from "@/components/StreamsView";
import { getStreams, type StreamOut } from "@/lib/api";

// Статус «в эфире» меняется в уик-энд — рендерим на запрос.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Стримы кастеров",
  description:
    "Трансляции гонок от кастеров сообщества на VK Видео и Rutube — смотрите этап с любимым комментатором на race.live.",
  alternates: { canonical: "/streams" },
};

export default async function StreamsPage() {
  const streams = await getStreams().catch(() => [] as StreamOut[]);
  const anyLive = streams.some((s) => s.live);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-mute">
          сообщество
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] normal-case tracking-normal">бета</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Стримы кастеров</h1>
        <p className="mt-1 max-w-prose text-mute">
          Смотрите гонку с комментатором сообщества. Трансляции идут на площадках кастеров (VK Видео,
          Rutube) — мы лишь показываем их плеер здесь. {anyLive ? "Кто-то уже в эфире." : "Сейчас никто не в эфире — заглядывайте в дни этапов."}
        </p>
      </div>

      {streams.length > 0 ? (
        <StreamsView streams={streams} />
      ) : (
        <div className="card-soft p-6 text-sm text-mute">
          Список кастеров пока пуст. Скоро здесь появятся трансляции сообщества.
        </div>
      )}

      <p className="text-xs text-mute">
        Видео принадлежит площадкам и кастерам; race.live встраивает официальный плеер с согласия авторов.
      </p>
    </div>
  );
}
