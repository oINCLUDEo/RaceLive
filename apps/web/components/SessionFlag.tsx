// Индикатор статуса сессии. Зелёный — приглушённо; SC/VSC/красный/финиш — заметно
// (сплошная плашка, у тревожных статусов пульсирующая точка), как в трансляции.
type Status = "green" | "yellow" | "sc" | "vsc" | "red" | "chequered";

type Cfg = { label: string; color: string; solid?: boolean; pulse?: boolean; checker?: boolean };

const MAP: Record<Status, Cfg> = {
  green: { label: "Зелёный флаг", color: "var(--green)" },
  yellow: { label: "Жёлтый флаг", color: "var(--yellow)" },
  sc: { label: "Safety Car", color: "var(--yellow)", solid: true, pulse: true },
  vsc: { label: "Virtual SC", color: "var(--yellow)", solid: true, pulse: true },
  red: { label: "Красный флаг", color: "var(--red)", solid: true, pulse: true },
  chequered: { label: "Финиш", color: "var(--bone)", solid: true, checker: true },
};

function Checker() {
  return (
    <svg width="12" height="9" viewBox="0 0 12 9" aria-hidden>
      <rect width="12" height="9" fill="#151316" opacity="0.12" />
      <g fill="#151316">
        <rect x="0" y="0" width="4" height="3" />
        <rect x="8" y="0" width="4" height="3" />
        <rect x="4" y="3" width="4" height="3" />
        <rect x="0" y="6" width="4" height="3" />
        <rect x="8" y="6" width="4" height="3" />
      </g>
    </svg>
  );
}

export function SessionFlag({ status }: { status?: string }) {
  const s = (status ?? "green") as Status;
  const cfg = MAP[s] ?? MAP.green;
  const dark = "#151316";
  const style = cfg.solid
    ? { background: cfg.color, color: s === "red" ? "#fff" : dark }
    : { background: `color-mix(in srgb, ${cfg.color} 16%, transparent)`, color: cfg.color };

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={style}
      title={cfg.label}
    >
      {cfg.pulse && (
        <span
          className="live-dot"
          style={{ background: s === "red" ? "#fff" : dark }}
          aria-hidden
        />
      )}
      {cfg.checker && <Checker />}
      {cfg.label}
    </span>
  );
}
