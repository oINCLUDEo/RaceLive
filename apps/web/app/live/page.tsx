import { Link } from "next-view-transitions";
import { Countdown } from "@/components/Countdown";
import { NotifyBell } from "@/components/NotifyBell";
import { SessionTime } from "@/components/SessionTime";
import { StreamStage } from "@/components/StreamStage";
import { WatchPanels } from "@/components/WatchPanels";
import { WeekendForecast } from "@/components/WeekendForecast";
import { WeekendSessions } from "@/components/WeekendSessions";
import {
  getLive,
  getMeeting,
  getStreams,
  getWeekendForecast,
  type LiveOut,
  type MeetingOut,
  type StreamOut,
  type WeekendForecastOut,
} from "@/lib/api";
import { sessionLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Эфир",
  description: "Смотрите гонку с кастерами сообщества: трансляции, реакции, расписание уик-энда и прогноз погоды.",
  alternates: { canonical: "/live" },
};

// «Эфир»: стрим кастера крупно + панели данных на выбор зрителя (позиции, рейс-контроль,
// погода) с задержкой «под стрим»; ниже — расписание уик-энда и прогноз погоды.
// Без живых данных (только повтор прошлой гонки) панели по умолчанию выключены.
export default async function LivePage() {
  const [s, streams] = await Promise.all([
    getLive().catch(() => null as LiveOut | null),
    getStreams().catch(() => [] as StreamOut[]),
  ]);
  const round = s?.round ?? null;
  const [meeting, forecast] =
    round != null
      ? await Promise.all([
          getMeeting(round).catch(() => null as MeetingOut | null),
          getWeekendForecast(round).catch(() => null as WeekendForecastOut | null),
        ])
      : [null, null];
  const sess = s?.session ?? null;
  const liveStream = streams.find((x) => x.live) ?? null;
  const hasForecast = !!forecast?.available && forecast.days.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* СТАТУС */}
      <section className="glow-panel flex flex-wrap items-center justify-between gap-4 rounded-[24px] p-8 shadow-[var(--soft)]">
        <div>
          {liveStream ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--ember)] px-3 py-1 text-xs font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> В ЭФИРЕ · {liveStream.caster}
            </span>
          ) : s?.live ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--ember)] px-3 py-1 text-xs font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Сессия идёт
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-black/30 px-3 py-1 text-xs text-mute">
              <span className="live-dot" aria-hidden /> Сейчас эфира нет
            </span>
          )}
          <h1 className="mt-3 font-display text-3xl font-semibold">
            {s && s.round != null ? (s.meeting_name_ru ?? s.meeting_name_en) : "Эфир"}
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
              {s?.live && !liveStream && " · кастеры скоро подключатся"}
            </p>
          )}
        </div>
        {!s?.live && sess?.starts_at && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="font-display text-lg text-bone">
              До старта <span className="tabular"><Countdown iso={sess.starts_at} /></span>
            </div>
            <NotifyBell
              iso={sess.starts_at}
              label={`${s?.meeting_name_ru ?? s?.meeting_name_en ?? "Сессия"} · ${sessionLabel(sess.type, sess.name_ru, sess.name_en)}`}
            />
          </div>
        )}
      </section>

      {/* СТРИМ + ПАНЕЛИ ДАННЫХ (позиции, рейс-контроль, погода — на выбор зрителя) */}
      <section id="streams" className="scroll-mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Смотреть с кастером</h2>
          <span className="text-[11px] uppercase tracking-wide text-mute">трансляции сообщества</span>
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            {streams.length > 0 ? (
              <StreamStage streams={streams} />
            ) : (
              <div className="card-soft flex aspect-video items-center justify-center p-6 text-center text-sm text-mute">
                Кастеры пока не подключены — загляните ближе к старту сессии.
              </div>
            )}
          </div>
          <aside className="min-w-0">
            <WatchPanels />
          </aside>
        </div>
      </section>

      {/* УИК-ЭНД: расписание сессий + погода (реальные данные, совпадают с эфиром) */}
      {meeting && (
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Уик-энд</h2>
            <Link href={`/schedule/${meeting.round}`} className="text-sm text-mute hover:text-bone">
              подробнее об этапе →
            </Link>
          </div>
          <div className={`grid gap-5 ${hasForecast ? "lg:grid-cols-[minmax(0,420px)_1fr]" : ""}`}>
            <WeekendSessions meeting={meeting} />
            {hasForecast && forecast && <WeekendForecast data={forecast} />}
          </div>
        </section>
      )}
    </div>
  );
}
