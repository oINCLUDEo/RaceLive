// Индикатор статуса сессии (флаг): зелёный / SC / VSC / красный / клетчатый.
type Status = "green" | "yellow" | "sc" | "vsc" | "red" | "chequered";

const MAP: Record<Status, { label: string; color: string }> = {
  green: { label: "Гонка идёт", color: "var(--green)" },
  yellow: { label: "Жёлтый флаг", color: "var(--yellow)" },
  sc: { label: "Сейфти-кар", color: "var(--yellow)" },
  vsc: { label: "Virtual SC", color: "var(--yellow)" },
  red: { label: "Красный флаг", color: "var(--red)" },
  chequered: { label: "Финиш", color: "var(--bone)" },
};

function Flag({ status, color }: { status: Status; color: string }) {
  if (status === "sc" || status === "vsc") {
    return (
      <span className="text-[10px] font-extrabold" style={{ color }}>
        {status === "sc" ? "SC" : "VSC"}
      </span>
    );
  }
  if (status === "chequered") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24">
        <path d="M5 2v20" stroke="var(--bone)" strokeWidth="2" strokeLinecap="round" />
        <g>
          <rect x="6" y="3" width="4" height="3" fill="var(--bone)" />
          <rect x="14" y="3" width="4" height="3" fill="var(--bone)" />
          <rect x="10" y="6" width="4" height="3" fill="var(--bone)" />
          <rect x="6" y="9" width="4" height="3" fill="var(--bone)" />
          <rect x="14" y="9" width="4" height="3" fill="var(--bone)" />
        </g>
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 24 24">
      <path d="M5 2v20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 3h13l-2.6 4 2.6 4H5z" fill={color} />
    </svg>
  );
}

export function SessionFlag({ status }: { status?: string }) {
  const s = (status ?? "green") as Status;
  const cfg = MAP[s] ?? MAP.green;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5"
      style={{ background: `color-mix(in srgb, ${cfg.color} 16%, transparent)`, color: cfg.color }}
      title={cfg.label}
    >
      <Flag status={s} color={cfg.color} />
      <span className="text-[10px] font-semibold uppercase tracking-wide">{cfg.label}</span>
    </span>
  );
}
