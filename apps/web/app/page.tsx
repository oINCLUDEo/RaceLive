import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { SessionTime } from "@/components/SessionTime";
import { TeamLogo } from "@/components/TeamLogo";
import { TimezoneNote } from "@/components/TimezoneNote";
import { TimingPreview } from "@/components/TimingPreview";
import { getNextSession, type NextSessionOut } from "@/lib/api";
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
  { p: 4, av: "Н", c: "#7A4DB0", name: "Нина", meta: "62 сессии · серия 6", lvl: "ур. 28" },
];

export default async function HomePage() {
  const next = await getNextSession().catch(() => null as NextSessionOut | null);

  return (
    <div className="flex flex-col gap-7">
      {/* HERO */}
      <section className="glow-hero relative flex flex-col items-stretch gap-8 overflow-hidden rounded-[24px] p-8 shadow-[var(--soft)] md:flex-row md:items-center md:p-12">
        <svg viewBox="0 0 760 260" className="pointer-events-none absolute -bottom-6 -right-10 w-[560px] max-w-[70%] opacity-50" aria-hidden>
          <defs>
            <linearGradient id="rimH" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F0705F" />
              <stop offset="100%" stopColor="#7a1f16" />
            </linearGradient>
          </defs>
          <path d="M100 150 L100 128 Q112 120 150 118 L214 115 Q238 115 250 100 L268 88 L288 88 Q296 100 316 114 L352 114 Q378 100 414 104 Q470 108 512 116 L604 124 Q672 130 700 144 L706 150 Q700 154 660 154 L200 154 Q140 155 100 153 Z" fill="#1a1013" stroke="url(#rimH)" strokeWidth="2" />
          <path d="M352 116 Q384 90 416 108" fill="none" stroke="url(#rimH)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="182" cy="176" r="52" fill="#120b0d" stroke="#2a1a1f" strokeWidth="8" />
          <circle cx="182" cy="176" r="22" fill="none" stroke="url(#rimH)" strokeWidth="2" />
          <circle cx="600" cy="176" r="52" fill="#120b0d" stroke="#2a1a1f" strokeWidth="8" />
          <circle cx="600" cy="176" r="22" fill="none" stroke="url(#rimH)" strokeWidth="2" />
        </svg>

        <div className="relative max-w-[560px] flex-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-black/30 px-3.5 py-1.5 text-xs">
            <span className="live-dot" aria-hidden />
            {next
              ? `СЕЙЧАС В ЭФИРЕ · ${next.meeting_name_ru ?? next.meeting_name_en}`
              : "СЕЙЧАС В ЭФИРЕ"}
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.03] md:text-5xl">
            Сюда просто
            <br />
            тянет заходить
          </h1>
          <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-[#d8c7c6]">
            Смотришь гонку, залипаешь в чат, споришь о стратегии — и время летит. Иногда
            шумно, иногда спокойно, но всегда со своими. Короче, заходи :)
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/schedule" className="cta">Смотреть сейчас</Link>
            <span className="flex items-center gap-2.5 text-[13px] text-[#d8c7c6]">
              <span className="flex">
                {["#C0504E", "#4E7CC0", "#4EA36E"].map((c, k) => (
                  <span key={k} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1d1013] font-display text-[11px] font-semibold text-white" style={{ background: c, marginLeft: k ? -9 : 0 }}>
                    {["А", "М", "К"][k]}
                  </span>
                ))}
              </span>
              <span className="tabular text-white">1 248</span> смотрят
            </span>
          </div>
        </div>

        <div className="relative w-full md:ml-auto md:w-[340px]">
          <TimingPreview />
        </div>
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

      {/* ЧЕМПИОНАТ с логотипами команд */}
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

      {/* 3D БОЛИД */}
      <section className="glow-panel relative flex flex-col items-center gap-7 overflow-hidden rounded-[24px] p-9 shadow-[var(--soft)] md:flex-row md:px-11">
        <div className="max-w-full md:max-w-[40%]">
          <div className="text-xs uppercase tracking-[0.16em] text-mute">болид 2023</div>
          <h3 className="mb-2.5 mt-2.5 font-display text-2xl font-semibold leading-tight">Рассмотри машину в 3D</h3>
          <p className="text-[15px] leading-relaxed text-[#d8c7c6]">Покрути, приблизь антикрыло и диффузор. Реальная модель — прямо в приложении.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-black/30 px-3.5 py-2 text-[13px] text-[#d8c7c6]">перетащи, чтобы повернуть</div>
        </div>
        <svg viewBox="0 0 760 240" className="flex-1" aria-hidden>
          <defs>
            <linearGradient id="rim3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F0705F" /><stop offset="100%" stopColor="#8f2418" /></linearGradient>
            <radialGradient id="g3" cx="50%" cy="82%" r="60%"><stop offset="0%" stopColor="rgba(224,64,47,.45)" /><stop offset="100%" stopColor="rgba(224,64,47,0)" /></radialGradient>
          </defs>
          <ellipse cx="380" cy="200" rx="320" ry="20" fill="url(#g3)" />
          <path d="M100 150 L100 128 Q112 120 150 118 L214 115 Q238 115 250 100 L268 88 L288 88 Q296 100 316 114 L352 114 Q378 100 414 104 Q470 108 512 116 L604 124 Q672 130 700 144 L706 150 Q700 154 660 154 L200 154 Q140 155 100 153 Z" fill="#22161a" stroke="url(#rim3)" strokeWidth="2" />
          <path d="M352 116 Q384 90 416 108" fill="none" stroke="url(#rim3)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="182" cy="176" r="50" fill="#140d0f" stroke="#2a1a1f" strokeWidth="8" /><circle cx="182" cy="176" r="22" fill="none" stroke="url(#rim3)" strokeWidth="2" />
          <circle cx="600" cy="176" r="50" fill="#140d0f" stroke="#2a1a1f" strokeWidth="8" /><circle cx="600" cy="176" r="22" fill="none" stroke="url(#rim3)" strokeWidth="2" />
        </svg>
      </section>

      {/* NEXT RACE */}
      <section className="glow-panel flex flex-wrap items-center justify-between gap-6 rounded-[24px] px-10 py-8 shadow-[var(--soft)]">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-mute">ближайший этап</div>
          <h3 className="mb-1 mt-2 font-display text-2xl font-semibold">
            {next ? next.meeting_name_ru ?? next.meeting_name_en : "Ближайший этап"}
          </h3>
          {next && next.session.starts_at ? (
            <p className="text-sm text-[#d8c7c6]">
              {sessionLabel(next.session.type, next.session.name_ru, next.session.name_en)} ·{" "}
              <SessionTime iso={next.session.starts_at} withZone />
            </p>
          ) : (
            <p className="text-sm text-[#d8c7c6]">Скоро объявим расписание.</p>
          )}
          <TimezoneNote className="mt-1 block text-xs text-mute" />
        </div>
        {next && next.session.starts_at && (
          <div className="flex items-center gap-6">
            <div className="font-display text-xl text-bone">
              через <span className="tabular"><Countdown iso={next.session.starts_at} /></span>
            </div>
            <Link href={`/schedule/${next.round}`} className="cta">К этапу</Link>
          </div>
        )}
      </section>
    </div>
  );
}
