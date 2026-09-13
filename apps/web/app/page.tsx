import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { DataAttribution } from "@/components/DataAttribution";
import { SessionTime } from "@/components/SessionTime";
import { TimezoneNote } from "@/components/TimezoneNote";
import { TimingPreview } from "@/components/TimingPreview";
import {
  getNextSession,
  getSchedule,
  type NextSessionOut,
} from "@/lib/api";
import { sessionLabel } from "@/lib/format";

export default async function HomePage() {
  const [next, meetingsCount] = await Promise.all([
    getNextSession().catch(() => null as NextSessionOut | null),
    getSchedule()
      .then((m) => m.length)
      .catch(() => null as number | null),
  ]);

  return (
    <div>
      {/* Герой — маркетинг-зона: драматичная «сцена» + живой тайминг поверх */}
      <section className="hero-stage rounded-overlay border border-line px-6 py-14 md:px-12 md:py-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-mute">
              <span className="h-px w-7 bg-[var(--ember)]" />
              Живой тайминг · русская локализация
            </div>

            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
              Живой тайминг
              <br />
              на русском языке
            </h1>

            <p className="mt-6 max-w-prose text-[17px] leading-relaxed text-mute">
              Позиции, интервалы, шины и телеметрия в реальном времени. Русские имена,
              трассы и сообщения рейс-контроля. Без стены на входе.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/schedule"
                className="cta-ember rounded-control px-6 py-3 text-sm font-semibold"
              >
                Открыть расписание
              </Link>
              <Link
                href="/schedule"
                className="rounded-control px-4 py-3 text-sm text-mute underline-offset-4 transition-colors hover:text-bone hover:underline"
              >
                Календарь сезона →
              </Link>
            </div>
          </div>

          <div className="md:justify-self-end md:w-[400px]">
            <TimingPreview />
          </div>
        </div>
      </section>

      {/* Стат-строка — крупные числа, премиальный ритм */}
      <section className="mt-px grid grid-cols-1 divide-y divide-line border-x border-b border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat value={meetingsCount ? String(meetingsCount) : "—"} label="этапов в сезоне" />
        <Stat value="5" label="типов сессий" />
        <Stat value="0 ₽" label="вход без регистрации" />
      </section>

      {/* Ближайшая сессия — данные, строгий «Оксид», без ember */}
      {next && next.session.starts_at ? (
        <section className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-sm">
          <div className="text-mute">
            Ближайшая сессия:{" "}
            <span className="text-bone">
              {sessionLabel(next.session.type, next.session.name_ru, next.session.name_en)}
            </span>{" "}
            · {next.meeting_name_ru ?? next.meeting_name_en}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-mute">
              <SessionTime iso={next.session.starts_at} withZone />
            </span>
            <span className="text-bone">
              через <Countdown iso={next.session.starts_at} />
            </span>
            <Link
              href={`/schedule/${next.round}`}
              className="text-mute underline-offset-4 hover:text-bone hover:underline"
            >
              к этапу
            </Link>
          </div>
          <TimezoneNote className="basis-full text-xs text-mute" />
        </section>
      ) : (
        <section className="mt-10 border-t border-line pt-6 text-sm text-mute">
          Расписание ближайших сессий появится здесь. Открой{" "}
          <Link href="/schedule" className="text-bone underline underline-offset-4">
            расписание
          </Link>
          .
        </section>
      )}

      <DataAttribution />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-6 py-7">
      <div className="tabular font-display text-4xl font-semibold leading-none md:text-5xl">
        {value}
      </div>
      <div className="mt-2 text-xs uppercase tracking-wide text-mute">{label}</div>
    </div>
  );
}
