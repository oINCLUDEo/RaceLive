"use client";

// Живой тайминг: подключается к Centrifugo и рисует кадры из канала timing:live.
// Слева — таблица позиций, справа — лента рейс-контроля на русском (ключевая ценность).
// Пока нет кадра — таблица показывает демо-превью, лента — заглушку.
// centrifuge грузим динамически, чтобы он не попал в SSR-бандл.
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ReplaySpeed } from "@/components/ReplaySpeed";
import { SessionFlag } from "@/components/SessionFlag";
import { TeamLogo } from "@/components/TeamLogo";
import { Tip } from "@/components/Tip";
import { TimingPreview } from "@/components/TimingPreview";
import { TyreIcon } from "@/components/TyreIcon";
import { WeatherCard } from "@/components/WeatherCard";

export type Tyre = "S" | "M" | "H" | "I" | "W";
export type Row = {
  pos: number;
  code: string;
  team: string;
  gap: string;
  int?: string;
  tyre: Tyre | null;
  tyre_age?: number | null;
  best?: boolean;
  pen?: number | null;
  inv?: "invest" | "noted" | null;
  pit?: boolean;
  stops?: number;
};
export type RcMessage = {
  lap: number;
  cat: string;
  flag: string | null;
  message: string;
  message_ru: string;
};
export type Frame = {
  session?: string;
  lap?: number;
  total_laps?: number;
  rows: Row[];
  rc?: RcMessage[];
  demo?: boolean;
  badge?: string;
  note?: string;
  flag?: string;
  fastest?: { code: string | null; time: string | null } | null;
  weather?: {
    track: number | null;
    air: number | null;
    humidity: number | null;
    wind: number | null;
    wind_dir: number | null;
    rain: boolean;
  } | null;
};

// Иконки для строки статистики
const Icon = {
  stop: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V9M9 2h6" />
    </svg>
  ),
  temp: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 14V5a2 2 0 10-4 0v9a4 4 0 104 0z" />
    </svg>
  ),
  rain: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3s6 7 6 11a6 6 0 11-12 0c0-4 6-11 6-11z" />
    </svg>
  ),
};

// Цвет маркера события рейс-контроля: сначала по флагу, иначе по категории.
function rcColor(m: RcMessage): string {
  switch (m.flag) {
    case "yellow":
      return "var(--yellow)";
    case "green":
      return "var(--green)";
    case "red":
      return "var(--red)";
    case "blue":
      return "var(--blue)";
  }
  if (m.cat === "penalty") return "var(--red)";
  if (m.cat === "drs") return "var(--accent2)";
  return "var(--mute)";
}

export function LiveTiming({
  wsUrl,
  variant = "full",
  streamSlot,
}: {
  wsUrl?: string;
  variant?: "full" | "side";
  streamSlot?: React.ReactNode;
}) {
  const [frame, setFrame] = useState<Frame | null>(null);
  const [changes, setChanges] = useState<Record<string, "up" | "down">>({});
  const prevOrder = useRef<string[]>([]);
  const prevPos = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!wsUrl) return;
    let cancelled = false;
    let centrifuge: { disconnect: () => void } | null = null;

    (async () => {
      try {
        const { Centrifuge } = await import("centrifuge");
        const c = new Centrifuge(wsUrl);
        const sub = c.newSubscription("timing:live");
        sub.on("publication", (ctx: { data: Frame }) => {
          const data = ctx.data;
          if (cancelled || !data?.rows) return;
          // отмечаем, кто с кем разменялся позициями (стрелка держится ~6 c)
          const np: Record<string, number> = {};
          const nc: Record<string, "up" | "down"> = {};
          for (const r of data.rows) {
            np[r.code] = r.pos;
            const prev = prevPos.current[r.code];
            if (prev != null && prev !== r.pos) nc[r.code] = r.pos < prev ? "up" : "down";
          }
          prevPos.current = np;
          if (Object.keys(nc).length) {
            setChanges((c) => ({ ...c, ...nc }));
            for (const code of Object.keys(nc)) {
              window.setTimeout(() => {
                if (!cancelled)
                  setChanges((c) => {
                    const n = { ...c };
                    delete n[code];
                    return n;
                  });
              }, 6000);
            }
          }
          setFrame(data);
        });
        sub.subscribe();
        c.connect();
        centrifuge = c;
      } catch {
        // centrifuge не загрузился / URL кривой — останется демо-заглушка
      }
    })();

    return () => {
      cancelled = true;
      try {
        centrifuge?.disconnect();
      } catch {
        /* noop */
      }
    };
  }, [wsUrl]);

  const rc = frame?.rc ?? [];
  const timing = frame ? <Tower frame={frame} prevOrder={prevOrder} changes={changes} /> : <TimingPreview />;

  return (
    <div className="flex flex-col gap-4">
      {/* УПРАВЛЕНИЕ РЕПЛЕЕМ (только когда идёт реплей) */}
      {frame?.badge === "реплей" && (
        <div className="flex justify-end">
          <ReplaySpeed />
        </div>
      )}

      {/* ПОЯСНЕНИЕ ОТ БЭКЕНДА (напр. идёт сессия, а показываем повтор) */}
      {frame?.note && (
        <div
          className="flex items-start gap-2.5 rounded-[var(--r-card)] border px-4 py-3 text-sm"
          style={{ borderColor: "var(--accent2-soft)", background: "var(--accent2-soft)" }}
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent2)" }} aria-hidden />
          <span className="text-bone">{frame.note}</span>
        </div>
      )}

      {/* ПОГОДА НА ТРАССЕ (вверху) */}
      {frame?.weather && <WeatherCard w={frame.weather} />}

      {variant === "side" ? (
        // Бок о бок: слева стрим кастера, справа таблица позиций; рейс-контроль лентой снизу.
        <>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
            <div className="min-w-0">{streamSlot}</div>
            {timing}
          </div>
          <RaceFeed rc={rc} />
        </>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,440px)_1fr]">
          {timing}
          <RaceFeed rc={rc} />
        </div>
      )}
    </div>
  );
}

export function Tower({
  frame,
  prevOrder,
  changes,
}: {
  frame: Frame;
  prevOrder: React.MutableRefObject<string[]>;
  changes: Record<string, "up" | "down">;
}) {
  const order = prevOrder.current;
  const rows = frame.rows;
  const pct =
    frame.lap != null && frame.total_laps
      ? Math.min(100, Math.round((frame.lap / frame.total_laps) * 100))
      : null;
  const hasStats = pct != null || !!frame.fastest?.code;

  return (
    <div className="card-soft overflow-hidden self-start">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 text-xs text-mute">
        <span className="flex min-w-0 items-center gap-2">
          <span className="live-dot" aria-hidden />
          <span className="truncate">{frame.session ?? "Тайминг"}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {frame.flag && <SessionFlag status={frame.flag} />}
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide">
            {frame.badge ?? (frame.demo ? "демо-поток" : "эфир")}
          </span>
        </span>
      </div>

      {/* СТРОКА СТАТИСТИКИ: прогресс круга · быстрейший круг · погода */}
      {hasStats && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5 text-[11px]">
          {pct != null && (
            <span className="flex min-w-[150px] flex-1 items-center gap-2 text-mute">
              <span className="tabular whitespace-nowrap font-semibold text-bone">
                Круг {frame.lap}/{frame.total_laps}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full bg-[var(--ember)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
              </span>
            </span>
          )}
          {frame.fastest?.code && (
            <Tip
              text="Быстрейший круг"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: "color-mix(in srgb, var(--purple) 15%, transparent)" }}
            >
              <span style={{ color: "var(--purple)" }}>{Icon.stop}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--purple)" }}>БК</span>
              <span className="font-semibold text-bone">{frame.fastest.code}</span>
              {frame.fastest.time && <span className="tabular text-mute">{frame.fastest.time}</span>}
            </Tip>
          )}
        </div>
      )}

      <div className="py-1.5">
        {rows.map((r) => {
          const moved = order.length > 0 && order[r.pos - 1] !== r.code;
          const gained = changes[r.code] === "up";
          const hasInt = !!r.int && r.int !== "";
          // Главное число — интервал до впереди идущего; мелким снизу — отрыв от лидера.
          const mainGap = r.pos === 1 ? r.gap : hasInt ? r.int : r.gap;
          const subGap = r.pos === 1 ? "" : hasInt ? r.gap : "";
          return (
            <motion.div
              layout
              key={r.code}
              transition={{ layout: { duration: 0.24, ease: [0.2, 0, 0, 1] } }}
              className={`grid grid-cols-[34px_24px_1fr_auto_auto] items-center gap-2.5 px-4 py-2 ${gained ? "overtake-trail" : moved ? "row-flash" : ""}`}
            >
              <span className="tabular flex items-center gap-0.5 text-mute">
                <span>{r.pos}</span>
                {changes[r.code] === "up" && (
                  <span className="text-[9px] leading-none" style={{ color: "var(--green)" }}>▲</span>
                )}
                {changes[r.code] === "down" && (
                  <span className="text-[9px] leading-none" style={{ color: "var(--red)" }}>▼</span>
                )}
              </span>
              <TeamLogo slug={r.team} />
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="font-display font-semibold">{r.code}</span>
                {r.pit ? <StatusBadge color="var(--blue)" text="БОКС" title="На пит-стопе" /> : null}
                {r.pen ? <StatusBadge color="var(--red)" text={`+${r.pen}с`} title="Штраф по времени" /> : null}
                {r.inv === "invest" ? <InvestBlock color="var(--yellow)" title="Под расследованием" /> : null}
                {r.inv === "noted" ? <InvestBlock color="var(--mute)" title="Инцидент замечен" /> : null}
              </span>
              <span className="text-right leading-tight">
                <span className="tabular block" style={r.best ? { color: "var(--purple)" } : undefined}>
                  {mainGap}
                </span>
                {subGap && <span className="tabular block text-[10px] text-mute">{subGap}</span>}
              </span>
              <Tip
                as="span"
                text="Шина, возраст в кругах и число пит-стопов"
                className="flex w-10 flex-col items-center justify-center"
              >
                {r.tyre && <TyreIcon compound={r.tyre} />}
                {r.tyre_age != null && (
                  <span className="tabular mt-0.5 text-[9px] leading-none text-mute">
                    {r.tyre_age} кр{r.stops ? ` · ${r.stops}п` : ""}
                  </span>
                )}
              </Tip>
            </motion.div>
          );
        })}
      </div>
      <TrackOrder rows={rows} onRender={(o) => (prevOrder.current = o)} />
    </div>
  );
}

// Лента рейс-контроля (переиспользуется в обеих раскладках).
export function RaceFeed({ rc }: { rc: RcMessage[] }) {
  return (
    <div className="card-soft flex max-h-[560px] flex-col overflow-hidden self-start">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 text-xs text-mute">
        <span>Рейс-контроль{rc.length > 0 && <span className="tabular text-bone"> · {rc.length}</span>}</span>
        <span className="text-[10px] uppercase tracking-wide">на русском</span>
      </div>
      {rc.length === 0 ? (
        <div className="px-4 py-6 text-sm text-mute">
          Здесь появятся сообщения рейс-контроля — флаги, сейфти-кар, штрафы и расследования, переведённые на русский.
        </div>
      ) : (
        <ul className="no-scrollbar overflow-y-auto">
          {rc.map((m, i) => (
            <li key={`${m.lap}-${i}-${m.message}`} className={`flex gap-3 px-4 py-3 ${i < rc.length - 1 ? "border-b border-line" : ""}`}>
              <span className="mt-1 h-3 w-[3px] shrink-0 rounded-full" style={{ background: rcColor(m) }} aria-hidden />
              <div className="min-w-0">
                <div className="text-sm leading-snug">{m.message_ru}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-mute">
                  {m.lap != null && <span className="tabular">Круг {m.lap}</span>}
                  <span className="truncate opacity-70">{m.message}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Маркер статуса пилота: штраф (+Nс).
function StatusBadge({ color, text, title }: { color: string; text: string; title: string }) {
  return (
    <Tip
      text={title}
      className="tabular shrink-0 rounded px-1 text-[10px] font-semibold leading-[1.4]"
      style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      {text}
    </Tip>
  );
}

// Расследование/замечен — восклицательный знак в блоке (как в оригинальном худе).
function InvestBlock({ color, title }: { color: string; title: string }) {
  return (
    <Tip
      text={title}
      className="inline-flex h-[15px] w-[13px] shrink-0 items-center justify-center rounded-[3px] text-[11px] font-extrabold leading-none"
      style={{ color: "#151316", background: color }}
    >
      !
    </Tip>
  );
}

// Обновляем «предыдущий порядок» ПОСЛЕ рендера, чтобы row-flash срабатывал на смене позиции.
function TrackOrder({ rows, onRender }: { rows: Row[]; onRender: (o: string[]) => void }) {
  useEffect(() => {
    onRender(rows.map((r) => r.code));
  }, [rows, onRender]);
  return null;
}
