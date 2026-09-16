"use client";

import { useFavorites } from "@/lib/favorites";

const GOLD = "#E7B24B";

export function FavoriteStar({
  kind,
  id,
  size = 18,
  withLabel = false,
}: {
  kind: "driver" | "team";
  id: string;
  size?: number;
  withLabel?: boolean;
}) {
  const { has, toggle } = useFavorites(kind);
  const active = has(id);

  const star = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={active ? GOLD : "none"}
      stroke={active ? GOLD : "currentColor"}
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M12 3.5l2.6 5.3 5.9.86-4.25 4.14 1 5.87L12 17l-5.25 2.77 1-5.87L3.5 9.66l5.9-.86z" />
    </svg>
  );

  if (withLabel) {
    return (
      <button
        onClick={() => toggle(id)}
        aria-pressed={active}
        className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors"
        style={active ? { borderColor: `${GOLD}44`, background: `${GOLD}22`, color: GOLD } : { borderColor: "var(--line)", color: "var(--bone)" }}
      >
        {star}
        {active ? "В избранном" : "В избранное"}
      </button>
    );
  }

  return (
    <button
      onClick={() => toggle(id)}
      aria-pressed={active}
      title={active ? "В избранном" : "Добавить в избранное"}
      className={`inline-flex shrink-0 items-center justify-center ${active ? "" : "text-mute hover:text-bone"}`}
    >
      {star}
    </button>
  );
}
