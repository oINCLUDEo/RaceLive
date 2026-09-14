import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "@/components/Flag";
import { SessionTime } from "@/components/SessionTime";
import { TeamLogo } from "@/components/TeamLogo";
import { TrackMap } from "@/components/TrackMap";
import { getCircuit, type CircuitPageOut } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { key: string } }) {
  try {
    const c = await getCircuit(params.key);
    const name = c.name_ru ?? c.name_en;
    return { title: name, description: `Трасса ${name}: контур, факты, этап сезона.` };
  } catch {
    return { title: "Трасса" };
  }
}

export default async function TrackPage({ params }: { params: { key: string } }) {
  let c: CircuitPageOut;
  try {
    c = await getCircuit(params.key);
  } catch {
    notFound();
  }

  const facts: { label: string; value: string }[] = [];
  if (c.length_m) facts.push({ label: "длина круга", value: `${(c.length_m / 1000).toFixed(3)} км` });
  if (c.first_gp) facts.push({ label: "первый Гран-при", value: String(c.first_gp) });
  if (c.opened) facts.push({ label: "год открытия", value: String(c.opened) });
  if (c.locality) facts.push({ label: "город", value: c.locality });

  return (
    <div className="flex flex-col gap-6">
      <Link href="/tracks" className="text-sm text-mute hover:text-bone">
        ← Трассы
      </Link>

      {/* ШАПКА */}
      <section className="glow-panel flex flex-col items-center gap-6 overflow-hidden rounded-[24px] p-8 shadow-[var(--soft)] md:flex-row md:justify-between md:p-10">
        <div>
          <div className="flex items-center gap-2 text-sm text-mute">
            <Flag code={c.country_code} w={26} />
            <span>{c.country ?? ""}</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
            {c.name_ru ?? c.name_en}
          </h1>
          {c.name_ru && c.name_en && (
            <div className="mt-1 text-sm text-mute">{c.name_en}</div>
          )}
        </div>
        <TrackMap circuit={c.key} size={220} className="shrink-0 opacity-90" />
      </section>

      {/* ФАКТЫ */}
      {facts.length > 0 && (
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-line sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="bg-surface-1 px-5 py-5">
              <div className="tabular font-display text-2xl font-semibold leading-none">{f.value}</div>
              <div className="mt-2 text-[11px] uppercase tracking-wide text-mute">{f.label}</div>
            </div>
          ))}
        </section>
      )}

      {/* ЭТАП СЕЗОНА */}
      {c.round != null && (
        <section className="card-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-mute">этап {c.round} · сезон</div>
              <div className="mt-1 font-display text-lg font-semibold">
                {c.meeting_name_ru ?? c.meeting_name_en}
              </div>
              {c.meeting_starts_at && (
                <div className="mt-1 text-sm text-mute">
                  <SessionTime iso={c.meeting_starts_at} mode="date" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {c.winner_name_ru || c.winner_name_en ? (
                <div className="flex items-center gap-2.5">
                  <TeamLogo slug={c.winner_team_slug ?? ""} size={26} />
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-mute">победитель</div>
                    <div className="text-sm">{c.winner_name_ru ?? c.winner_name_en}</div>
                  </div>
                </div>
              ) : null}
              <Link href={`/schedule/${c.round}`} className="cta">К этапу</Link>
            </div>
          </div>
        </section>
      )}

      <p className="text-xs text-mute">Контур: bacinger/f1-circuits (MIT) · данные Jolpica / Ergast.</p>
    </div>
  );
}
