import { Link } from "next-view-transitions";
import { Suspense } from "react";
import { Countdown } from "@/components/Countdown";
import { CountdownBoxes } from "@/components/CountdownBoxes";
import { Flag } from "@/components/Flag";
import { HeroTrack } from "@/components/HeroTrack";
import { HeroLiveCard } from "@/components/HeroLiveCard";
import { HomeStreams } from "@/components/HomeStreams";
import { NotifyBell } from "@/components/NotifyBell";
import { Reveal } from "@/components/Reveal";
import { SoonArt } from "@/components/SoonArt";
import { SessionTime } from "@/components/SessionTime";
import { TeamLogo } from "@/components/TeamLogo";
import { TrackMap } from "@/components/TrackMap";
import {
  getDriverStandings,
  getMeeting,
  getNextSession,
  getQualifyingResults,
  getRaceResults,
  getSchedule,
  getStreams,
  type DriverStandingOut,
  type MeetingOut,
  type NextSessionOut,
  type QualifyingResultOut,
  type RaceResultOut,
  type StreamOut,
} from "@/lib/api";
import { sessionLabel, statusCode } from "@/lib/format";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { TEAMS } from "@/lib/teams";

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "ru",
  description: SITE_DESCRIPTION,
};

// Главная зависит от живых данных (ближайшая сессия, отсчёт) — рендерим на каждый
// запрос, иначе статичная сборка показывала пустой календарь до фоновой ревалидации.
export const dynamic = "force-dynamic";

const SOON = [
  {
    title: "Авторизация и профили",
    phase: "Фаза A",
    desc: "Вход по magic-link или Yandex ID, избранное и настройки между устройствами.",
  },
  {
    title: "Прогнозы на гонку",
    phase: "Фаза B",
    desc: "Угадывай подиум и поул, соревнуйся с друзьями в таблице предсказаний.",
  },
  {
    title: "Чат во время гонки",
    phase: "Фаза 5",
    desc: "Смотрим и обсуждаем вместе — живой чат, реакции и профили болельщиков.",
  },
];

export default async function HomePage() {
  // Только ближайшая сессия для героя (лёгкий запрос) — герой рисуется сразу,
  // тяжёлые секции (календарь, зачёт, подиум) подгружаются потоком ниже.
  const [next, streams, leaders] = await Promise.all([
    getNextSession().catch(() => null as NextSessionOut | null),
    getStreams().catch(() => [] as StreamOut[]),
    getDriverStandings().catch(() => [] as DriverStandingOut[]),
  ]);
  // Кастер в эфире → его стрим становится подложкой героя + карточка «Смотреть эфир».
  const liveStream = streams.find((s) => s.live && s.embed_url) ?? null;
  // Трасса ближайшего этапа — для графики в шапке (когда эфира нет).
  const meeting = next ? await getMeeting(next.round).catch(() => null) : null;
  // Маркеры на карте трассы — в реальном порядке последней сессии: квалификация этого
  // этапа (если уже прошла) → подиум прошлой гонки → лидеры чемпионата. С подписью.
  const toMarks = (rows: { code: string; team_slug: string | null }[]) =>
    rows.slice(0, 3).map((d) => ({ code: d.code, color: (d.team_slug && TEAMS[d.team_slug]?.color) || "#EDE6E4" }));
  let trackDrivers = toMarks(leaders);
  let trackOrder = "Лидеры чемпионата";
  if (next && !liveStream?.thumb) {
    const quali = await getQualifyingResults(next.round).catch(() => [] as QualifyingResultOut[]);
    if (quali.length >= 3) {
      trackDrivers = toMarks(quali);
      trackOrder = "Старт по квалификации";
    } else if (next.round > 1) {
      const prev = await getRaceResults(next.round - 1).catch(() => [] as RaceResultOut[]);
      if (prev.length >= 3) {
        trackDrivers = toMarks(prev);
        trackOrder = "Подиум прошлой гонки";
      }
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_LD) }} />
      {/* HERO — подложка: эфир кастера (если идёт) или трасса ближайшего этапа с «болидом» */}
      <section
        className="relative flex min-h-[440px] flex-col justify-between overflow-hidden rounded-[24px] md:min-h-[560px] shadow-[var(--soft)]"
        style={{ background: "linear-gradient(180deg,#180d10 0%, #130a0c 62%)" }}
      >
        {liveStream?.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={liveStream.thumb} alt="" className="kenburns pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55" />
        ) : (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%]"
            style={{ background: "radial-gradient(55% 100% at 50% 112%, rgba(224,64,47,0.4), rgba(224,64,47,0.1) 44%, transparent 72%)" }}
          />
        )}
        {!liveStream?.thumb && (
          <HeroTrack
            circuit={meeting?.circuit?.key}
            label={meeting?.circuit?.name_ru ?? meeting?.circuit?.name_en}
            round={meeting?.round}
            country={meeting?.circuit?.country_code}
            drivers={trackDrivers}
            order={trackOrder}
          />
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(100deg, rgba(19,10,12,0.94) 0%, rgba(19,10,12,0.68) 34%, rgba(19,10,12,0.22) 58%, transparent 82%)" }}
        />

        <div className="relative p-8 md:p-10">
          {liveStream && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-black/40 px-3.5 py-1.5 text-xs backdrop-blur">
              <span className="live-dot" aria-hidden />
              Сейчас в эфире · {liveStream.caster}
            </span>
          )}
          <h1 className="mt-4 max-w-[16ch] first:mt-0 font-display text-3xl font-semibold leading-[1.05] md:text-4xl">
            Смотрим Формулу вместе
          </h1>
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-4 p-6 md:p-8">
          <div className="w-full max-w-[330px] rounded-2xl border border-line bg-[rgba(18,11,13,0.62)] p-5 backdrop-blur-md">
            <div className="eyebrow flex items-center gap-2">
              <span className="live-dot" aria-hidden /> Ближайшая гонка
            </div>
            <div className="mt-2 font-display text-xl font-semibold">
              {next ? next.meeting_name_ru ?? next.meeting_name_en : "Скоро объявим"}
            </div>
            {next && next.session.starts_at ? (
              <>
                <div className="mt-0.5 text-sm text-mute">
                  {sessionLabel(next.session.type, next.session.name_ru, next.session.name_en)} ·{" "}
                  <SessionTime iso={next.session.starts_at} withZone />
                </div>
                <div className="mt-4">
                  <CountdownBoxes iso={next.session.starts_at} />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Link href={liveStream ? "/live" : `/schedule/${next.round}`} className="cta flex-1 justify-center">
                    {liveStream ? "Смотреть эфир" : "Открыть этап"}
                  </Link>
                  <NotifyBell
                    compact
                    iso={next.session.starts_at}
                    label={`${next.meeting_name_ru ?? next.meeting_name_en} · ${sessionLabel(next.session.type, next.session.name_ru, next.session.name_en)}`}
                  />
                </div>
              </>
            ) : (
              <Link href="/schedule" className="cta mt-4 w-full justify-center">
                Открыть расписание
              </Link>
            )}
          </div>
          {liveStream && <HeroLiveCard stream={liveStream} />}
        </div>
      </section>

      {/* Тяжёлые секции — потоком, с скелетоном (герой уже виден) */}
      <Suspense fallback={<HomeDataSkeleton />}>
        <HomeData />
      </Suspense>

      <hr className="divider-fade" />

      {/* СКОРО — честный роадмап вместо демо-данных */}
      <Reveal>
      <section>
        <div className="mb-4 flex items-baseline gap-3.5">
          <h2 className="font-display text-xl font-semibold">Скоро</h2>
          <span className="text-sm text-mute">что готовим дальше</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {SOON.map((s, i) => (
            <div key={s.title} className="card-soft p-5">
              <div className="flex items-center justify-between">
                <SoonArt i={i} />
                <span className="rounded-full bg-[var(--accent2-soft)] px-2.5 py-1 text-[11px] font-medium" style={{ color: "var(--accent2)" }}>
                  {s.phase}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mute">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
      </Reveal>
    </div>
  );
}

// Данные календаря/зачёта/подиума — грузятся потоком отдельно от героя.
async function HomeData() {
  const [schedule, standings, streams] = await Promise.all([
    getSchedule().catch(() => [] as MeetingOut[]),
    getDriverStandings().catch(() => [] as DriverStandingOut[]),
    getStreams().catch(() => [] as StreamOut[]),
  ]);
  const topStandings = standings.slice(0, 10);
  const leaderPoints = standings[0]?.points ?? 0;

  const now = Date.now();
  const upcoming = schedule
    .filter((m) => m.starts_at && new Date(m.starts_at).getTime() > now)
    .slice(0, 4);
  const rounds = upcoming.length ? upcoming : schedule.slice(-4);

  const lastDone = [...schedule]
    .reverse()
    .find((m) => m.ends_at && new Date(m.ends_at).getTime() < now);
  const top5 = lastDone
    ? (await getRaceResults(lastDone.round).catch(() => [] as RaceResultOut[])).slice(0, 5)
    : [];

  return (
    <>
      {/* СТРИМЫ КАСТЕРОВ */}
      {streams.length > 0 && (
        <Reveal>
          <HomeStreams streams={streams} />
        </Reveal>
      )}


      {/* ИТОГИ И ЗАЧЁТ — рядом, одинаковые карточки по 5 строк */}
      {((lastDone && top5.length > 0) || topStandings.length > 0) && (
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-1">
            {lastDone && top5.length > 0 && (
              <section className="flex min-w-0 flex-col">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold">Прошедший этап</h2>
                  <Link href={`/schedule/${lastDone.round}`} className="section-link">
                    Все итоги →
                  </Link>
                </div>
                <div className="card-soft flex flex-1 flex-col overflow-hidden">
                  <div className="flex items-center gap-2.5 border-b border-line px-5 py-3">
                    <Flag code={lastDone.circuit?.country_code ?? null} w={24} />
                    <span className="truncate font-display text-[15px] font-semibold">{lastDone.name_ru ?? lastDone.name_en}</span>
                    <span className="eyebrow ml-auto shrink-0">Этап {lastDone.round}</span>
                  </div>
                  {top5.map((r) => (
                    <HomeRow
                      key={r.code || r.position}
                      pos={r.position}
                      medal={r.position <= 3}
                      slug={r.team_slug}
                      href={`/drivers/${r.driver_id}`}
                      name={r.name_ru ?? r.name_en}
                      sub={r.team_name}
                      value={r.time ?? statusCode(r.status)}
                      valueSub={r.points ? `+${r.points} очк.` : undefined}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* на 2xl зачёт уже в колонке справа — тут не дублируем */}
            {topStandings.length > 0 && (
              <section className="flex min-w-0 flex-col 2xl:hidden">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold">Личный зачёт</h2>
                  <Link href="/standings" className="section-link">
                    Весь зачёт →
                  </Link>
                </div>
                <div className="card-soft flex flex-1 flex-col overflow-hidden">
                  <div className="flex items-center gap-2.5 border-b border-line px-5 py-3">
                    <span className="font-display text-[15px] font-semibold">Пилоты</span>
                    <span className="eyebrow ml-auto shrink-0">Очки</span>
                  </div>
                  {topStandings.slice(0, 5).map((d) => (
                    <HomeRow
                      key={d.code || d.position}
                      pos={d.position}
                      slug={d.team_slug}
                      href={`/drivers/${d.driver_id}`}
                      name={d.name_ru ?? d.name_en}
                      sub={d.team_name ?? ""}
                      value={String(d.points)}
                      strong
                      valueSub={d.position === 1 ? "Лидер" : `−${leaderPoints - d.points}`}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </Reveal>
      )}

      {/* БЛИЖАЙШИЕ ЭТАПЫ (кусок календаря) */}
      {rounds.length > 0 && (
        <Reveal>
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Ближайшие этапы</h2>
            <Link href="/schedule" className="section-link">Весь календарь →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {rounds.map((m, idx) => (
              <Link key={m.round} href={`/schedule/${m.round}`} className="card-soft relative flex flex-col gap-3 overflow-hidden p-4 transition-colors hover:bg-surface-2">
                <TrackMap circuit={m.circuit?.key} size={116} className="pointer-events-none absolute right-2 top-2 opacity-[0.13]" />
                <div className="flex items-center justify-between">
                  <Flag code={m.circuit?.country_code ?? null} />
                  <span className="eyebrow">Этап {m.round}</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate font-display font-semibold">{m.name_ru ?? m.name_en}</div>
                  <div className="truncate text-sm text-mute">{m.circuit?.name_ru ?? m.circuit?.name_en}</div>
                </div>
                <div className="mt-auto flex items-center justify-between text-sm">
                  <span className="text-mute"><SessionTime iso={m.starts_at} mode="date" /></span>
                  {idx === 0 && m.starts_at && (
                    <span className="tabular text-xs text-[var(--ember)]"><Countdown iso={m.starts_at} /></span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
        </Reveal>
      )}

    </>
  );
}

// Строка карточек «Прошедший этап» / «Личный зачёт» — одна разметка, одинаковая высота.
function HomeRow({
  pos,
  medal = false,
  slug,
  href,
  name,
  sub,
  value,
  valueSub,
  strong = false,
}: {
  pos: number;
  medal?: boolean;
  slug: string | null;
  href: string;
  name: string;
  sub: string;
  value: string;
  valueSub?: string;
  strong?: boolean;
}) {
  const color = (slug && TEAMS[slug]?.color) || "var(--line-strong)";
  const medalColor = pos === 1 ? "#E7B24B" : pos === 2 ? "#C4CAD0" : "#CD7F45";
  return (
    <Link
      href={href}
      className="team-row grid flex-1 grid-cols-[24px_4px_26px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-5 py-2.5 last:border-b-0 hover:bg-surface-2"
      style={{ "--row": color } as React.CSSProperties}
    >
      <span className="tabular font-display text-[15px] font-semibold" style={{ color: medal ? medalColor : "var(--mute)" }}>
        {pos}
      </span>
      <span className="h-7 w-[4px] rounded-full" style={{ background: color }} />
      <TeamLogo slug={slug ?? ""} size={24} />
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium leading-tight text-bone">{name}</span>
        <span className="mt-0.5 block truncate text-[13px] leading-tight text-mute">{sub}</span>
      </span>
      <span className="text-right leading-tight">
        <span className={`tabular block ${strong ? "font-display text-[15px] font-semibold text-bone" : "text-[13px] text-bone"}`}>{value}</span>
        {valueSub && <span className="tabular mt-0.5 block text-[12px] text-mute">{valueSub}</span>}
      </span>
    </Link>
  );
}

function HomeDataSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="skeleton h-44 rounded-[18px]" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-36 rounded-[18px]" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-[18px]" />
    </div>
  );
}
