import { Link } from "next-view-transitions";
import { FavoriteStar } from "@/components/FavoriteStar";
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

export default async function StandingsPage() {
  const [drivers, constructors] = await Promise.all([
    getDriverStandings().catch(() => [] as DriverStandingOut[]),
    getConstructorStandings().catch(() => [] as ConstructorStandingOut[]),
  ]);
  const leaderD = drivers[0]?.points ?? 0;
  const leaderC = constructors[0]?.points ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-mute">чемпионат</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Зачёт сезона</h1>
      </div>

      {drivers.length === 0 && constructors.length === 0 && (
        <div className="card-soft p-5 text-sm text-mute">
          Зачёт временно недоступен — попробуйте позже.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {drivers.length > 0 && (
          <section className="card-soft overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <span className="font-display text-base font-semibold">Личный зачёт</span>
            </div>
            <div>
              {drivers.map((d, i) => (
                <div
                  key={d.code || d.position}
                  className={`grid grid-cols-[26px_4px_28px_1fr_auto] items-center gap-3 px-5 py-2.5 ${i < drivers.length - 1 ? "border-b border-line" : ""} ${d.position === 1 ? "bg-surface-2" : ""}`}
                >
                  <span className="tabular text-mute">{d.position}</span>
                  <span className="h-6 w-[4px] rounded-full" style={{ background: colorOf(d.team_slug) }} />
                  <TeamLogo slug={d.team_slug ?? ""} size={26} />
                  <span className="flex min-w-0 items-center gap-2">
                    <Link href={`/drivers/${d.driver_id}`} className="truncate hover:text-[var(--accent2)]">
                      {d.name_ru ?? d.name_en}
                    </Link>
                    <FavoriteStar kind="driver" id={d.driver_id} size={14} />
                  </span>
                  <span className="text-right leading-tight">
                    <span className="tabular block font-display font-semibold">{d.points}</span>
                    <span className="tabular block text-[11px] text-mute">
                      {d.position === 1 ? "лидер" : `−${leaderD - d.points}`}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {constructors.length > 0 && (
          <section className="card-soft overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <span className="font-display text-base font-semibold">Кубок конструкторов</span>
            </div>
            <div>
              {constructors.map((c, i) => (
                <div
                  key={c.team_slug || c.position}
                  className={`grid grid-cols-[26px_4px_28px_1fr_auto] items-center gap-3 px-5 py-2.5 ${i < constructors.length - 1 ? "border-b border-line" : ""} ${c.position === 1 ? "bg-surface-2" : ""}`}
                >
                  <span className="tabular text-mute">{c.position}</span>
                  <span className="h-6 w-[4px] rounded-full" style={{ background: colorOf(c.team_slug) }} />
                  <TeamLogo slug={c.team_slug ?? ""} size={26} />
                  {c.team_slug ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <Link href={`/teams/${c.team_slug}`} className="truncate hover:text-[var(--accent2)]">
                        {c.team_name}
                      </Link>
                      <FavoriteStar kind="team" id={c.team_slug} size={14} />
                    </span>
                  ) : (
                    <span className="truncate">{c.team_name}</span>
                  )}
                  <span className="text-right leading-tight">
                    <span className="tabular block font-display font-semibold">{c.points}</span>
                    <span className="tabular block text-[11px] text-mute">
                      {c.position === 1 ? "лидер" : `−${leaderC - c.points}`}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <p className="text-xs text-mute">Источник данных: Jolpica / Ergast.</p>
    </div>
  );
}
