import { Link } from "next-view-transitions";
import { notFound } from "next/navigation";
import { CountUp } from "@/components/CountUp";
import { TeamLogo } from "@/components/TeamLogo";
import {
  getConstructorStandings,
  getDriverStandings,
  type ConstructorStandingOut,
  type DriverStandingOut,
} from "@/lib/api";
import { TEAMS } from "@/lib/teams";

export const revalidate = 600; // ISR

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const name = TEAMS[params.slug]?.name ?? "Команда";
  return { title: name, description: `Команда ${name}: состав и результаты сезона.` };
}

export default async function TeamPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [cons, drivers] = await Promise.all([
    getConstructorStandings().catch(() => [] as ConstructorStandingOut[]),
    getDriverStandings().catch(() => [] as DriverStandingOut[]),
  ]);

  const team = cons.find((c) => c.team_slug === slug) ?? null;
  const roster = drivers
    .filter((d) => d.team_slug === slug)
    .sort((a, b) => a.position - b.position);
  const meta = TEAMS[slug];

  if (!meta && !team && roster.length === 0) notFound();

  const name = team?.team_name ?? meta?.name ?? slug;
  const color = meta?.color ?? "var(--line)";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/standings" className="text-sm text-mute hover:text-bone">
        ← Зачёт
      </Link>

      {/* ШАПКА */}
      <section
        className="relative overflow-hidden rounded-[24px] p-8 shadow-[var(--soft)]"
        style={{ background: `linear-gradient(110deg, ${color}22, var(--surface-1) 60%)` }}
      >
        <span
          className="pointer-events-none absolute right-0 top-0 h-full w-[6px]"
          style={{ background: color }}
          aria-hidden
        />
        <div className="flex flex-wrap items-center gap-5">
          <TeamLogo slug={slug} size={56} />
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-mute">команда</div>
            <h1 className="mt-1 font-display text-4xl font-semibold">{name}</h1>
          </div>
        </div>
      </section>

      {/* СТАТИСТИКА */}
      {team && (
        <section className="grid grid-cols-3 gap-px overflow-hidden rounded-[18px] bg-line">
          <Stat value={`P${team.position}`} label="в кубке" />
          <Stat value={<CountUp value={team.points} />} label="очков" />
          <Stat value={<CountUp value={team.wins} />} label="побед" />
        </section>
      )}

      {/* СОСТАВ */}
      {roster.length > 0 && (
        <section className="card-soft overflow-hidden">
          <div className="border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-mute">
            Состав
          </div>
          {roster.map((d, i) => (
            <Link
              key={d.driver_id || d.code}
              href={`/drivers/${d.driver_id}`}
              className={`grid grid-cols-[28px_1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2 ${i < roster.length - 1 ? "border-b border-line" : ""}`}
            >
              <span className="tabular text-mute">{d.position}</span>
              <span className="truncate">{d.name_ru ?? d.name_en}</span>
              <span className="text-right leading-tight">
                <span className="tabular block font-display font-semibold">{d.points}</span>
                <span className="text-[11px] uppercase tracking-wide text-mute">очков</span>
              </span>
            </Link>
          ))}
        </section>
      )}

      <p className="text-xs text-mute">Источник данных: Jolpica / Ergast.</p>
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="bg-surface-1 px-5 py-5">
      <div className="tabular font-display text-2xl font-semibold leading-none md:text-3xl">
        {value}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-wide text-mute">{label}</div>
    </div>
  );
}
