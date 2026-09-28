import { Link } from "next-view-transitions";
import { FavoriteStar } from "@/components/FavoriteStar";
import { SeasonHeader } from "@/components/SeasonHeader";
import { TeamLogo } from "@/components/TeamLogo";
import {
  getConstructorStandings,
  getDriverStandings,
  type ConstructorStandingOut,
  type DriverStandingOut,
} from "@/lib/api";
import { TEAMS } from "@/lib/teams";

// force-dynamic (а не ISR): статик-пререндер на билде дал бы пустую страницу до
// первой ревалидации (API недоступен во время сборки). API-данные кэшируются в Redis.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Зачёт сезона",
  description:
    "Личный зачёт пилотов и Кубок конструкторов Формулы-1: очки, победы и отставания по ходу сезона.",
  alternates: { canonical: "/standings" },
};

function colorOf(slug: string | null): string {
  return (slug ? TEAMS[slug]?.color : undefined) ?? "var(--line)";
}

const GRID = "grid grid-cols-[26px_4px_28px_minmax(0,1fr)_44px_64px] items-center gap-3 sm:grid-cols-[26px_4px_28px_minmax(0,1fr)_44px_56px_64px]";

function Head() {
  return (
    <div className={`${GRID} border-b border-line px-5 py-2 text-[11px] uppercase tracking-[0.14em] text-mute`}>
      <span>#</span>
      <span />
      <span />
      <span />
      <span className="text-right">Побед</span>
      <span className="hidden text-right sm:block" title="Отставание от соседа выше">Разрыв</span>
      <span className="text-right">Очки</span>
    </div>
  );
}

function Bar({ pts, leader, color }: { pts: number; leader: number; color: string }) {
  return (
    <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-surface-2">
      <span className="block h-full rounded-full" style={{ width: `${Math.max(2, (pts / (leader || 1)) * 100)}%`, background: color }} />
    </span>
  );
}

export default async function StandingsPage() {
  const [drivers, constructors] = await Promise.all([
    getDriverStandings().catch(() => [] as DriverStandingOut[]),
    getConstructorStandings().catch(() => [] as ConstructorStandingOut[]),
  ]);
  const leaderD = drivers[0]?.points ?? 0;
  const leaderC = constructors[0]?.points ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <SeasonHeader />

      {drivers.length === 0 && constructors.length === 0 && (
        <div className="card-soft p-5 text-sm text-mute">
          Зачёт временно недоступен — попробуйте позже.
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        {drivers.length > 0 && (
          <section className="card-soft overflow-hidden">
            <div className="flex items-baseline justify-between border-b border-line px-5 py-4">
              <span className="font-display text-base font-semibold">Личный зачёт</span>
              <span className="text-xs text-mute">{drivers.length} пилотов</span>
            </div>
            <Head />
            <div>
              {drivers.map((d, i) => {
                const color = colorOf(d.team_slug);
                const ahead = i > 0 ? drivers[i - 1].points - d.points : null;
                return (
                  <div
                    key={d.code || d.position}
                    className={`team-row ${GRID} px-5 py-2.5 ${i < drivers.length - 1 ? "border-b border-line" : ""} ${d.position === 1 ? "bg-surface-2" : ""}`}
                    style={{ "--row": color } as React.CSSProperties}
                  >
                    <span className="tabular text-mute">{d.position}</span>
                    <span className="h-6 w-[4px] rounded-full" style={{ background: color }} />
                    <TeamLogo slug={d.team_slug ?? ""} size={26} />
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <Link href={`/drivers/${d.driver_id}`} className="truncate hover:text-[var(--accent2)]">
                          {d.name_ru ?? d.name_en}
                        </Link>
                        <FavoriteStar kind="driver" id={d.driver_id} size={14} />
                      </span>
                      <span className="block truncate text-[12px] text-mute">{d.team_name}</span>
                      <Bar pts={d.points} leader={leaderD} color={color} />
                    </span>
                    <span className="tabular text-right text-sm">{d.wins || <span className="text-mute">—</span>}</span>
                    <span className="tabular hidden text-right text-xs text-mute sm:block">{ahead == null ? "—" : ahead === 0 ? "=" : `−${ahead}`}</span>
                    <span className="text-right leading-tight">
                      <span className="tabular block font-display font-semibold">{d.points}</span>
                      <span className="tabular block text-[11px] text-mute">{d.position === 1 ? "лидер" : `−${leaderD - d.points}`}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {constructors.length > 0 && (
          <section className="card-soft self-start overflow-hidden">
            <div className="flex items-baseline justify-between border-b border-line px-5 py-4">
              <span className="font-display text-base font-semibold">Кубок конструкторов</span>
              <span className="text-xs text-mute">{constructors.length} команд</span>
            </div>
            <Head />
            <div>
              {constructors.map((c, i) => {
                const color = colorOf(c.team_slug);
                const ahead = i > 0 ? constructors[i - 1].points - c.points : null;
                return (
                  <div
                    key={c.team_slug || c.position}
                    className={`team-row ${GRID} px-5 py-2.5 ${i < constructors.length - 1 ? "border-b border-line" : ""} ${c.position === 1 ? "bg-surface-2" : ""}`}
                    style={{ "--row": color } as React.CSSProperties}
                  >
                    <span className="tabular text-mute">{c.position}</span>
                    <span className="h-6 w-[4px] rounded-full" style={{ background: color }} />
                    <TeamLogo slug={c.team_slug ?? ""} size={26} vt={c.team_slug ? `tlogo-${c.team_slug}` : undefined} />
                    <span className="min-w-0">
                      {c.team_slug ? (
                        <span className="flex min-w-0 items-center gap-2">
                          <Link href={`/teams/${c.team_slug}`} className="truncate hover:text-[var(--accent2)]">
                            {c.team_name}
                          </Link>
                          <FavoriteStar kind="team" id={c.team_slug} size={14} />
                        </span>
                      ) : (
                        <span className="block truncate">{c.team_name}</span>
                      )}
                      <Bar pts={c.points} leader={leaderC} color={color} />
                    </span>
                    <span className="tabular text-right text-sm">{c.wins || <span className="text-mute">—</span>}</span>
                    <span className="tabular hidden text-right text-xs text-mute sm:block">{ahead == null ? "—" : ahead === 0 ? "=" : `−${ahead}`}</span>
                    <span className="text-right leading-tight">
                      <span className="tabular block font-display font-semibold">{c.points}</span>
                      <span className="tabular block text-[11px] text-mute">{c.position === 1 ? "лидер" : `−${leaderC - c.points}`}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <p className="text-xs text-mute">Источник данных: Jolpica / Ergast.</p>
    </div>
  );
}
