import { Link } from "next-view-transitions";
import { Countdown } from "@/components/Countdown";
import { Flag } from "@/components/Flag";
import { DateRange } from "@/components/DateRange";
import { SeasonHeader } from "@/components/SeasonHeader";
import { SessionTime } from "@/components/SessionTime";
import { TimezoneNote } from "@/components/TimezoneNote";
import { TrackMap } from "@/components/TrackMap";
import { getSchedule, type MeetingOut } from "@/lib/api";
import { sessionLabel } from "@/lib/format";

export const metadata = {
  title: "Расписание сезона",
  description: "Календарь этапов и сессий автогоночного сезона в вашем часовом поясе.",
};

// Карточка этапа в сетке календаря: названия не режем, схема трассы — фоном справа.
function Card({ m, past }: { m: MeetingOut; past?: boolean }) {
  return (
    <Link
      href={`/schedule/${m.round}`}
      className={`card-soft group relative flex min-h-[132px] flex-col justify-between gap-3 overflow-hidden p-4 transition-colors hover:bg-surface-2 ${past ? "opacity-60 hover:opacity-100" : ""}`}
    >
      <TrackMap circuit={m.circuit?.key} size={96} className="pointer-events-none absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.16] transition-opacity group-hover:opacity-30" />
      <span className="relative flex items-center gap-2.5 text-xs text-mute">
        <Flag code={m.circuit?.country_code ?? null} w={26} />
        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-display font-semibold">Этап {m.round}</span>
        <span className="ml-auto text-bone">
          <DateRange from={m.starts_at} to={m.ends_at} />
        </span>
      </span>
      <span className="relative pr-10">
        <span className="block font-display text-base font-semibold leading-snug">{m.name_ru ?? m.name_en}</span>
        <span className="mt-0.5 block text-sm text-mute">
          {m.circuit?.name_ru ?? m.circuit?.name_en}
          {m.circuit?.country ? ` · ${m.circuit.country}` : ""}
        </span>
      </span>
    </Link>
  );
}

// Ближайший этап крупно: даты, отсчёт, все сессии по местному времени и схема трассы.
function NextUp({ m }: { m: MeetingOut }) {
  const first = m.sessions.find((x) => x.starts_at && new Date(x.starts_at).getTime() > Date.now()) ?? m.sessions[0];
  return (
    <section className="card-soft relative overflow-hidden">
      <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-mute">
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--ember-soft)] px-2 py-0.5 text-[var(--ember)]">
              <span className="live-dot" aria-hidden /> Ближайший
            </span>
            <span>Этап {m.round}</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Flag code={m.circuit?.country_code ?? null} w={36} />
            <h2 className="font-display text-2xl font-semibold leading-tight">{m.name_ru ?? m.name_en}</h2>
          </div>
          <div className="mt-1.5 text-sm text-mute">
            {m.circuit?.name_ru ?? m.circuit?.name_en}
            {m.circuit?.country ? ` · ${m.circuit.country}` : ""} · <DateRange from={m.starts_at} to={m.ends_at} />
          </div>
          {first?.starts_at && (
            <div className="mt-4 text-sm">
              <span className="text-mute">{sessionLabel(first.type, first.name_ru, first.name_en)} через </span>
              <span className="tabular font-display font-semibold text-[var(--ember)]">
                <Countdown iso={first.starts_at} />
              </span>
            </div>
          )}
          <Link href={`/schedule/${m.round}`} className="cta mt-5 inline-flex">
            Открыть этап
          </Link>
        </div>

        <ol className="flex flex-col divide-y divide-[var(--line)] rounded-2xl border border-line bg-surface-0/40">
          {m.sessions.map((x) => {
            const done = x.starts_at != null && new Date(x.starts_at).getTime() < Date.now();
            return (
              <li key={x.type + x.starts_at} className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${done ? "text-mute" : ""}`}>
                <span className={x.type === "race" ? "font-display font-semibold" : ""}>{sessionLabel(x.type, x.name_ru, x.name_en)}</span>
                <span className="text-right text-mute">
                  <SessionTime iso={x.starts_at} />
                </span>
              </li>
            );
          })}
        </ol>

        <TrackMap circuit={m.circuit?.key} size={200} className="mx-auto hidden opacity-90 lg:block" />
      </div>
    </section>
  );
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { season?: string };
}) {
  const season = searchParams.season ? Number(searchParams.season) : undefined;

  let meetings: MeetingOut[] = [];
  let error = false;
  try {
    meetings = await getSchedule(season);
  } catch {
    error = true;
  }

  const now = Date.now();
  // Прошёл — когда закончился (идущий уик-энд остаётся «ближайшим»).
  const isPast = (m: MeetingOut) => {
    const end = m.ends_at ?? m.starts_at;
    return end != null && new Date(end).getTime() < now;
  };
  const past = meetings.filter(isPast);
  const upcoming = meetings.filter((m) => !isPast(m));

  return (
    <div className="flex flex-col gap-6">
      <SeasonHeader note={<TimezoneNote />} />

      {error && (
        <div className="card-soft p-5 text-sm text-mute">
          Не удалось загрузить расписание. Источник данных временно недоступен — попробуйте позже.
        </div>
      )}

      {!error && meetings.length === 0 && (
        <div className="card-soft p-5 text-sm text-mute">На выбранный сезон этапов пока нет.</div>
      )}

      {upcoming.length > 0 && (
        <>
          <NextUp m={upcoming[0]} />
          {upcoming.length > 1 && (
            <div>
              <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-mute">
                Дальше · {upcoming.length - 1}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 min-[1700px]:grid-cols-4">
                {upcoming.slice(1).map((m) => (
                  <Card key={m.round} m={m} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {past.length > 0 && (
        <details className="group" open={upcoming.length === 0}>
          <summary className="mb-3 flex cursor-pointer list-none items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-mute">
            Прошедшие · {past.length}
            <span className="text-xs transition-transform group-open:rotate-180">▾</span>
          </summary>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 min-[1700px]:grid-cols-4">
            {[...past].reverse().map((m) => (
              <Card key={m.round} m={m} past />
            ))}
          </div>
        </details>
      )}

      <p className="text-xs text-mute">Источник данных: Jolpica / Ergast.</p>
    </div>
  );
}
