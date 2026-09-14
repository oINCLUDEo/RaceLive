// «Форма сезона»: динамика набранных очков (площадь+линия в цвете команды) с
// точками по этапам, окрашенными по результату. Линия рисуется SVG на всю ширину
// (preserveAspectRatio="none"), а точки — HTML в процентных координатах поверх,
// поэтому они идеально ложатся на линию и остаются круглыми.
import type { DriverSeasonResultOut } from "@/lib/api";
import { isDnf } from "@/lib/format";
import { TEAMS } from "@/lib/teams";

function finishColor(r: DriverSeasonResultOut): string {
  if (isDnf(r.status)) return "var(--red)"; // сход — по статусу, не по позиции
  if (r.position === 1) return "var(--ember)";
  if (r.position >= 2 && r.position <= 3) return "var(--accent2)";
  if (r.position >= 4 && r.position <= 10) return "var(--bone)";
  return "var(--mute)"; // вне очков
}

const PAD = 10; // % вертикальный отступ, чтобы точки не липли к краям

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
  const n = cum.length;

  // точки в процентах: x слева-направо, y — доля очков (сверху вниз для SVG)
  const pts = cum.map((c, i) => {
    const xPct = (i / (n - 1)) * 100;
    const yPct = PAD + (1 - c.sum / max) * (100 - 2 * PAD); // 0 сверху
    return { xPct, yPct, c };
  });
  const line = "M" + pts.map((p) => `${p.xPct.toFixed(2)} ${p.yPct.toFixed(2)}`).join(" L");
  const area = `${line} L 100 100 L 0 100 Z`;

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

      <div className="relative h-28 w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
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
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* точки-финиши — HTML поверх, идеально круглые и на линии */}
        {pts.map((p) => (
          <span
            key={p.c.r.round}
            title={`Этап ${p.c.r.round} · ${p.c.r.name_ru ?? p.c.r.name_en}: ${
              p.c.r.position > 0 ? "P" + p.c.r.position : p.c.r.status
            } · ${p.c.sum} очк.`}
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--surface-1)] transition-transform hover:scale-150"
            style={{ left: `${p.xPct}%`, top: `${p.yPct}%`, background: finishColor(p.c.r) }}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mute">
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
