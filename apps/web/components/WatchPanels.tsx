"use client";

// Раскладка «стрим + данные гонки». Панели (позиции, рейс-контроль, погода) появляются
// ТОЛЬКО когда данные живые (кадр с бейджем «эфир»). Повтор/демо/нет данных — колонки
// нет вовсе, стрим занимает всю ширину. Колонка «липкая» и не выше экрана — прокрутка
// внутри, страница не растягивается. Есть ползунок «задержка под стрим».
import { useEffect, useState } from "react";
import { RaceFeed, Tower } from "@/components/LiveTiming";
import { WeatherCard } from "@/components/WeatherCard";
import { useTimingFeed } from "@/lib/useTimingFeed";

type PanelId = "positions" | "rc" | "weather";
type Prefs = Record<PanelId, boolean>;

const PANELS: { id: PanelId; label: string }[] = [
  { id: "positions", label: "Позиции" },
  { id: "rc", label: "Рейс-контроль" },
  { id: "weather", label: "Погода" },
];
const PREFS_KEY = "racelive:panels:live";
const DELAY_KEY = "racelive:stream-delay";
const DEFAULTS: Prefs = { positions: true, rc: true, weather: false };

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* приватный режим */
  }
}

export function WatchArea({ children }: { children: React.ReactNode }) {
  const [delay, setDelay] = useState(0);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const { frame, changes, prevOrder } = useTimingFeed(delay);

  useEffect(() => {
    setPrefs(load<Prefs>(PREFS_KEY) ?? DEFAULTS);
    setDelay(load<number>(DELAY_KEY) ?? 0);
  }, []);

  const live = frame?.badge === "эфир";
  if (!live || !frame) return <div className="min-w-0">{children}</div>;

  const toggle = (id: PanelId) => {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    save(PREFS_KEY, next);
  };
  const changeDelay = (v: number) => {
    setDelay(v);
    save(DELAY_KEY, v);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">{children}</div>
      <aside className="no-scrollbar flex min-w-0 flex-col gap-3 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:self-start xl:overflow-y-auto">
        <div className="card-soft p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-sm font-semibold">Данные гонки</span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--ember)" }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> живые
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PANELS.map((p) => (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                aria-pressed={prefs[p.id]}
                className={`pressable rounded-full border px-3 py-1.5 text-xs font-medium ${prefs[p.id] ? "border-transparent" : "border-line text-mute hover:text-bone"}`}
                style={prefs[p.id] ? { background: "var(--accent2-soft)", color: "var(--accent2)" } : undefined}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="stream-delay" className="text-mute">Задержка под стрим</label>
              <span className="tabular font-semibold text-bone">{delay > 0 ? `−${delay} с` : "без задержки"}</span>
            </div>
            <input
              id="stream-delay"
              type="range"
              min={0}
              max={90}
              step={5}
              value={delay}
              onChange={(e) => changeDelay(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--ember)]"
            />
            <p className="mt-1 text-[11px] leading-snug text-mute">
              Трансляция отстаёт от данных. Если таблица «спойлерит» обгоны раньше экрана — сдвиньте ползунок.
            </p>
          </div>
        </div>

        {prefs.positions && (
          <div className="no-scrollbar max-h-[520px] overflow-y-auto rounded-[var(--r-card)]">
            <Tower frame={frame} prevOrder={prevOrder} changes={changes} />
          </div>
        )}
        {prefs.rc && <RaceFeed rc={frame.rc ?? []} />}
        {prefs.weather && frame.weather && <WeatherCard w={frame.weather} compact />}
      </aside>
    </div>
  );
}
