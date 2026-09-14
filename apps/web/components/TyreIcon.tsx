// SVG-иконка шины в стиле ТВ-худа: цветное кольцо + буква состава. Возраст — рядом.
type Tyre = "S" | "M" | "H" | "I" | "W";

const COLOR: Record<Tyre, string> = {
  S: "var(--red)",
  M: "var(--yellow)",
  H: "var(--bone)",
  I: "var(--green)",
  W: "var(--blue)",
};

export function TyreIcon({ compound, size = 20 }: { compound: Tyre; size?: number }) {
  const c = COLOR[compound];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label={`шина ${compound}`}>
      <circle cx="12" cy="12" r="10.5" fill="#0e0d10" stroke={c} strokeWidth="3" />
      <circle cx="12" cy="12" r="5.5" fill="none" stroke={c} strokeWidth="1.4" strokeOpacity="0.4" />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="9"
        fontWeight="700"
        fill={c}
      >
        {compound}
      </text>
    </svg>
  );
}
