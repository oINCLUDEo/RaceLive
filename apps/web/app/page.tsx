import Link from "next/link";
import { CarViewer } from "@/components/CarViewer";
import { Countdown } from "@/components/Countdown";
import { Flag } from "@/components/Flag";
import { SessionTime } from "@/components/SessionTime";
import { TeamLogo } from "@/components/TeamLogo";
import { TimingPreview } from "@/components/TimingPreview";
import {
  getNextSession,
  getSchedule,
  type MeetingOut,
  type NextSessionOut,
} from "@/lib/api";
import { sessionLabel } from "@/lib/format";

const STANDINGS = [
  { p: 1, team: "redbull", name: "Макс Ферстаппен", pts: 331 },
  { p: 2, team: "mclaren", name: "Ландо Норрис", pts: 318 },
  { p: 3, team: "mclaren", name: "Оскар Пиастри", pts: 305 },
  { p: 4, team: "ferrari", name: "Шарль Леклер", pts: 241 },
  { p: 5, team: "ferrari", name: "Льюис Хэмилтон", pts: 228 },
  { p: 6, team: "mercedes", name: "Джордж Расселл", pts: 212 },
];

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
  const [next, schedule] = await Promise.all([
    getNextSession().catch(() => null as NextSessionOut | null),
    getSchedule().catch(() => [] as MeetingOut[]),
  ]);

  const now = Date.now();
  const upcoming = schedule
    .filter((m) => m.starts_at && new Date(m.starts_at).getTime() > now)
    .slice(0, 4);
  const rounds = upcoming.length ? upcoming : schedule.slice(-4);

  return (
    <div className="flex flex-col gap-8">
      {/* HERO — болид как живая подложка */}
      <section className="glow-hero relative overflow-hidden rounded-[24px] shadow-[var(--soft)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-full md:w-[58%]">
          <CarViewer backdrop />
        </div>
        {/* атмосфера + читаемость текста */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(50% 70% at 74% 54%, rgba(224,64,47,0.26), transparent 60%)" }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(100deg, rgba(19,10,12,0.98) 0%, rgba(19,10,12,0.9) 34%, rgba(19,10,12,0.5) 55%, rgba(19,10,12,0.12) 80%, rgba(19,10,12,0) 100%)" }}
        />

        <div className="relative flex min-h-[440px] max-w-[600px] flex-col justify-center p-8 md:p-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-black/40 px-3.5 py-1.5 text-xs">
            <span className="live-dot" aria-hidden />
            {next ? `СЕЙЧАС В ЭФИРЕ · ${next.meeting_name_ru ?? next.meeting_name_en}` : "СЕЙЧАС В ЭФИРЕ"}
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.03] md:text-5xl">
            Сюда просто
            <br />
            тянет заходить
          </h1>
          <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-[#d8c7c6]">
            Смотришь гонку, залипаешь в чат, споришь о стратегии — и время летит. Иногда шумно,
            иногда спокойно, но всегда со своими. Короче, заходи :)
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/schedule" className="cta">Смотреть сейчас</Link>
            <span className="flex items-center gap-2.5 text-[13px] text-[#d8c7c6]">
              <span className="flex">
                {["#C0504E", "#4E7CC0", "#4EA36E"].map((c, k) => (
                  <span key={k} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#130a0c] font-display text-[11px] font-semibold text-white" style={{ background: c, marginLeft: k ? -9 : 0 }}>
                    {["А", "М", "К"][k]}
                  </span>
                ))}
              </span>
              <span className="tabular text-white">1 248</span> смотрят
            </span>
          </div>
          {next && next.session.starts_at && (
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="text-mute">
                Ближайшая:{" "}
                <span className="text-bone">
                  {sessionLabel(next.session.type, next.session.name_ru, next.session.name_en)}
                </span>
              </span>
              <span className="text-bone">
                через <span className="tabular"><Countdown iso={next.session.starts_at} /></span>
              </span>
            </div>
          )}
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
              <Link key={m.round} href={`/schedule/${m.round}`} className="card-soft flex flex-col gap-3 p-4 transition-colors hover:bg-surface-2">
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

      {/* ЧЕМПИОНАТ */}
      <section className="card-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="font-display text-base font-semibold">Личный зачёт · после Баку</span>
          <Link href="/schedule" className="text-[13px] text-mute hover:text-bone">смотреть весь →</Link>
        </div>
        <div className="grid md:grid-cols-2">
          {STANDINGS.map((d, idx) => (
            <div
              key={d.p}
              className={`grid grid-cols-[24px_28px_1fr_auto] items-center gap-3 px-5 py-3 ${idx < 4 ? "border-b border-line" : ""} ${idx % 2 === 1 ? "md:border-l md:border-line" : ""}`}
            >
              <span className="tabular text-mute">{d.p}</span>
              <TeamLogo slug={d.team} size={28} />
              <span>{d.name}</span>
              <span className="tabular font-display font-semibold">{d.pts}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
