// Свои SVG-реакции вместо эмодзи: лайк, огонь, клетчатый флаг, обгон, молния.
// id совпадают с белым списком на бэкенде (routers/streams.py → REACTIONS).
export type ReactId = "like" | "fire" | "flag" | "overtake" | "bolt";

export const REACT_IDS: ReactId[] = ["like", "fire", "flag", "overtake", "bolt"];

export const REACT_LABEL: Record<ReactId, string> = {
  like: "Лайк",
  fire: "Огонь!",
  flag: "Финиш!",
  overtake: "Обгон!",
  bolt: "Молния",
};

export function ReactIcon({ id, size = 22, uid = "" }: { id: ReactId; size?: number; uid?: string }) {
  const g = `rg-${id}-${uid}`;
  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true } as const;

  if (id === "like")
    return (
      <svg {...common}>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF7A93" />
            <stop offset="1" stopColor="#E0402F" />
          </linearGradient>
        </defs>
        <path d="M12 21s-7.4-4.5-9.5-9.1C.9 8.3 3.1 4.6 6.7 4.6c2.1 0 3.6 1.1 4.4 2.5.8-1.4 2.3-2.5 4.4-2.5 3.6 0 5.8 3.7 4.3 7.3C18.8 16.5 12 21 12 21z" fill={`url(#${g})`} />
        <ellipse cx="7.6" cy="8.6" rx="1.9" ry="1.2" fill="#fff" opacity="0.45" transform="rotate(-30 7.6 8.6)" />
      </svg>
    );

  if (id === "fire")
    return (
      <svg {...common}>
        <defs>
          <linearGradient id={g} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#E0402F" />
            <stop offset="0.55" stopColor="#F5834F" />
            <stop offset="1" stopColor="#FFD166" />
          </linearGradient>
        </defs>
        <path d="M12 2.4c.8 3.4 5.6 5.6 5.6 11.1a5.6 5.6 0 0 1-11.2 0c0-2.7 1.4-4.6 2.9-5.9.1 2 1 3.1 2.2 3.6-.2-3.3-.6-6 .5-8.8z" fill={`url(#${g})`} />
        <path d="M12 11.6c.4 1.5 2.3 2.4 2.3 4.6a2.3 2.3 0 0 1-4.6 0c0-1.2.6-1.9 1.2-2.5.1.8.5 1.3 1 1.5-.1-1.5-.2-2.6.1-3.6z" fill="#FFE8A3" />
      </svg>
    );

  if (id === "flag") {
    const squares = [];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 4; c++)
        squares.push(<rect key={`${r}-${c}`} x={5.5 + c * 3.5} y={4 + r * 3} width="3.5" height="3" fill={(r + c) % 2 ? "#15121A" : "#F4EFEC"} />);
    return (
      <svg {...common}>
        <rect x="3.6" y="3" width="1.6" height="18" rx="0.8" fill="#C9C1C6" />
        <g>{squares}</g>
        <rect x="5.5" y="4" width="14" height="9" fill="none" stroke="#15121A" strokeWidth="0.6" />
      </svg>
    );
  }

  if (id === "overtake")
    return (
      <svg {...common}>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#6E7BF2" />
            <stop offset="1" stopColor="#4FD8E0" />
          </linearGradient>
        </defs>
        <path d="M4.5 6l6 6-6 6M12 6l6 6-6 6" fill="none" stroke={`url(#${g})`} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );

  // bolt
  return (
    <svg {...common}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF1A8" />
          <stop offset="1" stopColor="#E8C13A" />
        </linearGradient>
      </defs>
      <path d="M13.5 2L4.5 13.6h6.6L10 22l9.5-12.2h-6.8L13.5 2z" fill={`url(#${g})`} stroke="#B8901A" strokeWidth="0.6" strokeLinejoin="round" />
    </svg>
  );
}
