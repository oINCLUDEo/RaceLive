import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { CountdownBoxes } from "@/components/CountdownBoxes";
import { Flag } from "@/components/Flag";
import { HeroCar } from "@/components/HeroCar";
import { SessionTime } from "@/components/SessionTime";
import { TeamLogo } from "@/components/TeamLogo";
import { TimingPreview } from "@/components/TimingPreview";
import { TrackMap } from "@/components/TrackMap";
import {
  getDriverStandings,
  getNextSession,
  getSchedule,
  type DriverStandingOut,
  type MeetingOut,
  type NextSessionOut,
} from "@/lib/api";
import { sessionLabel } from "@/lib/format";
import { TEAMS } from "@/lib/teams";

// Главная зависит от живых данных (ближайшая сессия, отсчёт) — рендерим на каждый
// запрос, иначе статичная сборка показывала пустой календарь до фоновой ревалидации.
export const dynamic = "force-dynamic";

const STREAMS = [
  { name: "Гонки с Гришей", meta: "Twitch · квалификация", v: "1.2k", av: "Г", c: "#C0504E", g: "#3a2226" },
  { name: "PitWall", meta: "VK Video · стратегии", v: "640", av: "P", c: "#4E7CC0", g: "#2a2230" },
  { name: "Апекс ТВ", meta: "YouTube · с регулятором", v: "3.1k", av: "А", c: "#4EA36E", g: "#22303a" },
  { name: "Бокс-Бокс", meta: "Twitch · ламповый", v: "820", av: "Б", c: "#B0894D", g: "#2f2622" },
];

const CHAT = [
  { av: "К", c: "#C0504E", name: "Кирилл", lvl: "ур.21", text: "Норрис поехал, квала топ 🔥" },
  { av: "А", c: "#4E7CC0", name: "Аня", lvl: "ур.34", text: "Леклер на софте — рискуют, но темп есть" },
  { av: "М", c: "#4EA36E", name: "Максим", lvl: "ур.12", text: "ждём Ферстаппена в последней попытке" },
];

const FANS = [
  { p: 1, av: "Д", c: "#C0504E", name: "Дмитрий", meta: "128 сессий · серия 14", lvl: "ур. 42" },
  { p: 2, av: "С", c: "#4E7CC0", name: "Света", meta: "прогнозы 78%", lvl: "ур. 37" },
  { p: 3, av: "И", c: "#4EA36E", name: "Игорь", meta: "1 240 сообщений", lvl: "ур. 33" },
];

export default async function HomePage() {
  const [next, schedule, standings] = await Promise.all([
    getNextSession().catch(() => null as NextSessionOut | null),
    getSchedule().catch(() => [] as MeetingOut[]),
    getDriverStandings().catch(() => [] as DriverStandingOut[]),
  ]);
  const topStandings = standings.slice(0, 10);
  const leaderPoints = standings[0]?.points ?? 0;

  const now = Date.now();
  const upcoming = schedule
    .filter((m) => m.starts_at && new Date(m.starts_at).getTime() > now)
    .slice(0, 4);
  const rounds = upcoming.length ? upcoming : schedule.slice(-4);

  return (
    <div className="flex flex-col gap-8">
      {/* HERO — болид статично встроен в сцену */}
      <section
        className="relative flex min-h-[560px] flex-col justify-between overflow-hidden rounded-[24px] shadow-[var(--soft)]"
        style={{ background: "linear-gradient(180deg,#180d10 0%, #130a0c 62%)" }}
      >
        {/* красный подсвет-пол (за прозрачным canvas) */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%]"
          style={{ background: "radial-gradient(55% 100% at 50% 112%, rgba(224,64,47,0.4), rgba(224,64,47,0.1) 44%, transparent 72%)" }}
        />
        {/* болид — фоновый наполнитель справа + переключатель (three.js по требованию) */}
        <HeroCar />
        {/* градиент для читаемости текста слева */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(100deg, rgba(19,10,12,0.94) 0%, rgba(19,10,12,0.68) 34%, rgba(19,10,12,0.22) 58%, transparent 82%)" }}
        />

        {/* верх: бренд + заголовок */}
        <div className="relative p-8 md:p-10">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-black/40 px-3.5 py-1.5 text-xs backdrop-blur">
            <span className="live-dot" aria-hidden />
            {next ? `Сейчас в эфире · ${next.meeting_name_ru ?? next.meeting_name_en}` : "Сейчас в эфире"}
          </span>
          <h1 className="mt-4 max-w-[16ch] font-display text-3xl font-semibold leading-[1.05] md:text-4xl">
            Смотрим Формулу вместе
          </h1>
        </div>

        {/* низ: карточка ближайшей гонки + присутствие */}
        <div className="relative flex flex-wrap items-end justify-between gap-4 p-6 md:p-8">
          <div className="w-full max-w-[330px] rounded-2xl border border-line bg-[rgba(18,11,13,0.62)] p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-mute">
              <span className="live-dot" aria-hidden /> ближайшая гонка
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
                <Link href={`/schedule/${next.round}`} className="cta mt-4 w-full justify-center">
                  Смотреть
                </Link>
              </>
            ) : (
              <Link href="/schedule" className="cta mt-4 w-full justify-center">
                Открыть расписание
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2.5 rounded-full border border-line bg-black/40 px-4 py-2 text-[13px] text-[#d8c7c6] backdrop-blur">
            <span className="flex">
              {["#C0504E", "#4E7CC0", "#4EA36E"].map((c, k) => (
                <span key={k} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#130a0c] font-display text-[10px] font-semibold text-white" style={{ background: c, marginLeft: k ? -8 : 0 }}>
                  {["А", "М", "К"][k]}
                </span>
              ))}
            </span>
            <span><span className="tabular text-white">1 248</span> смотрят</span>
          </div>
        </div>
      </section>

      {/* БЛИЖАЙШИЕ ЭТАПЫ (кусок календаря) */}
      {rounds.length > 0 && (
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Ближайшие этапы</h2>
            <Link href="/schedule" className="text-sm text-mute hover:text-bone">весь календарь →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {rounds.map((m, idx) => (
              <Link key={m.round} href={`/schedule/${m.round}`} className="card-soft relative flex flex-col gap-3 overflow-hidden p-4 transition-colors hover:bg-surface-2">
                <TrackMap circuit={m.circuit?.key} size={116} className="pointer-events-none absolute right-2 top-2 opacity-[0.13]" />
                <div className="flex items-center justify-between">
                  <Flag code={m.circuit?.country_code ?? null} />
                  <span className="text-[11px] uppercase tracking-wide text-mute">Этап {m.round}</span>
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
      )}

      {/* ТАЙМИНГ */}
      <section className="grid items-center gap-6 md:grid-cols-[1fr_360px]">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-mute">в прямом эфире</div>
          <h2 className="mt-2 font-display text-2xl font-semibold">Живой тайминг на русском</h2>
          <p className="mt-3 max-w-prose text-mute">
            Позиции, интервалы, шины и флаги — обновляются в реальном времени, с логотипами
            команд и подсветкой лучшего круга. Рейс-контроль переведён на русский.
          </p>
        </div>
        <TimingPreview />
      </section>

      {/* СЕЙЧАС СМОТРЯТ */}
      <section>
        <div className="mb-4 flex items-baseline gap-3.5">
          <h2 className="font-display text-xl font-semibold">Сейчас смотрят</h2>
          <span className="text-sm text-mute">стримы комьюнити в прямом эфире</span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STREAMS.map((s) => (
            <div key={s.name} className="card-soft overflow-hidden">
              <div className="relative h-[120px]" style={{ background: `linear-gradient(135deg, ${s.g}, #130a0c)` }}>
                <span className="absolute left-2.5 top-2.5 rounded-full bg-[var(--ember)] px-2 py-0.5 text-[10px] text-white">LIVE</span>
                <span className="tabular absolute bottom-2.5 right-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px]">{s.v}</span>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-3">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full font-display text-xs font-semibold text-white" style={{ background: s.c }}>{s.av}</span>
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-semibold">{s.name}</div>
                  <div className="truncate text-xs text-mute">{s.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ЧАТ + ТОП */}
      <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="card-soft flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-[18px] py-3.5 text-[13px] text-mute">
            <span className="font-display text-bone">Чат гонки</span>
            <span><span className="tabular text-bone">340</span> в чате</span>
          </div>
          <div className="flex flex-col gap-3.5 px-[18px] py-4">
            {CHAT.map((m) => (
              <div key={m.name} className="flex gap-2.5">
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full font-display text-xs font-semibold text-white" style={{ background: m.c }}>{m.av}</span>
                <div>
                  <div className="text-xs"><b className="text-bone">{m.name}</b> <span className="text-mute">{m.lvl}</span></div>
                  <div className="text-sm">{m.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto flex gap-2.5 border-t border-line px-[18px] py-3.5">
            <div className="flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-sm text-mute">Написать сообщение…</div>
            <span className="cta py-2.5">Отправить</span>
          </div>
        </div>

        <div className="card-soft overflow-hidden">
          <div className="border-b border-line px-[18px] py-3.5">
            <span className="font-display text-[15px] font-semibold">Болельщики недели</span>
          </div>
          <div className="py-1.5">
            {FANS.map((f) => (
              <div key={f.p} className="grid grid-cols-[22px_34px_1fr_auto] items-center gap-3 px-[18px] py-2.5">
                <span className="tabular text-mute">{f.p}</span>
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full font-display text-sm font-semibold text-white" style={{ background: f.c }}>{f.av}</span>
                <div>
                  <div className="text-sm">{f.name}</div>
                  <div className="text-[11px] uppercase tracking-wide text-mute">{f.meta}</div>
                </div>
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium">{f.lvl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ЧЕМПИОНАТ — реальные данные (Jolpica) */}
      {topStandings.length > 0 && (
        <section className="card-soft overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-display text-base font-semibold">Личный зачёт</span>
            <Link href="/standings" className="text-[13px] text-mute hover:text-bone">весь зачёт →</Link>
          </div>
          <div className="grid md:grid-cols-2">
            {[topStandings.slice(0, 5), topStandings.slice(5, 10)].map((col, ci) => (
              <div key={ci} className={ci === 1 ? "md:border-l md:border-line" : ""}>
                {col.map((d, ri) => {
                  const color = d.team_slug ? TEAMS[d.team_slug]?.color : undefined;
                  const gap = leaderPoints - d.points;
                  return (
                    <div
                      key={d.code || d.position}
                      className={`grid grid-cols-[22px_4px_28px_1fr_auto] items-center gap-3 px-5 py-2.5 ${ri < col.length - 1 ? "border-b border-line" : ""} ${d.position === 1 ? "bg-surface-2" : ""}`}
                    >
                      <span className="tabular text-mute">{d.position}</span>
                      <span className="h-6 w-[4px] rounded-full" style={{ background: color ?? "var(--line)" }} />
                      <TeamLogo slug={d.team_slug ?? ""} size={26} />
                      <span className="truncate">{d.name_ru ?? d.name_en}</span>
                      <span className="text-right leading-tight">
                        <span className="tabular block font-display font-semibold">{d.points}</span>
                        <span className="tabular block text-[11px] text-mute">
                          {d.position === 1 ? "лидер" : `−${gap}`}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
