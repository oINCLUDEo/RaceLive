// SVG-иконка шины в стиле ТВ-худа: цветное кольцо + буква состава. Возраст — рядом.
type Tyre = "S" | "M" | "H" | "I" | "W";

// Явные hex (не CSS-переменные): var() в SVG-атрибутах fill/stroke не резолвится.
// Функциональные цвета данных всё равно фиксированы и не меняются от темы.
const COLOR: Record<Tyre, string> = {
  S: "#E5484D",
  M: "#E8C13A",
  H: "#EDE6E4",
  I: "#4FD87A",
  W: "#3E8FE0",
};

export function TyreIcon({ compound, size = 22 }: { compound: Tyre; size?: number }) {
  const c = COLOR[compound];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label={`шина ${compound}`}>
      <circle cx="12" cy="12" r="10.4" fill="#0e0d10" stroke={c} strokeWidth="3.2" />
      <text
        x="12"
        y="16.1"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="12"
        fontWeight="800"
        fill={c}
      >
        {compound}
      </text>
    </svg>
  );
}
