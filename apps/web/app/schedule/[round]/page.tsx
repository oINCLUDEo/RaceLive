import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/Countdown";
import { DataAttribution } from "@/components/DataAttribution";
import { SessionTime } from "@/components/SessionTime";
import { TimezoneNote } from "@/components/TimezoneNote";
import { getMeeting, type MeetingOut } from "@/lib/api";
import { sessionLabel } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: { round: string };
}) {
  try {
    const m = await getMeeting(Number(params.round));
    const name = m.name_ru ?? m.name_en;
    return { title: name, description: `Расписание сессий: ${name}.` };
  } catch {
    return { title: "Этап" };
  }
}

export default async function MeetingPage({
  params,
}: {
  params: { round: string };
}) {
  const round = Number(params.round);
  if (!Number.isFinite(round)) notFound();

  let m: MeetingOut;
  try {
    m = await getMeeting(round);
  } catch {
    notFound();
  }

  const now = Date.now();

  return (
    <div>
      <Link href="/schedule" className="text-sm text-mute hover:text-bone">
        ← Расписание
      </Link>

      <h1 className="mt-3 font-display text-3xl font-semibold">
        {m.name_ru ?? m.name_en}
      </h1>
      <p className="mt-2 text-mute">
        Этап {m.round}
        {m.circuit
          ? ` · ${m.circuit.name_ru ?? m.circuit.name_en}${
              m.circuit.country ? `, ${m.circuit.country}` : ""
            }`
          : ""}
      </p>

      <div className="mt-8 border border-line">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2 text-xs uppercase tracking-wide text-mute">
          <span>Сессии</span>
          <TimezoneNote className="normal-case tracking-normal" />
        </div>
        {m.sessions.map((s, idx) => {
          const upcoming = s.starts_at && new Date(s.starts_at).getTime() > now;
          return (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 last:border-0"
            >
              <span className="min-w-[160px] flex-1 font-medium">
                {sessionLabel(s.type, s.name_ru, s.name_en)}
              </span>
              <span className="tabular text-sm text-mute">
                <SessionTime iso={s.starts_at} withZone />
              </span>
              {upcoming && s.starts_at && (
                <span className="tabular min-w-[120px] text-right text-sm text-bone">
                  через <Countdown iso={s.starts_at} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <DataAttribution />
    </div>
  );
}
