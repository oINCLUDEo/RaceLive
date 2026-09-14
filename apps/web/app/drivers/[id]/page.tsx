import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "@/components/Flag";
import { TeamLogo } from "@/components/TeamLogo";
import { getDriverProfile, type DriverProfileOut } from "@/lib/api";
import { NATIONALITY } from "@/lib/nationality";
import { TEAMS } from "@/lib/teams";

export const dynamic = "force-dynamic";

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
  const finished = d.results.filter((r) => r.position > 0);
  const podiums = finished.filter((r) => r.position <= 3).length;
  const bestFinish = finished.length ? Math.min(...finished.map((r) => r.position)) : null;

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
            <div className="mt-1 text-mute">{d.team_name ?? ""}</div>
          </div>
        </div>
      </section>

      {/* СТАТИСТИКА */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-line sm:grid-cols-4">
        <Stat value={d.position ? `P${d.position}` : "—"} label="в зачёте" />
        <Stat value={d.points != null ? String(d.points) : "—"} label="очков" />
        <Stat value={String(d.wins ?? 0)} label="побед" />
        <Stat value={bestFinish ? `P${bestFinish}` : "—"} label={`лучший финиш · ${podiums} подиума(ов)`} />
      </section>

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
              <span className={`tabular text-right text-sm ${r.position === 1 ? "text-[var(--ember)]" : r.position > 0 ? "text-bone" : "text-mute"}`}>
                {r.position > 0 ? `P${r.position}` : r.status}
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-surface-1 px-5 py-5">
      <div className="tabular font-display text-2xl font-semibold leading-none md:text-3xl">
        {value}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-wide text-mute">{label}</div>
    </div>
  );
}
