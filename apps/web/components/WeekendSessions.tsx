import { Link } from "next-view-transitions";
import { Countdown } from "@/components/Countdown";
import { Flag } from "@/components/Flag";
import { SessionTime } from "@/components/SessionTime";
import { TrackMap } from "@/components/TrackMap";
import type { MeetingOut } from "@/lib/api";
import { sessionLabel } from "@/lib/format";

// Примерная длительность сессий (мин) — чтобы понять «идёт / завершена» по расписанию.
const DURATION: Record<string, number> = { race: 120, sprint: 60, sprint_qualifying: 45, sprint_shootout: 45 };
const durMin = (type: string) => DURATION[type] ?? 60;

// Расписание уик-энда: все сессии этапа по времени зрителя, со статусами. Это реальные
// данные расписания — в отличие от тайминга, они совпадают с тем, что идёт на экране.
export function WeekendSessions({ meeting }: { meeting: MeetingOut }) {
  const now = Date.now();
  const rows = meeting.sessions.map((s) => {
    const t = s.starts_at ? new Date(s.starts_at).getTime() : null;
    const live = t != null && now >= t && now < t + durMin(s.type) * 60_000;
    const done = t != null && now >= t + durMin(s.type) * 60_000;
    return { s, t, live, done };
  });
  const nextIdx = rows.findIndex((r) => r.t != null && r.t > now);

  return (
    <div className="card-soft overflow-hidden">
      <Link href={`/schedule/${meeting.round}`} className="flex items-center gap-3 border-b border-line px-5 py-4 hover:bg-surface-2">
        <TrackMap circuit={meeting.circuit?.key} size={44} className="shrink-0 opacity-80" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-mute">
            <Flag code={meeting.circuit?.country_code ?? null} w={18} /> Этап {meeting.round}
          </div>
          <div className="truncate font-display font-semibold">{meeting.name_ru ?? meeting.name_en}</div>
        </div>
        <span className="shrink-0 text-sm text-mute">к этапу →</span>
      </Link>

      <ul>
        {rows.map((r, i) => {
          const isNext = i === nextIdx;
          return (
            <li
              key={`${r.s.type}-${i}`}
              className={`flex items-center gap-3 px-5 py-3 ${i < rows.length - 1 ? "border-b border-line" : ""}`}
              style={
                r.live
                  ? { background: "linear-gradient(90deg, var(--ember-soft), transparent 70%)" }
                  : isNext
                    ? { background: "linear-gradient(90deg, var(--accent2-soft), transparent 70%)" }
                    : undefined
              }
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: r.live ? "var(--ember)" : isNext ? "var(--accent2)" : r.done ? "var(--disabled)" : "var(--line-strong)" }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm font-medium ${r.done ? "text-mute" : "text-bone"}`}>
                  {sessionLabel(r.s.type, r.s.name_ru, r.s.name_en)}
                </div>
                <div className="text-xs text-mute">
                  <SessionTime iso={r.s.starts_at} />
                </div>
              </div>
              {r.live ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--ember)" }}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> идёт
                </span>
              ) : isNext && r.s.starts_at ? (
                <span className="shrink-0 text-right text-xs" style={{ color: "var(--accent2)" }}>
                  через <Countdown iso={r.s.starts_at} />
                </span>
              ) : r.done ? (
                <span className="shrink-0 text-[11px] uppercase tracking-wide text-mute">завершена</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
