import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { DataAttribution } from "@/components/DataAttribution";
import { SessionTime } from "@/components/SessionTime";
import { TimingPreview } from "@/components/TimingPreview";
import { getNextSession, type NextSessionOut } from "@/lib/api";
import { sessionLabel } from "@/lib/format";

export default async function HomePage() {
  let next: NextSessionOut | null = null;
  try {
    next = await getNextSession();
  } catch {
    next = null;
  }

  return (
    <div>
      <section className="grid items-center gap-10 py-8 md:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
            Живой тайминг
            <br />
            на русском языке
          </h1>
          <p className="mt-5 max-w-prose text-mute">
            Позиции, интервалы, шины и телеметрия в реальном времени. Русские имена,
            трассы и сообщения рейс-контроля. Без стены на входе.
          </p>
          <div className="mt-7 flex gap-3">
            <Link
              href="/schedule"
              className="rounded-control bg-bone px-5 py-2.5 text-sm font-semibold text-surface-0 transition-opacity hover:opacity-90"
            >
              Открыть расписание
            </Link>
          </div>
        </div>

        <div className="md:justify-self-end md:w-[380px]">
          <TimingPreview />
        </div>
      </section>

      {next && next.session.starts_at && (
        <section className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-sm">
          <div className="text-mute">
            Ближайшая сессия:{" "}
            <span className="text-bone">
              {sessionLabel(
                next.session.type,
                next.session.name_ru,
                next.session.name_en,
              )}
            </span>{" "}
            · {next.meeting_name_ru ?? next.meeting_name_en}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-mute">
              <SessionTime iso={next.session.starts_at} />
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
        </section>
      )}

      {!next && (
        <section className="mt-4 border-t border-line pt-5 text-sm text-mute">
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
