import { Link } from "next-view-transitions";
import { Countdown } from "@/components/Countdown";
import { Flag } from "@/components/Flag";
import { SessionTime } from "@/components/SessionTime";
import { TimezoneNote } from "@/components/TimezoneNote";
import { getSchedule, type MeetingOut } from "@/lib/api";

export const metadata = {
  title: "Расписание сезона",
  description: "Календарь этапов и сессий автогоночного сезона в вашем часовом поясе.",
};

function Row({ m, next, past }: { m: MeetingOut; next?: boolean; past?: boolean }) {
  return (
    <Link
      href={`/schedule/${m.round}`}
      className={`flex items-center gap-4 border-b border-line px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2 ${past ? "opacity-55" : ""}`}
    >
      <Flag code={m.circuit?.country_code ?? null} w={34} />
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 font-display text-sm font-semibold text-mute">
        {m.round}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-display font-semibold">{m.name_ru ?? m.name_en}</span>
          {next && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--ember-soft)] px-2 py-0.5 text-[11px] text-[var(--ember)]">
              <span className="live-dot" aria-hidden />
              ближайший
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-sm text-mute">
          {m.circuit?.name_ru ?? m.circuit?.name_en}
          {m.circuit?.country ? ` · ${m.circuit.country}` : ""}
        </span>
      </span>
      <span className="shrink-0 text-right text-sm">
        <span className="block text-mute"><SessionTime iso={m.starts_at} mode="date" /></span>
        {next && m.starts_at ? (
          <span className="tabular mt-0.5 block text-xs text-[var(--ember)]"><Countdown iso={m.starts_at} /></span>
        ) : (
          <span className="mt-0.5 block text-xs text-disabled">{m.sessions.length} сессий</span>
        )}
      </span>
    </Link>
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
  const isPast = (m: MeetingOut) => m.starts_at != null && new Date(m.starts_at).getTime() < now;
  const past = meetings.filter(isPast);
  const upcoming = meetings.filter((m) => !isPast(m));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-mute">календарь</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Расписание сезона</h1>
        <p className="mt-2 text-sm text-mute">
          <TimezoneNote />
        </p>
      </div>

      {error && (
        <div className="card-soft p-5 text-sm text-mute">
          Не удалось загрузить расписание. Источник данных временно недоступен — попробуйте позже.
        </div>
      )}

      {!error && meetings.length === 0 && (
        <div className="card-soft p-5 text-sm text-mute">На выбранный сезон этапов пока нет.</div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-mute">
            Впереди
          </h2>
          <div className="card-soft overflow-hidden">
            {upcoming.map((m, i) => (
              <Row key={m.round} m={m} next={i === 0} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <details className="group" open={upcoming.length === 0}>
          <summary className="mb-3 flex cursor-pointer list-none items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-mute">
            Прошедшие · {past.length}
            <span className="text-xs transition-transform group-open:rotate-180">▾</span>
          </summary>
          <div className="card-soft overflow-hidden">
            {past.map((m) => (
              <Row key={m.round} m={m} past />
            ))}
          </div>
        </details>
      )}

      <p className="text-xs text-mute">Источник данных: Jolpica / Ergast.</p>
    </div>
  );
}
