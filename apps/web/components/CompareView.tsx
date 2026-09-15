"use client";

// Сравнение двух пилотов по кругам (тест): выбор гонки и двоих пилотов, график
// времён кругов с отметками пит-стопов и быстрейшего круга, лучший/средний темп.
import { useMemo, useState } from "react";
import type { CompareDriver, CompareOut } from "@/lib/api";
import { TEAMS } from "@/lib/teams";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec - m * 60).toFixed(3);
  return `${m}:${s.padStart(6, "0")}`;
}

const teamColor = (team: string | null, fallback = "var(--mute)") =>
  (team && TEAMS[team]?.color) || fallback;

function stats(d: CompareDriver) {
  const times = d.laps.map((l) => l.time);
  const best = Math.min(...times);
  const clean = times.filter((t) => t <= best * 1.07);
  const avg = clean.reduce((a, b) => a + b, 0) / (clean.length || 1);
  return { best, avg, laps: d.laps.length };
}

function DriverPicker({
  drivers,
  value,
  exclude,
  dot,
  onChange,
}: {
  drivers: CompareDriver[];
  value: number;
  exclude: number;
  dot: string;
  onChange: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const sel = drivers.find((d) => d.num === value);
  return (
    <div className="relative flex-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface-1 px-3 py-2 text-sm"
      >
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: dot }} />
        <span className="font-display font-semibold">{sel?.code}</span>
        <span className="truncate text-mute">{sel?.name_ru}</span>
        <span className="ml-auto text-mute">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-line bg-surface-1 py-1 shadow-[var(--soft)]">
            {drivers.map((d) => (
              <button
                key={d.num}
                disabled={d.num === exclude}
                onClick={() => {
                  onChange(d.num);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2 disabled:opacity-40"
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: teamColor(d.team) }} />
                <span className="tabular w-9 font-display font-semibold">{d.code}</span>
                <span className="truncate">{d.name_ru}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function CompareView({ data: initial }: { data: CompareOut }) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const drivers = data.drivers;
  const [aNum, setA] = useState(drivers[0]?.num);
  const [bNum, setB] = useState(drivers[1]?.num);

  const a = drivers.find((d) => d.num === aNum) ?? drivers[0];
  const b = drivers.find((d) => d.num === bNum) ?? drivers[1];

  // Сокомандники — разводим цвета (иначе линии сливаются); линию B делаем штриховой.
  const sameTeam = !!a?.team && a.team === b?.team;
  const cA = sameTeam ? "var(--accent2)" : teamColor(a?.team ?? null, "var(--accent2)");
  const cB = sameTeam ? "var(--ember)" : teamColor(b?.team ?? null, "var(--ember)");

  const onRace = async (key: number) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/compare?session=${key}`);
      const d: CompareOut = await r.json();
      if (d.drivers?.length) {
        setData(d);
        setA(d.drivers[0].num);
        setB(d.drivers[1]?.num ?? d.drivers[0].num);
      }
    } catch {
      /* оставим текущее */
    } finally {
      setLoading(false);
    }
  };

  const chart = useMemo(() => {
    if (!a || !b) return null;
    const all = [...a.laps, ...b.laps];
    if (!all.length) return null;
    const maxLap = Math.max(...all.map((l) => l.lap));
    const minT = Math.min(...all.map((l) => l.time));
    const top = minT * 1.1;
    const W = 720, H = 260, padL = 46, padR = 12, padT = 16, padB = 22;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const x = (lap: number) => padL + ((lap - 1) / Math.max(1, maxLap - 1)) * plotW;
    const y = (t: number) => padT + (1 - (Math.min(t, top) - minT) / (top - minT)) * plotH;
    const line = (laps: CompareDriver["laps"]) =>
      laps.map((l) => `${x(l.lap).toFixed(1)},${y(l.time).toFixed(1)}`).join(" ");
    const grid = [0, 0.5, 1].map((n) => ({ y: padT + (1 - n) * plotH, label: fmt(minT + n * (top - minT)) }));
    const marks = (d: CompareDriver) => {
      const byLap = new Map(d.laps.map((l) => [l.lap, l.time]));
      const bestLap = d.laps.reduce((m, l) => (l.time < m.time ? l : m), d.laps[0]);
      const pits = (d.pits ?? [])
        .filter((lap) => byLap.has(lap))
        .map((lap) => ({ x: x(lap), y: y(byLap.get(lap)!) }));
      return { pits, best: { x: x(bestLap.lap), y: y(bestLap.time) } };
    };
    return { W, H, padL, padR, x, y, line, grid, marks };
  }, [a, b]);

  if (!a || !b) return null;
  const sa = stats(a);
  const sb = stats(b);
  const mA = chart?.marks(a);
  const mB = chart?.marks(b);

  return (
    <div className={`flex flex-col gap-5 ${loading ? "opacity-60" : ""}`}>
      {/* ВЫБОР ГОНКИ */}
      {(data.sessions ?? []).length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-mute">Гонка</span>
          <select
            value={data.session_key ?? ""}
            onChange={(e) => onRace(Number(e.target.value))}
            className="rounded-lg border border-line bg-surface-1 px-3 py-2 text-sm"
          >
            {(data.sessions ?? []).map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ВЫБОР ПИЛОТОВ + СВОДКА */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { d: a, s: sa, c: cA, set: setA, other: bNum },
          { d: b, s: sb, c: cB, set: setB, other: aNum },
        ].map((p, i) => (
          <div key={i} className="card-soft p-4">
            <DriverPicker drivers={drivers} value={p.d.num} exclude={p.other} dot={p.c} onChange={p.set} />
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

      {/* ГРАФИК */}
      <div className="card-soft p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-mute">
          <span>Время круга (ниже — быстрее)</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full" style={{ background: cA }} />{a.code}</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-4" style={{ borderTop: `2px dashed ${cB}` }} />{b.code}</span>
          </span>
        </div>
        {chart && mA && mB ? (
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="h-auto w-full min-w-[520px]">
              {chart.grid.map((g, i) => (
                <g key={i}>
                  <line x1={chart.padL} y1={g.y} x2={chart.W - chart.padR} y2={g.y} stroke="var(--line)" strokeWidth="1" />
                  <text x={chart.padL - 6} y={g.y + 3} textAnchor="end" fontSize="10" fill="var(--mute)" className="tabular">{g.label}</text>
                </g>
              ))}
              <polyline points={chart.line(a.laps)} fill="none" stroke={cA} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <polyline points={chart.line(b.laps)} fill="none" stroke={cB} strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
              {/* быстрейший круг */}
              {[{ m: mA, c: cA }, { m: mB, c: cB }].map(({ m, c }, i) => (
                <circle key={i} cx={m.best.x} cy={m.best.y} r="3.5" fill="var(--purple)" stroke={c} strokeWidth="1.5" />
              ))}
              {/* пит-стопы */}
              {[{ m: mA, c: cA }, { m: mB, c: cB }].map(({ m, c }, di) =>
                m.pits.map((pt, i) => (
                  <g key={`${di}-${i}`}>
                    <circle cx={pt.x} cy={pt.y} r="3" fill={c} />
                    <text x={pt.x} y={pt.y - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill={c}>П</text>
                  </g>
                )),
              )}
            </svg>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-mute">Нет данных по кругам.</div>
        )}
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mute">
          <span><b className="text-bone">П</b> — пит-стоп</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: "var(--purple)" }} />быстрейший круг</span>
          <span>пики вверх — питы/сейфти-кар</span>
        </div>
      </div>
    </div>
  );
}
