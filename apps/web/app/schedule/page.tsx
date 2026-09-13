import Link from "next/link";
import { SessionTime } from "@/components/SessionTime";
import { TimezoneNote } from "@/components/TimezoneNote";
import { getSchedule, type MeetingOut } from "@/lib/api";

export const metadata = {
  title: "Расписание сезона",
  description: "Календарь этапов и сессий автогоночного сезона в вашем часовом поясе.",
};

function nextRound(meetings: MeetingOut[]): number | null {
  const now = Date.now();
  for (const m of meetings) {
    if (m.starts_at && new Date(m.starts_at).getTime() > now) return m.round;
  }
  return null;
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
  const upcoming = nextRound(meetings);

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
          Не удалось загрузить расписание. Источник данных временно недоступен — попробуйте
          обновить страницу позже.
        </div>
      )}

      {!error && meetings.length === 0 && (
        <div className="card-soft p-5 text-sm text-mute">
          На выбранный сезон этапов пока нет.
        </div>
      )}

      {meetings.length > 0 && (
        <div className="card-soft overflow-hidden">
          {meetings.map((m, idx) => {
            const isNext = m.round === upcoming;
            return (
              <Link
                key={m.round}
                href={`/schedule/${m.round}`}
                className={`flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2 ${idx < meetings.length - 1 ? "border-b border-line" : ""}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 font-display text-sm font-semibold text-mute">
                  {m.round}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-display font-semibold">
                      {m.name_ru ?? m.name_en}
                    </span>
                    {isNext && (
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
                <span className="shrink-0 text-right text-sm text-mute">
                  <span className="block">
                    <SessionTime iso={m.starts_at} mode="date" />
                  </span>
                  <span className="mt-0.5 block text-xs text-disabled">
                    {m.sessions.length} сессий
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-xs text-mute">Источник данных: Jolpica / Ergast.</p>
    </div>
  );
}
