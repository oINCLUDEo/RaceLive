"use client";

// Панели рядом со стримом: зритель сам включает «Позиции», «Рейс-контроль», «Погода».
// Живые данные (кадр с бейджем «эфир») — панели включены по умолчанию и есть ползунок
// «задержка под стрим» (стрим отстаёт от данных — придерживаем таблицу, чтобы не
// спойлерила). Живых данных нет (повтор прошлой гонки / демо) — по умолчанию выключены,
// вместо них честная плашка; повтор можно включить вручную. Выбор запоминается.
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
const PREFS_KEY = "racelive:panels";
const DELAY_KEY = "racelive:stream-delay";

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

export function WatchPanels() {
  const [delay, setDelay] = useState(0);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const { frame, changes, prevOrder } = useTimingFeed(delay);

  useEffect(() => {
    setPrefs(load<Prefs>(PREFS_KEY));
    setDelay(load<number>(DELAY_KEY) ?? 0);
  }, []);

  const mode: "live" | "replay" | "none" = !frame ? "none" : frame.badge === "эфир" ? "live" : "replay";
  const defaults: Prefs = mode === "live" ? { positions: true, rc: true, weather: false } : { positions: false, rc: false, weather: false };
  const on = prefs ?? defaults;
  const anyOn = on.positions || on.rc || on.weather;

  const toggle = (id: PanelId) => {
    const next = { ...on, [id]: !on[id] };
    setPrefs(next);
    save(PREFS_KEY, next);
  };
  const showReplay = () => {
    const next = { positions: true, rc: true, weather: false };
    setPrefs(next);
    save(PREFS_KEY, next);
  };
  const changeDelay = (v: number) => {
    setDelay(v);
    save(DELAY_KEY, v);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ШАПКА: статус данных + выбор панелей */}
      <div className="card-soft p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-sm font-semibold">Данные гонки</span>
          {mode === "live" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--ember)" }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> живые
            </span>
          ) : mode === "replay" ? (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mute">повтор</span>
          ) : (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mute">нет данных</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PANELS.map((p) => (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              aria-pressed={on[p.id]}
              className={`pressable rounded-full border px-3 py-1.5 text-xs font-medium ${on[p.id] ? "border-transparent text-bone" : "border-line text-mute hover:text-bone"}`}
              style={on[p.id] ? { background: "var(--accent2-soft)", color: "var(--accent2)" } : undefined}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* задержка под стрим — только для живых данных */}
        {mode === "live" && (
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
        )}
      </div>

      {/* нет живых данных и панели выключены — честное объяснение */}
      {mode !== "live" && !anyOn && (
        <div className="card-soft p-4 text-sm text-mute">
          <p>
            Живые позиции и рейс-контроль на русском появятся здесь во время сессии, когда будет доступен
            официальный поток данных.
          </p>
          {mode === "replay" && (
            <button onClick={showReplay} className="pressable mt-3 rounded-full border border-line px-3.5 py-1.5 text-xs text-bone hover:bg-surface-2">
              Показать повтор прошлой гонки
            </button>
          )}
        </div>
      )}

      {mode === "replay" && anyOn && frame && (
        <div className="rounded-[var(--r-card)] border border-line px-3.5 py-2 text-[11px] text-mute">
          Повтор: <span className="text-bone">{frame.session}</span> — не текущая сессия, не синхронизирован со стримом.
        </div>
      )}

      {on.positions && (frame ? <Tower frame={frame} prevOrder={prevOrder} changes={changes} /> : <Empty text="Позиции появятся с первым кадром данных." />)}
      {on.rc && <RaceFeed rc={frame?.rc ?? []} />}
      {on.weather && (frame?.weather ? <WeatherCard w={frame.weather} compact /> : <Empty text="Погода на трассе появится с данными сессии." />)}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="card-soft px-4 py-5 text-sm text-mute">{text}</div>;
}
