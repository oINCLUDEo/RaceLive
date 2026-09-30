"use client";

// Плитка «Битвы» — как графика официальной трансляции: сама раскрывается, когда
// машины сближаются меньше чем на секунду (пары и «поезда»), показывает разрыв между
// каждыми соседями и тренд. Ниже — прогноз: кто кого догоняет и примерно через
// сколько кругов начнётся борьба. Всё считает сервер (apps/api/app/battles.py).
import { AnimatePresence, motion } from "framer-motion";
import type { Battle, BattleCar, Forecast } from "@/components/LiveTiming";
import { TEAMS } from "@/lib/teams";

const colorOf = (team: string) => TEAMS[team]?.color ?? "var(--bone)";

// Тренд разрыва — это данные, поэтому цветной: сокращает — зелёный, отпускает — приглушён.
const TREND = {
  closing: { color: "var(--green)", label: "Сокращает", arrow: "M6 9l6 6 6-6" },
  holding: { color: "var(--bone)", label: "Держится", arrow: "M5 12h14" },
  pulling: { color: "var(--mute)", label: "Отпускает", arrow: "M6 15l6-6 6 6" },
} as const;

function Car({ c }: { c: BattleCar }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-surface-2 py-1 pl-1.5 pr-2">
      <span className="tabular w-4 text-right text-[11px] text-mute">{c.pos}</span>
      <span className="h-4 w-[3px] rounded-full" style={{ background: colorOf(c.team) }} />
      <span className="font-display text-[13px] font-semibold tracking-wide">{c.code}</span>
    </span>
  );
}

function Gap({ gap, trend }: { gap: number; trend: keyof typeof TREND }) {
  const t = TREND[trend];
  return (
    <span className="flex min-w-[52px] flex-1 flex-col items-center gap-1 px-1" title={`${t.label}: ${gap.toFixed(3)} с`}>
      <span className="tabular inline-flex items-center gap-0.5 text-[12px] font-semibold" style={{ color: t.color }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d={t.arrow} />
        </svg>
        {gap.toFixed(2)}
      </span>
      {/* близость: 1 с — пусто, вплотную — полная шкала */}
      <span className="block h-[3px] w-full overflow-hidden rounded-full bg-surface-2">
        <span
          className="block h-full rounded-full transition-[width] duration-700"
          style={{ width: `${Math.round(Math.max(0.06, 1 - gap) * 100)}%`, background: t.color }}
        />
      </span>
    </span>
  );
}

const TRAIN_MAX = 5; // длинный поезд (после рестарта) — первые машины и «ещё N»

function BattleRow({ b }: { b: Battle }) {
  const last = b.cars[b.cars.length - 1];
  const cars = b.cars.slice(0, TRAIN_MAX);
  const more = b.cars.length - cars.length;
  const title = b.cars.length > 2 ? `Поезд · P${b.pos}–P${last.pos}` : `Битва за P${b.pos}`;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="border-b border-line px-4 py-3">
        <div className="eyebrow mb-2">{title}</div>
        {cars.length === 2 ? (
          // пара — в строку: машина · разрыв · машина
          <div className="flex items-center">
            <Car c={cars[0]} />
            <Gap gap={b.gaps[0]} trend={b.trends[0]} />
            <Car c={cars[1]} />
          </div>
        ) : (
          // поезд — столбиком: у каждой машины отставание от впереди идущей
          <ol className="flex flex-col gap-1.5">
            {cars.map((c, i) => (
              <li key={c.code} className="flex items-center gap-2">
                <Car c={c} />
                {i === 0 ? (
                  <span className="flex-1 text-right text-[12px] text-mute">Во главе</span>
                ) : (
                  <span className="flex flex-1 justify-end">
                    <span className="w-[120px]">
                      <Gap gap={b.gaps[i - 1]} trend={b.trends[i - 1]} />
                    </span>
                  </span>
                )}
              </li>
            ))}
            {more > 0 && <li className="pl-1 text-[12px] text-mute">И ещё {more} в поезде</li>}
          </ol>
        )}
      </div>
    </motion.li>
  );
}

function ForecastRow({ f }: { f: Forecast }) {
  // Шкала: от текущего разрыва до зоны атаки (1 с). Заполнение — сколько уже «съедено».
  const toZone = Math.max(0, f.gap - 1);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="px-4 py-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Car c={f.behind} />
          <span className="text-[12px] text-mute">догоняет</span>
          <Car c={f.ahead} />
        </div>
        <div className="shrink-0 text-right leading-tight">
          <div className="tabular font-display text-lg font-semibold">~{f.laps}</div>
          <div className="text-[11px] text-mute">{f.laps === 1 ? "круг" : f.laps < 5 ? "круга" : "кругов"}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="relative block h-[4px] flex-1 overflow-hidden rounded-full bg-surface-2">
          <span
            className="absolute inset-y-0 right-0 rounded-full transition-[width] duration-700"
            style={{ width: `${Math.max(4, Math.min(100, (1 - toZone / 11) * 100))}%`, background: colorOf(f.behind.team) }}
          />
        </span>
        <span className="tabular shrink-0 text-[12px] text-mute">
          {f.gap.toFixed(1)} с · −{f.rate.toFixed(2)} с/круг
        </span>
      </div>
    </motion.li>
  );
}

export function Battles({ battles = [], forecast = [] }: { battles?: Battle[]; forecast?: Forecast[] }) {
  return (
    <section className="card-soft overflow-hidden" aria-label="Битвы за позицию">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <span className="font-display text-sm font-semibold">Битвы за позицию</span>
        <span className="eyebrow">{battles.length ? `${battles.length} сейчас` : "Нет"}</span>
      </div>

      <ul>
        <AnimatePresence initial={false}>
          {battles.map((b) => (
            <BattleRow key={b.cars.map((c) => c.code).join("-")} b={b} />
          ))}
        </AnimatePresence>
      </ul>
      {!battles.length && (
        <p className="border-b border-line px-4 py-3 text-[13px] text-mute">
          Все дальше секунды друг от друга. Битва появится здесь сама, как только кто-то подъедет в зону атаки.
        </p>
      )}

      {forecast.length > 0 && (
        <>
          <div className="eyebrow px-4 pb-1 pt-3" title="По темпу последних кругов и тому, как сокращается разрыв">
            Прогноз битвы
          </div>
          <ul className="divide-y divide-[var(--line)]">
            <AnimatePresence initial={false}>
              {forecast.map((f) => (
                <ForecastRow key={`${f.behind.code}-${f.ahead.code}`} f={f} />
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}
    </section>
  );
}
