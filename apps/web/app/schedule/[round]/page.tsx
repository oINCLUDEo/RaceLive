import { Link } from "next-view-transitions";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/Countdown";
import { Flag } from "@/components/Flag";
import { SessionTime } from "@/components/SessionTime";
import { ShareButton } from "@/components/ShareButton";
import { TeamLogo } from "@/components/TeamLogo";
import { Tabs } from "@/components/Tabs";
import { TimezoneNote } from "@/components/TimezoneNote";
import { TrackMap } from "@/components/TrackMap";
import { WeekendForecast } from "@/components/WeekendForecast";
import {
  type MeetingOut,
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
            <div className="eyebrow flex items-center gap-2">
              <Flag code={m.circuit?.country_code ?? null} w={26} />
              Этап {m.round}
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        {/* ОСНОВНОЕ: результаты (гонка/квалификация) или, до гонки, сессии уик-энда */}
        <div className="flex min-w-0 flex-col gap-5">
          {results.length > 0 || qualifying.length > 0 ? (
            <Tabs
              tabs={[
                ...(results.length > 0 ? [{ id: "race", label: "Гонка", content: <RaceTable rows={results} /> }] : []),
                ...(qualifying.length > 0 ? [{ id: "quali", label: "Квалификация", content: <QualiTable rows={qualifying} /> }] : []),
              ]}
              right={results.length > 0 ? <span className="text-xs text-mute">▲▼ — позиции со старта</span> : undefined}
            />
          ) : (
            <Sessions m={m} now={now} />
          )}
        </div>

        {/* СБОКУ: сессии (если есть результаты) и погода */}
        <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-4">
          {(results.length > 0 || qualifying.length > 0) && <Sessions m={m} now={now} compact />}
          {forecast && <WeekendForecast data={forecast} />}
        </div>
      </div>

      <p className="text-xs text-mute">Источник данных: Jolpica / Ergast.</p>
    </div>
  );
}

const colorOf = (slug: string | null) => (slug ? TEAMS[slug]?.color : undefined) ?? "var(--line)";

// Итоги гонки: позиция, изменение со старта (данные — в цвете), время/статус, очки.
function RaceTable({ rows }: { rows: RaceResultOut[] }) {
  return (
    <div>
      {rows.map((r, i) => {
        const color = colorOf(r.team_slug);
        const delta = r.grid > 0 ? r.grid - r.position : null;
        const result = r.time ?? statusCode(r.status);
        return (
          <div
            key={r.code || r.position}
            className={`team-row grid grid-cols-[26px_4px_28px_minmax(0,1fr)_36px_32px] items-center gap-3 px-4 py-2.5 sm:grid-cols-[26px_4px_28px_minmax(0,1fr)_40px_120px_36px] sm:px-5 ${i < rows.length - 1 ? "border-b border-line" : ""} ${r.position === 1 ? "bg-surface-2" : ""}`}
            style={{ "--row": color } as React.CSSProperties}
          >
            <span className="tabular text-mute">{r.position}</span>
            <span className="h-6 w-[4px] rounded-full" style={{ background: color }} />
            <TeamLogo slug={r.team_slug ?? ""} size={26} />
            <span className="min-w-0">
              <Link href={`/drivers/${r.driver_id}`} className="block truncate hover:text-[var(--accent2)]">
                {r.name_ru ?? r.name_en}
              </Link>
              {/* на телефоне время/статус — под именем */}
              <span className="tabular block truncate text-xs text-mute sm:hidden" title={r.time ? undefined : statusRu(r.status)}>
                {result} · {r.team_name}
              </span>
              <span className="hidden truncate text-xs text-mute sm:block">{r.team_name}</span>
            </span>
            <span
              className="tabular text-right text-xs"
              style={{ color: delta == null || delta === 0 ? "var(--mute)" : delta > 0 ? "var(--green)" : "var(--red)" }}
              title={r.grid > 0 ? `Старт: ${r.grid}` : "Старт с пит-лейна"}
            >
              {delta == null ? "пит" : delta === 0 ? "=" : delta > 0 ? `▲${delta}` : `▼${-delta}`}
            </span>
            <span className="tabular hidden text-right text-sm text-mute sm:block" title={r.time ? undefined : statusRu(r.status)}>
              {result}
            </span>
            <span className="tabular text-right font-display font-semibold">{r.points || <span className="text-mute">—</span>}</span>
          </div>
        );
      })}
    </div>
  );
}

// Квалификация: Q1/Q2/Q3 на широком экране, лучший круг — на телефоне.
function QualiTable({ rows }: { rows: QualifyingResultOut[] }) {
  return (
    <div>
      <div className="eyebrow hidden grid-cols-[26px_4px_28px_minmax(0,1fr)_84px_84px_84px] gap-3 border-b border-line px-5 py-2 md:grid">
        <span>#</span>
        <span />
        <span />
        <span />
        <span className="text-right">Q1</span>
        <span className="text-right">Q2</span>
        <span className="text-right">Q3</span>
      </div>
      {rows.map((r, i) => {
        const color = colorOf(r.team_slug);
        const best = r.q3 ?? r.q2 ?? r.q1;
        return (
          <div
            key={r.code || r.position}
            className={`team-row grid grid-cols-[26px_4px_28px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 sm:px-5 md:grid-cols-[26px_4px_28px_minmax(0,1fr)_84px_84px_84px] ${i < rows.length - 1 ? "border-b border-line" : ""} ${r.position === 1 ? "bg-surface-2" : ""}`}
            style={{ "--row": color } as React.CSSProperties}
          >
            <span className="tabular text-mute">{r.position}</span>
            <span className="h-6 w-[4px] rounded-full" style={{ background: color }} />
            <TeamLogo slug={r.team_slug ?? ""} size={26} />
            <span className="min-w-0">
              <Link href={`/drivers/${r.driver_id}`} className="block truncate hover:text-[var(--accent2)]">
                {r.name_ru ?? r.name_en}
              </Link>
              <span className="block truncate text-xs text-mute">{r.team_name}</span>
            </span>
            <span className="tabular text-right text-sm md:hidden">{best ?? "—"}</span>
            {[r.q1, r.q2, r.q3].map((q, k) => (
              <span key={k} className={`tabular hidden text-right text-sm md:block ${q && q === best ? "text-bone" : "text-mute"}`}>
                {q ?? "—"}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Sessions({ m, now, compact = false }: { m: MeetingOut; now: number; compact?: boolean }) {
  return (
    <div className="card-soft overflow-hidden">
      <div className="eyebrow flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <span>Сессии</span>
        <TimezoneNote className="normal-case tracking-normal" />
      </div>
      {m.sessions.map((s, idx) => {
        const upcoming = s.starts_at && new Date(s.starts_at).getTime() > now;
        return (
          <div
            key={idx}
            className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 ${idx < m.sessions.length - 1 ? "border-b border-line" : ""} ${upcoming ? "" : "text-mute"}`}
          >
            <span className={`min-w-[140px] flex-1 ${s.type === "race" ? "font-display font-semibold" : "font-medium"}`}>
              {sessionLabel(s.type, s.name_ru, s.name_en)}
            </span>
            <span className="tabular text-sm text-mute">
              <SessionTime iso={s.starts_at} withZone={!compact} />
            </span>
            {upcoming && s.starts_at && !compact && (
              <span className="tabular min-w-[120px] text-right text-sm text-bone">
                через <Countdown iso={s.starts_at} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
