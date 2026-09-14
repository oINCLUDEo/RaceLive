import { Link } from "next-view-transitions";
import { Countdown } from "@/components/Countdown";
import { SessionTime } from "@/components/SessionTime";
import { TimingPreview } from "@/components/TimingPreview";
import { getLive, type LiveOut } from "@/lib/api";
import { sessionLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Эфир",
  description: "Живой тайминг гонки в реальном времени на русском.",
};

export default async function LivePage() {
  let s: LiveOut | null = null;
  try {
    s = await getLive();
  } catch {
    s = null;
  }
  const sess = s?.session ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* СТАТУС */}
      <section
        className="glow-panel flex flex-wrap items-center justify-between gap-4 rounded-[24px] p-8 shadow-[var(--soft)]"
      >
        <div>
          {s?.live ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--ember)] px-3 py-1 text-xs font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-white" /> В ЭФИРЕ
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-black/30 px-3 py-1 text-xs text-mute">
              <span className="live-dot" aria-hidden /> сейчас эфира нет
            </span>
          )}
          <h1 className="mt-3 font-display text-3xl font-semibold">
            {s && s.round != null ? (s.meeting_name_ru ?? s.meeting_name_en) : "Живой тайминг"}
          </h1>
          {sess && (
            <p className="mt-1 text-mute">
              {sessionLabel(sess.type, sess.name_ru, sess.name_en)}
              {sess.starts_at && (
                <>
                  {" · "}
                  <SessionTime iso={sess.starts_at} withZone />
                </>
              )}
            </p>
          )}
        </div>
        {!s?.live && sess?.starts_at && (
          <div className="flex items-center gap-4">
            <div className="font-display text-lg text-bone">
              до старта <span className="tabular"><Countdown iso={sess.starts_at} /></span>
            </div>
            {s?.round != null && (
              <Link href={`/schedule/${s.round}`} className="cta">К этапу</Link>
            )}
          </div>
        )}
      </section>

      {/* ТАЙМИНГ (предпросмотр) */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Таблица тайминга</h2>
          <span className="text-[11px] uppercase tracking-wide text-mute">предпросмотр</span>
        </div>
        <div className="max-w-[440px]">
          <TimingPreview />
        </div>
      </section>

      {/* ЧЕСТНО О СТАТУСЕ ФАЗЫ 3 */}
      <section className="card-soft p-5 text-sm leading-relaxed text-mute">
        <span className="font-display text-bone">Что здесь будет.</span> Живой тайминг —
        позиции, интервалы, круги, шины, флаги и сообщения рейс-контроля на русском —
        обновляемый в реальном времени. Это Фаза 3: сейчас подключаем поток данных
        (OpenF1) и realtime-слой (Centrifugo). Выше — предпросмотр таблицы на демо-данных.
        Определение «идёт ли сессия сейчас» уже работает по расписанию.
      </section>
    </div>
  );
}
