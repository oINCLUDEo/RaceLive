import { Link } from "next-view-transitions";
import { notFound } from "next/navigation";
import { CountUp } from "@/components/CountUp";
import { Flag } from "@/components/Flag";
import { TeamLogo } from "@/components/TeamLogo";
import { getDriverProfile, type DriverProfileOut } from "@/lib/api";
import { isDnf, statusCode, statusRu } from "@/lib/format";
import { NATIONALITY } from "@/lib/nationality";
import { TEAMS } from "@/lib/teams";

export const revalidate = 600; // ISR

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const d = await getDriverProfile(params.id);
    const name = d.name_ru ?? d.name_en;
    return { title: name, description: `Профиль и результаты сезона: ${name}.` };
  } catch {
    return { title: "Пилот" };
  }
}

export default async function DriverPage({ params }: { params: { id: string } }) {
  let d: DriverProfileOut;
  try {
    d = await getDriverProfile(params.id);
  } catch {
    notFound();
  }

  const color = (d.team_slug ? TEAMS[d.team_slug]?.color : undefined) ?? "var(--line)";
  const nat = d.nationality ? NATIONALITY[d.nationality] : undefined;
  const finished = d.results.filter((r) => r.position > 0 && !isDnf(r.status));
  const podiums = finished.filter((r) => r.position <= 3).length;
  const bestFinish = finished.length ? Math.min(...finished.map((r) => r.position)) : null;
  const dnfCount = d.results.filter((r) => isDnf(r.status)).length;
  const avgFinish = finished.length
    ? Math.round(finished.reduce((s, r) => s + r.position, 0) / finished.length)
    : null;

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
          className="pointer-events-none absolute right-6 top-2 font-display text-[120px] font-bold leading-none opacity-10"
          aria-hidden
        >
          {d.number ?? d.code}
        </span>
        <div className="relative flex flex-wrap items-center gap-5">
          <TeamLogo slug={d.team_slug ?? ""} size={52} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-mute">
              {nat && <Flag code={nat.code} w={24} />}
              <span>{nat?.ru ?? d.nationality ?? ""}</span>
              {d.number && <span className="tabular">· №{d.number}</span>}
            </div>
            <h1 className="mt-1 font-display text-4xl font-semibold">{d.name_ru ?? d.name_en}</h1>
            {d.team_slug ? (
              <Link href={`/teams/${d.team_slug}`} className="mt-1 inline-block text-mute hover:text-bone">
                {d.team_name ?? ""}
              </Link>
            ) : (
              <div className="mt-1 text-mute">{d.team_name ?? ""}</div>
            )}
          </div>

          <Link
            href={`/compare?driver=${d.code}`}
            className="relative z-10 ml-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
            style={{ borderColor: "var(--accent2-soft)", background: "var(--accent2-soft)", color: "var(--accent2)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5L5 9l4 4M15 19l4-4-4-4M5 9h13M19 15H6" />
            </svg>
            Сравнить
          </Link>
        </div>
      </section>

      {/* СТАТИСТИКА */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-line sm:grid-cols-4">
        <Stat value={d.position ? `P${d.position}` : "—"} label="в зачёте" />
        <Stat value={d.points != null ? <CountUp value={d.points} /> : "—"} label="очков" />
        <Stat value={<CountUp value={d.wins ?? 0} />} label="побед" />
        <Stat value={bestFinish ? `P${bestFinish}` : "—"} label={`лучший финиш · ${podiums} подиума(ов)`} />
      </section>

      {/* ФОРМА СЕЗОНА */}
      {d.results.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Форма сезона</h2>
            <span className="text-xs text-mute">
              сходов: {dnfCount}
              {avgFinish ? ` · средний финиш P${avgFinish}` : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {d.results.map((r) => {
              const c = formColor(r);
              return (
                <Link
                  key={r.round}
                  href={`/schedule/${r.round}`}
                  title={`Этап ${r.round}: ${isDnf(r.status) ? statusRu(r.status) : `P${r.position}`}`}
                  className="tabular flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-transform hover:-translate-y-0.5"
                  style={{ background: `color-mix(in srgb, ${c} 18%, transparent)`, color: c }}
                >
                  {isDnf(r.status) ? "—" : r.position}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* РЕЗУЛЬТАТЫ СЕЗОНА */}
      {d.results.length > 0 && (
        <section className="card-soft overflow-hidden">
          <div className="border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-mute">
            Результаты сезона
          </div>
          {d.results.map((r) => (
            <Link
              key={r.round}
              href={`/schedule/${r.round}`}
              className="grid grid-cols-[28px_1fr_auto_auto] items-center gap-3 border-b border-line px-5 py-2.5 transition-colors last:border-b-0 hover:bg-surface-2"
            >
              <span className="tabular text-mute">{r.round}</span>
              <span className="truncate">{r.name_ru ?? r.name_en}</span>
              <span
                title={isDnf(r.status) ? statusRu(r.status) : undefined}
                className={`tabular text-right text-sm ${isDnf(r.status) ? "text-mute" : r.position === 1 ? "text-[var(--red)]" : r.position > 0 ? "text-bone" : "text-mute"}`}
              >
                {isDnf(r.status) ? statusCode(r.status) : `P${r.position}`}
              </span>
              <span className="tabular w-10 text-right font-display font-semibold">{r.points}</span>
            </Link>
          ))}
        </section>
      )}

      <p className="text-xs text-mute">Источник данных: Jolpica / Ergast.</p>
    </div>
  );
}

// Цвет клетки «формы»: победа — красный, подиум — индиго, очки — bone, иначе/сход — приглушённо.
function formColor(r: { position: number; status: string }): string {
  if (isDnf(r.status)) return "var(--mute)";
  if (r.position === 1) return "var(--red)";
  if (r.position <= 3) return "var(--accent2)";
  if (r.position <= 10) return "var(--bone)";
  return "var(--mute)";
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
