import Link from "next/link";
import { Flag } from "@/components/Flag";
import { TrackMap } from "@/components/TrackMap";
import { getCircuits, type CircuitListItemOut } from "@/lib/api";

// force-dynamic: см. standings — избегаем пустого статик-пререндера на билде.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Трассы",
  description: "Трассы текущего сезона Формулы-1: контуры, страны, этапы.",
};

export default async function TracksPage() {
  let circuits: CircuitListItemOut[] = [];
  let error = false;
  try {
    circuits = await getCircuits();
  } catch {
    error = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-mute">сезон</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Трассы</h1>
      </div>

      {error && (
        <div className="card-soft p-5 text-sm text-mute">
          Не удалось загрузить трассы — попробуйте позже.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {circuits.map((c) => (
          <Link
            key={c.key}
            href={`/tracks/${c.key}`}
            className="card-soft flex items-center gap-4 p-4 transition-colors hover:bg-surface-2"
          >
            <TrackMap circuit={c.key} size={64} className="shrink-0 opacity-90" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display font-semibold">{c.name_ru ?? c.name_en}</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-mute">
                <Flag code={c.country_code} w={20} />
                <span className="truncate">{c.country ?? ""}</span>
              </div>
            </div>
            {c.round != null && (
              <span className="shrink-0 text-[11px] uppercase tracking-wide text-mute">
                этап {c.round}
              </span>
            )}
          </Link>
        ))}
      </div>

      <p className="text-xs text-mute">Контуры трасс: данные bacinger/f1-circuits (MIT).</p>
    </div>
  );
}
