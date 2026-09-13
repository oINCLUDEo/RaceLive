"use client";

// Герой главной — сам продукт: таблица тайминга, проигрывающая круги в цикле (§8.5).
// Данные демонстрационные. Настоящий тайминг — Фаза 3 (Centrifugo).
import { useEffect, useState } from "react";

type Row = { code: string; gap: string; tyre: "S" | "M" | "H"; best?: boolean };

const FRAMES: Row[][] = [
  [
    { code: "VER", gap: "лидер", tyre: "M" },
    { code: "NOR", gap: "+0.214", tyre: "M" },
    { code: "LEC", gap: "+1.902", tyre: "S" },
    { code: "PIA", gap: "+2.145", tyre: "M" },
    { code: "SAI", gap: "+3.410", tyre: "H" },
  ],
  [
    { code: "VER", gap: "лидер", tyre: "M" },
    { code: "NOR", gap: "+0.102", tyre: "M", best: true },
    { code: "LEC", gap: "+1.740", tyre: "S" },
    { code: "PIA", gap: "+2.301", tyre: "M" },
    { code: "SAI", gap: "+3.588", tyre: "H" },
  ],
  [
    { code: "NOR", gap: "лидер", tyre: "M" },
    { code: "VER", gap: "+0.056", tyre: "M" },
    { code: "LEC", gap: "+1.633", tyre: "S", best: true },
    { code: "PIA", gap: "+2.410", tyre: "M" },
    { code: "SAI", gap: "+3.902", tyre: "H" },
  ],
  [
    { code: "NOR", gap: "лидер", tyre: "M" },
    { code: "VER", gap: "+0.180", tyre: "M" },
    { code: "PIA", gap: "+2.004", tyre: "M" },
    { code: "LEC", gap: "+2.233", tyre: "S" },
    { code: "SAI", gap: "+4.115", tyre: "H" },
  ],
];

const TYRE_COLOR: Record<Row["tyre"], string> = {
  S: "var(--red)",
  M: "var(--yellow)",
  H: "var(--bone)",
};

export function TimingPreview() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % FRAMES.length), 1800);
    return () => clearInterval(id);
  }, []);

  const rows = FRAMES[i];
  const prev = FRAMES[(i + FRAMES.length - 1) % FRAMES.length];

  return (
    <div className="border border-line bg-surface-1">
      <div className="flex items-center justify-between border-b border-line px-3 py-2 text-xs text-mute">
        <span className="flex items-center gap-2">
          <span className="live-dot" aria-hidden />
          Квалификация · демонстрация
        </span>
        <span className="tabular">Q3</span>
      </div>
      <table className="w-full border-collapse text-[15px]">
        <tbody>
          {rows.map((r, pos) => {
            const moved = prev[pos]?.code !== r.code;
            return (
              <tr
                key={pos}
                className={`border-b border-line last:border-0 ${moved ? "row-flash" : ""}`}
              >
                <td className="tabular w-8 px-3 py-2 text-mute">{pos + 1}</td>
                <td className="px-2 py-2 font-display font-semibold">{r.code}</td>
                <td
                  className="tabular px-2 py-2 text-right"
                  style={r.best ? { color: "var(--purple)" } : undefined}
                >
                  {r.gap}
                </td>
                <td className="px-3 py-2 text-right">
                  <span
                    className="tabular inline-block w-5 text-center text-xs font-semibold"
                    style={{ color: TYRE_COLOR[r.tyre] }}
                  >
                    {r.tyre}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
