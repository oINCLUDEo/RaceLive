"use client";

// Фото гонщика из public/driver-photos/<driver_id>.webp|png. Пока файла нет —
// аккуратный аватар с инициалами в тоне команды. Настоящие фото — лицензируемые,
// подставляются файлами (как логотипы команд).
import { useState } from "react";
import { TEAMS } from "@/lib/teams";

export function DriverPhoto({
  id,
  name,
  teamSlug,
  photoUrl,
  size = 76,
  vt,
}: {
  id: string;
  name: string;
  teamSlug?: string | null;
  photoUrl?: string | null;
  size?: number;
  vt?: string;
}) {
  const [i, setI] = useState(0);
  const vtStyle = vt ? { viewTransitionName: vt } : undefined;
  const color = (teamSlug && TEAMS[teamSlug]?.color) || "var(--mute)";
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Источники по приоритету: локальный webp → локальный png → фото OpenF1 → инициалы.
  const sources = [`/driver-photos/${id}.webp`, `/driver-photos/${id}.png`, ...(photoUrl ? [photoUrl] : [])];

  if (i >= sources.length) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-2xl font-display font-bold"
        style={{
          width: size,
          height: size,
          background: `color-mix(in srgb, ${color} 20%, var(--surface-2))`,
          color: "var(--bone)",
          fontSize: Math.round(size * 0.34),
          ...vtStyle,
        }}
        aria-label={name}
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[i]}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 rounded-2xl object-cover"
      style={{ width: size, height: size, background: "var(--surface-2)", ...vtStyle }}
      onError={() => setI((n) => n + 1)}
    />
  );
}
