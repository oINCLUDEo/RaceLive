"use client";

// Живой тайминг: подключается к Centrifugo и рисует кадры из канала timing:live.
// Пока нет кадра (не подключились / нет эфира) — показываем демо-превью как заглушку.
// centrifuge грузим динамически, чтобы он не попал в SSR-бандл.
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TeamLogo } from "@/components/TeamLogo";
import { TimingPreview } from "@/components/TimingPreview";

type Row = {
  pos: number;
  code: string;
  team: string;
  gap: string;
  tyre: "S" | "M" | "H";
  best?: boolean;
};
type Frame = {
  session?: string;
  lap?: number;
  total_laps?: number;
  rows: Row[];
  demo?: boolean;
};

const TYRE: Record<Row["tyre"], string> = {
  S: "var(--red)",
  M: "var(--yellow)",
  H: "var(--bone)",
};

export function LiveTiming({ wsUrl }: { wsUrl?: string }) {
  const [frame, setFrame] = useState<Frame | null>(null);
  const prevOrder = useRef<string[]>([]);

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
          if (!cancelled && ctx.data?.rows) setFrame(ctx.data);
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

  // Нет живого кадра — честная демо-заглушка (та же, что на главной).
  if (!frame) return <TimingPreview />;

  const order = prevOrder.current;
  const rows = frame.rows;

  return (
    <div className="card-soft overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 text-xs text-mute">
        <span className="flex items-center gap-2">
          <span className="live-dot" aria-hidden />
          {frame.session ?? "Тайминг"}
          {frame.lap != null && frame.total_laps != null && (
            <span className="tabular text-bone">
              {" "}
              круг {frame.lap}/{frame.total_laps}
            </span>
          )}
        </span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide">
          {frame.demo ? "демо-поток" : "эфир"}
        </span>
      </div>
      <div className="py-1.5">
        {rows.map((r) => {
          const moved = order.length > 0 && order[r.pos - 1] !== r.code;
          return (
            <motion.div
              layout
              key={r.code}
              transition={{ layout: { duration: 0.24, ease: [0.2, 0, 0, 1] } }}
              className={`grid grid-cols-[22px_26px_1fr_auto_22px] items-center gap-2.5 px-4 py-2.5 ${moved ? "row-flash" : ""}`}
            >
              <span className="tabular text-mute">{r.pos}</span>
              <TeamLogo slug={r.team} />
              <span className="font-display font-semibold">{r.code}</span>
              <span
                className="tabular text-right"
                style={r.best ? { color: "var(--purple)" } : undefined}
              >
                {r.gap}
              </span>
              <span
                className="tabular text-right text-xs font-semibold"
                style={{ color: TYRE[r.tyre] }}
              >
                {r.tyre}
              </span>
            </motion.div>
          );
        })}
      </div>
      <TrackOrder rows={rows} onRender={(o) => (prevOrder.current = o)} />
    </div>
  );
}

// Обновляем «предыдущий порядок» ПОСЛЕ рендера, чтобы row-flash срабатывал на смене позиции.
function TrackOrder({ rows, onRender }: { rows: Row[]; onRender: (o: string[]) => void }) {
  useEffect(() => {
    onRender(rows.map((r) => r.code));
  }, [rows, onRender]);
  return null;
}
