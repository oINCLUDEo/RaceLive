// Эксперимент: «форма сезона» пилота — динамика набранных очков (площадь+линия)
// с точками по этапам, окрашенными по результату (победа/подиум/очки/вне/сход).
// Один интегрированный график: и импульс сезона, и качество каждой гонки.
import type { DriverSeasonResultOut } from "@/lib/api";
import { TEAMS } from "@/lib/teams";

function finishColor(position: number): string {
  if (position === 1) return "var(--ember)"; // победа
  if (position >= 2 && position <= 3) return "var(--accent2)"; // подиум
  if (position >= 4 && position <= 10) return "var(--bone)"; // очки
  if (position > 10) return "var(--mute)"; // вне очков
  return "var(--red)"; // сход / не финишировал
}

export function DriverForm({
  results,
  teamSlug,
}: {
  results: DriverSeasonResultOut[];
  teamSlug: string | null;
}) {
  if (results.length < 2) return null;

  const color = (teamSlug ? TEAMS[teamSlug]?.color : undefined) ?? "var(--bone)";
  let sum = 0;
  const cum = results.map((r) => {
    sum += r.points;
    return { r, sum };
  });
  const max = Math.max(1, sum);
  const W = 100;
  const H = 34;
  const xy = cum.map((c, i) => [
    (i / (cum.length - 1)) * W,
    H - (c.sum / max) * (H - 3) - 1.5,
  ]);
  const line = "M" + xy.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;

  const wins = results.filter((r) => r.position === 1).length;
  const podiums = results.filter((r) => r.position >= 1 && r.position <= 3).length;

  return (
    <section className="card-soft p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-display text-sm font-semibold">Форма сезона</span>
        <span className="text-[11px] uppercase tracking-wide text-mute">
          {wins} побед · {podiums} подиумов
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-24 w-full">
          <defs>
            <linearGradient id="df-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#df-grad)" />
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth="1.6"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* точки-финиши поверх линии (в собственном слое, чтобы кружки были круглыми) */}
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-24 w-full overflow-visible">
          {xy.map(([x, y], i) => (
            <circle
              key={cum[i].r.round}
              cx={x}
              cy={y}
              r={2.4}
              fill={finishColor(cum[i].r.position)}
              stroke="var(--surface-1)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            >
              <title>
                {`Этап ${cum[i].r.round} · ${cum[i].r.name_ru ?? cum[i].r.name_en}: ${
                  cum[i].r.position > 0 ? "P" + cum[i].r.position : cum[i].r.status
                } · ${cum[i].sum} очк.`}
              </title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mute">
        <Legend color="var(--ember)" label="победа" />
        <Legend color="var(--accent2)" label="подиум" />
        <Legend color="var(--bone)" label="очки" />
        <Legend color="var(--mute)" label="вне очков" />
        <Legend color="var(--red)" label="сход" />
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
