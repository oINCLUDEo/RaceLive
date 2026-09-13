import Link from "next/link";
import { DataAttribution } from "@/components/DataAttribution";
import { SessionTime } from "@/components/SessionTime";
import { TimezoneNote } from "@/components/TimezoneNote";
import { getSchedule, type MeetingOut } from "@/lib/api";

export const metadata = {
  title: "Расписание сезона",
  description: "Календарь этапов и сессий автогоночного сезона в вашем часовом поясе.",
};

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

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Расписание</h1>
      <p className="mt-2 text-mute">
        <TimezoneNote />
      </p>

      {error && (
        <div className="mt-8 border border-line bg-surface-1 p-4 text-sm text-mute">
          Не удалось загрузить расписание. Источник данных временно недоступен —
          попробуйте обновить страницу позже.
        </div>
      )}

      {!error && meetings.length === 0 && (
        <div className="mt-8 border border-line bg-surface-1 p-4 text-sm text-mute">
          На выбранный сезон этапов пока нет.
        </div>
      )}

      {meetings.length > 0 && (
        <div className="mt-8 border border-line">
          {meetings.map((m) => (
            <Link
              key={m.round}
              href={`/schedule/${m.round}`}
              className="flex items-center gap-4 border-b border-line px-4 py-3 transition-colors last:border-0 hover:bg-surface-1"
            >
              <span className="tabular w-8 shrink-0 text-mute">{m.round}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {m.name_ru ?? m.name_en}
                </span>
                <span className="block truncate text-sm text-mute">
                  {m.circuit?.name_ru ?? m.circuit?.name_en}
                  {m.circuit?.country ? ` · ${m.circuit.country}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-right text-sm text-mute">
                <SessionTime iso={m.starts_at} mode="date" />
              </span>
            </Link>
          ))}
        </div>
      )}

      <DataAttribution />
    </div>
  );
}
