import { Link } from "next-view-transitions";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/Countdown";
import { Flag } from "@/components/Flag";
import { SessionTime } from "@/components/SessionTime";
import { ShareButton } from "@/components/ShareButton";
import { TeamLogo } from "@/components/TeamLogo";
import { TimezoneNote } from "@/components/TimezoneNote";
import { TrackMap } from "@/components/TrackMap";
import { WeekendForecast } from "@/components/WeekendForecast";
import {
  getMeeting,
  getQualifyingResults,
  getRaceResults,
  getWeekendForecast,
  type QualifyingResultOut,
  type RaceResultOut,
  type WeekendForecastOut,
} from "@/lib/api";
import { sessionLabel, statusCode, statusRu } from "@/lib/format";
import { SITE_URL } from "@/lib/seo";
import { TEAMS } from "@/lib/teams";

// ISR: страница кэшируется на 5 минут (повторные открытия — мгновенные), данные
// обновляются в фоне. Отсчёты на странице клиентские, так что не устаревают.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { round: string };
}) {
  try {
    const m = await getMeeting(Number(params.round));
    const name = m.name_ru ?? m.name_en;
    const circuit = m.circuit?.name_ru ?? m.circuit?.name_en;
    const description = `${name}${circuit ? ` · ${circuit}` : ""}: расписание сессий, результаты гонки и квалификации, время по вашему часовому поясу.`;
    return {
      title: name,
      description,
      alternates: { canonical: `/schedule/${params.round}` },
      openGraph: { title: name, description },
    };
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

  // все запросы параллельно (не последовательно) — быстрее открытие
  const [m, results, qualifying, forecast] = await Promise.all([
    getMeeting(round).catch(() => null),
    getRaceResults(round).catch(() => [] as RaceResultOut[]),
    getQualifyingResults(round).catch(() => [] as QualifyingResultOut[]),
    getWeekendForecast(round).catch(() => null as WeekendForecastOut | null),
  ]);
  if (!m) notFound();
  const now = Date.now();

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: m.name_ru ?? m.name_en,
    sport: "Formula 1",
    ...(m.starts_at ? { startDate: m.starts_at } : {}),
    ...(m.ends_at ? { endDate: m.ends_at } : {}),
    ...(m.circuit
      ? {
          location: {
            "@type": "Place",
            name: m.circuit.name_ru ?? m.circuit.name_en,
            ...(m.circuit.country ? { address: m.circuit.country } : {}),
          },
        }
      : {}),
    url: `${SITE_URL}/schedule/${m.round}`,
  };

  return (
    <div className="flex flex-col gap-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
      <div>
        <div className="flex items-center justify-between gap-3">
          <Link href="/schedule" className="text-sm text-mute hover:text-bone">
            ← Расписание
          </Link>
          <ShareButton title={m.name_ru ?? m.name_en} />
        </div>
        <div className="mt-4 flex items-center gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-mute">
              <Flag code={m.circuit?.country_code ?? null} w={26} />
              этап {m.round}
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold">
              {m.name_ru ?? m.name_en}
            </h1>
            {m.circuit && (
              <p className="mt-2 text-mute">
                <Link href={`/tracks/${m.circuit.key}`} className="hover:text-bone">
                  {m.circuit.name_ru ?? m.circuit.name_en}
                </Link>
                {m.circuit.country ? ` · ${m.circuit.country}` : ""}
              </p>
            )}
          </div>
          <TrackMap circuit={m.circuit?.key} size={132} className="hidden shrink-0 opacity-80 sm:block" />
        </div>
      </div>

      {results.length > 0 && (
        <div className="card-soft overflow-hidden">
          <div className="border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-mute">
            Итоги гонки
          </div>
          {results.map((r, i) => {
            const color = (r.team_slug ? TEAMS[r.team_slug]?.color : undefined) ?? "var(--line)";
            return (
              <div
                key={r.code || r.position}
                className={`team-row grid grid-cols-[26px_4px_28px_1fr_auto] items-center gap-3 px-5 py-2.5 sm:grid-cols-[26px_4px_28px_1fr_auto_auto] ${i < results.length - 1 ? "border-b border-line" : ""} ${r.position === 1 ? "bg-surface-2" : ""}`}
                style={{ "--row": color } as React.CSSProperties}
              >
                <span className="tabular text-mute">{r.position}</span>
                <span className="h-6 w-[4px] rounded-full" style={{ background: color }} />
                <TeamLogo slug={r.team_slug ?? ""} size={26} />
                <Link href={`/drivers/${r.driver_id}`} className="truncate hover:text-[var(--accent2)]">
                  {r.name_ru ?? r.name_en}
                </Link>
                <span
                  className="tabular hidden text-right text-sm text-mute sm:block"
                  title={r.time ? undefined : statusRu(r.status)}
                >
                  {r.time ?? statusCode(r.status)}
                </span>
                <span className="tabular text-right font-display font-semibold">{r.points}</span>
              </div>
            );
          })}
        </div>
      )}

      {qualifying.length > 0 && (
        <details className="card-soft group overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-xs uppercase tracking-wide text-mute">
            <span>Квалификация</span>
            <span className="text-[10px] transition-transform group-open:rotate-180">▾</span>
          </summary>
          <div className="border-t border-line">
          {qualifying.map((r, i) => {
            const color = (r.team_slug ? TEAMS[r.team_slug]?.color : undefined) ?? "var(--line)";
            const best = r.q3 ?? r.q2 ?? r.q1;
            return (
              <div
                key={r.code || r.position}
                className={`team-row grid grid-cols-[26px_4px_28px_1fr_auto] items-center gap-3 px-5 py-2.5 ${i < qualifying.length - 1 ? "border-b border-line" : ""} ${r.position === 1 ? "bg-surface-2" : ""}`}
                style={{ "--row": color } as React.CSSProperties}
              >
                <span className="tabular text-mute">{r.position}</span>
                <span className="h-6 w-[4px] rounded-full" style={{ background: color }} />
                <TeamLogo slug={r.team_slug ?? ""} size={26} />
                <Link href={`/drivers/${r.driver_id}`} className="truncate hover:text-[var(--accent2)]">
                  {r.name_ru ?? r.name_en}
                </Link>
                <span className="tabular text-right text-sm">{best ?? "—"}</span>
              </div>
            );
          })}
          </div>
        </details>
      )}

      {forecast && <WeekendForecast data={forecast} />}

      <div className="card-soft overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-mute">
          <span>Сессии</span>
          <TimezoneNote className="normal-case tracking-normal" />
        </div>
        {m.sessions.map((s, idx) => {
          const upcoming = s.starts_at && new Date(s.starts_at).getTime() > now;
          return (
            <div
              key={idx}
              className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 ${idx < m.sessions.length - 1 ? "border-b border-line" : ""}`}
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

      <p className="text-xs text-mute">Источник данных: Jolpica / Ergast.</p>
    </div>
  );
}
