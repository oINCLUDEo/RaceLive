"use client";

// Сравнение двух пилотов по кругам (тест): выбор двоих, график времён кругов,
// лучший/средний круг и дельта. Данные — времена кругов из OpenF1.
import { useMemo, useState } from "react";
import type { CompareDriver, CompareOut } from "@/lib/api";
import { TEAMS } from "@/lib/teams";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec - m * 60).toFixed(3);
  return `${m}:${s.padStart(6, "0")}`;
}

function color(team: string | null, fallback: string): string {
  return (team && TEAMS[team]?.color) || fallback;
}

function stats(d: CompareDriver) {
  const times = d.laps.map((l) => l.time);
  const best = Math.min(...times);
  // «чистые» круги: в пределах +7% от лучшего (без питов/SC) — для среднего темпа
  const clean = times.filter((t) => t <= best * 1.07);
  const avg = clean.reduce((a, b) => a + b, 0) / (clean.length || 1);
  return { best, avg, laps: d.laps.length };
}

export function CompareView({ data }: { data: CompareOut }) {
  const drivers = data.drivers;
  const [aNum, setA] = useState(drivers[0]?.num);
  const [bNum, setB] = useState(drivers[1]?.num);

  const a = drivers.find((d) => d.num === aNum) ?? drivers[0];
  const b = drivers.find((d) => d.num === bNum) ?? drivers[1];
  const cA = color(a?.team ?? null, "var(--accent2)");
  const cB = color(b?.team ?? null, "var(--ember)");

  const chart = useMemo(() => {
    if (!a || !b) return null;
    const all = [...a.laps, ...b.laps];
    if (!all.length) return null;
    const maxLap = Math.max(...all.map((l) => l.lap));
    const minT = Math.min(...all.map((l) => l.time));
    const top = minT * 1.1; // клип: медленнее +10% (питы/SC) прижимаются к верху
    const W = 720;
    const H = 260;
    const padL = 46;
    const padR = 12;
    const padT = 12;
    const padB = 22;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const x = (lap: number) => padL + ((lap - 1) / Math.max(1, maxLap - 1)) * plotW;
    const y = (t: number) => {
      const v = Math.min(t, top);
      const n = (v - minT) / (top - minT); // 0 = быстрейший
      return padT + (1 - n) * plotH; // быстрейший — внизу
    };
    const line = (laps: CompareDriver["laps"]) =>
      laps.map((l) => `${x(l.lap).toFixed(1)},${y(l.time).toFixed(1)}`).join(" ");
    const grid = [0, 0.5, 1].map((n) => {
      const t = minT + n * (top - minT);
      return { y: padT + (1 - n) * plotH, label: fmt(t) };
    });
    return { W, H, padL, padR, plotW, x, y, line, grid, maxLap };
  }, [a, b]);

  if (!a || !b) return null;
  const sa = stats(a);
  const sb = stats(b);

  const Picker = ({ value, onChange, exclude }: { value: number; onChange: (n: number) => void; exclude: number }) => (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-line bg-surface-1 px-3 py-2 text-sm"
    >
      {drivers.map((d) => (
        <option key={d.num} value={d.num} disabled={d.num === exclude}>
          {d.name_ru} ({d.code})
        </option>
      ))}
    </select>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ВЫБОР + СВОДКА */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[{ d: a, s: sa, c: cA, set: setA, other: bNum }, { d: b, s: sb, c: cB, set: setB, other: aNum }].map((p, i) => (
          <div key={i} className="card-soft p-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.c }} />
              <Picker value={p.d.num} onChange={p.set} exclude={p.other} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="tabular font-display text-lg font-semibold">{fmt(p.s.best)}</div>
                <div className="text-[11px] uppercase tracking-wide text-mute">Лучший</div>
              </div>
              <div>
                <div className="tabular font-display text-lg font-semibold">{fmt(p.s.avg)}</div>
                <div className="text-[11px] uppercase tracking-wide text-mute">Средний</div>
              </div>
              <div>
                <div className="tabular font-display text-lg font-semibold">{p.s.laps}</div>
                <div className="text-[11px] uppercase tracking-wide text-mute">Кругов</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ГРАФИК ВРЕМЁН КРУГОВ */}
      <div className="card-soft p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-mute">
          <span>Время круга (ниже — быстрее)</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full" style={{ background: cA }} />{a.code}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full" style={{ background: cB }} />{b.code}</span>
          </span>
        </div>
        {chart ? (
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="h-auto w-full min-w-[520px]">
              {chart.grid.map((g, i) => (
                <g key={i}>
                  <line x1={chart.padL} y1={g.y} x2={chart.W - chart.padR} y2={g.y} stroke="var(--line)" strokeWidth="1" />
                  <text x={chart.padL - 6} y={g.y + 3} textAnchor="end" fontSize="10" fill="var(--mute)" className="tabular">{g.label}</text>
                </g>
              ))}
              <polyline points={chart.line(a.laps)} fill="none" stroke={cA} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <polyline points={chart.line(b.laps)} fill="none" stroke={cB} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-mute">Нет данных по кругам.</div>
        )}
        <div className="mt-1 text-[11px] text-mute">Пики вверх — пит-стопы и круги под сейфти-каром (прижаты к верху графика).</div>
      </div>
    </div>
  );
}
