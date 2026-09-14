import { Link } from "next-view-transitions";
import { notFound } from "next/navigation";
import { CountUp } from "@/components/CountUp";
import { Flag } from "@/components/Flag";
import { TeamLogo } from "@/components/TeamLogo";
import { getTeam, type TeamProfileOut, type TeamRoundEntryOut } from "@/lib/api";
import { isDnf, statusCode, statusRu } from "@/lib/format";
import { NATIONALITY } from "@/lib/nationality";
import { TEAMS } from "@/lib/teams";

export const revalidate = 600; // ISR

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const name = TEAMS[params.slug]?.name ?? "Команда";
  return { title: name, description: `Команда ${name}: состав, статистика и результаты сезона.` };
}

function EntryChip({ e }: { e: TeamRoundEntryOut }) {
  const dnf = isDnf(e.status);
  const color = dnf
    ? "var(--mute)"
    : e.position === 1
      ? "var(--red)"
      : e.position <= 3
        ? "var(--accent2)"
        : "var(--mute)";
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap" title={dnf ? statusRu(e.status) : undefined}>
      <span className="tabular text-mute">{e.code}</span>
      <span className="tabular font-semibold" style={{ color }}>
        {dnf ? statusCode(e.status) : `P${e.position}`}
      </span>
    </span>
  );
}

export default async function TeamPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  let t: TeamProfileOut;
  try {
    t = await getTeam(slug);
  } catch {
    notFound();
  }

  const color = TEAMS[slug]?.color ?? "var(--line)";
  const nat = t.nationality ? NATIONALITY[t.nationality] : undefined;

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
        <span className="pointer-events-none absolute right-0 top-0 h-full w-[6px]" style={{ background: color }} aria-hidden />
        <div className="flex flex-wrap items-center gap-5">
          <TeamLogo slug={slug} size={56} />
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-mute">
              команда
              {nat && (
                <>
                  <Flag code={nat.code} w={22} />
                  <span className="normal-case tracking-normal">{nat.ru}</span>
                </>
              )}
            </div>
            <h1 className="mt-1 font-display text-4xl font-semibold">{t.name}</h1>
          </div>
        </div>
      </section>

      {/* СТАТИСТИКА */}
      {t.position != null && (
        <section className="grid grid-cols-3 gap-px overflow-hidden rounded-[18px] bg-line">
          <Stat value={`P${t.position}`} label="в кубке" />
          <Stat value={<CountUp value={t.points ?? 0} />} label="очков" />
          <Stat value={<CountUp value={t.wins ?? 0} />} label="побед" />
        </section>
      )}

      {/* СОСТАВ + H2H */}
      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {t.drivers.length > 0 && (
          <div className="card-soft overflow-hidden">
            <div className="border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-mute">Состав</div>
            {t.drivers.map((d, i) => (
              <Link
                key={d.driver_id || d.code}
                href={`/drivers/${d.driver_id}`}
                className={`flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2 ${i < t.drivers.length - 1 ? "border-b border-line" : ""}`}
              >
                <span className="truncate">{d.name_ru ?? d.name_en}</span>
                <span className="tabular font-display font-semibold">{d.points}</span>
              </Link>
            ))}
          </div>
        )}

        {t.h2h && t.h2h.a_ahead + t.h2h.b_ahead > 0 && (
          <div className="card-soft p-5">
            <div className="text-xs uppercase tracking-wide text-mute">Очные встречи · гонки</div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{t.h2h.a_name}</div>
                <div className="font-display text-3xl font-semibold" style={{ color: t.h2h.a_ahead >= t.h2h.b_ahead ? "var(--bone)" : "var(--mute)" }}>
                  {t.h2h.a_ahead}
                </div>
              </div>
              <span className="text-mute">:</span>
              <div className="min-w-0 flex-1 text-right">
                <div className="truncate text-sm">{t.h2h.b_name}</div>
                <div className="font-display text-3xl font-semibold" style={{ color: t.h2h.b_ahead >= t.h2h.a_ahead ? "var(--bone)" : "var(--mute)" }}>
                  {t.h2h.b_ahead}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-mute">Кто чаще финишировал впереди напарника.</div>
          </div>
        )}
      </section>

      {/* РЕЗУЛЬТАТЫ ПО ЭТАПАМ */}
      {t.rounds.length > 0 && (
        <section className="card-soft overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-mute">
            <span>Результаты по этапам</span>
            <span>очки этапа</span>
          </div>
          {t.rounds.map((r, i) => (
            <div
              key={r.round}
              className={`grid grid-cols-[28px_1fr_auto] items-center gap-3 px-5 py-3 ${i < t.rounds.length - 1 ? "border-b border-line" : ""}`}
            >
              <Link href={`/schedule/${r.round}`} className="tabular text-mute hover:text-bone">
                {r.round}
              </Link>
              <div className="flex min-w-0 flex-col gap-1">
                <Link href={`/schedule/${r.round}`} className="truncate text-sm hover:text-bone">
                  {r.name_ru ?? r.name_en}
                </Link>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {r.entries.map((e) => (
                    <EntryChip key={e.driver_id || e.code} e={e} />
                  ))}
                </div>
              </div>
              <span className="tabular font-display font-semibold">{r.team_points}</span>
            </div>
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
      <div className="tabular font-display text-2xl font-semibold leading-none md:text-3xl">{value}</div>
      <div className="mt-2 text-[11px] uppercase tracking-wide text-mute">{label}</div>
    </div>
  );
}
