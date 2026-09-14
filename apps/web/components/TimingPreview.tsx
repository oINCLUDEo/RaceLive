"use client";

// Живой тайминг-тауэр (демо, проигрывает круги в цикле). Логотипы команд слева.
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TeamLogo } from "@/components/TeamLogo";

type Row = { code: string; team: string; gap: string; tyre: "S" | "M" | "H"; best?: boolean };

const FRAMES: Row[][] = [
  [
    { code: "NOR", team: "mclaren", gap: "1:40.203", tyre: "M" },
    { code: "VER", team: "redbull", gap: "+0.056", tyre: "M" },
    { code: "LEC", team: "ferrari", gap: "+0.241", tyre: "S" },
    { code: "PIA", team: "mclaren", gap: "+0.402", tyre: "M" },
  ],
  [
    { code: "NOR", team: "mclaren", gap: "1:40.121", tyre: "M", best: true },
    { code: "VER", team: "redbull", gap: "+0.102", tyre: "M" },
    { code: "LEC", team: "ferrari", gap: "+0.233", tyre: "S" },
    { code: "PIA", team: "mclaren", gap: "+0.388", tyre: "M" },
  ],
  [
    { code: "VER", team: "redbull", gap: "1:40.098", tyre: "M", best: true },
    { code: "NOR", team: "mclaren", gap: "+0.041", tyre: "M" },
    { code: "LEC", team: "ferrari", gap: "+0.210", tyre: "S" },
    { code: "PIA", team: "mclaren", gap: "+0.402", tyre: "M" },
  ],
];

const TYRE: Record<Row["tyre"], string> = {
  S: "var(--red)",
  M: "var(--yellow)",
  H: "var(--bone)",
};

export function TimingPreview() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % FRAMES.length), 1900);
    return () => clearInterval(id);
  }, []);

  const rows = FRAMES[i];
  const prev = FRAMES[(i + FRAMES.length - 1) % FRAMES.length];

  return (
    <div className="card-soft overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 text-xs text-mute">
        <span className="flex items-center gap-2">
          <span className="live-dot" aria-hidden />
          Квалификация · Q3 · Баку
        </span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide">
          демо
        </span>
      </div>
      <div className="py-1.5">
        {rows.map((r, pos) => {
          const moved = prev[pos]?.code !== r.code;
          return (
            <motion.div
              layout
              key={r.code}
              transition={{ layout: { duration: 0.24, ease: [0.2, 0, 0, 1] } }}
              className={`grid grid-cols-[22px_26px_1fr_auto_22px] items-center gap-2.5 px-4 py-2.5 ${moved ? "row-flash" : ""}`}
            >
              <span className="tabular text-mute">{pos + 1}</span>
              <TeamLogo slug={r.team} />
              <span className="font-display font-semibold">{r.code}</span>
              <span className="tabular text-right" style={r.best ? { color: "var(--purple)" } : undefined}>
                {r.gap}
              </span>
              <span className="tabular text-right text-xs font-semibold" style={{ color: TYRE[r.tyre] }}>
                {r.tyre}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
