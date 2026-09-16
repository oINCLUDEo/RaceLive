"use client";

// Фото гонщика из public/driver-photos/<driver_id>.webp|png. Пока файла нет —
// аккуратный аватар с инициалами в тоне команды. Настоящие фото — лицензируемые,
// подставляются файлами (как логотипы команд).
import { useState } from "react";
import { TEAMS } from "@/lib/teams";

const EXTS = ["webp", "png"] as const;

export function DriverPhoto({
  id,
  name,
  teamSlug,
  size = 76,
}: {
  id: string;
  name: string;
  teamSlug?: string | null;
  size?: number;
}) {
  const [i, setI] = useState(0);
  const color = (teamSlug && TEAMS[teamSlug]?.color) || "var(--mute)";
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (i >= EXTS.length) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-2xl font-display font-bold"
        style={{
          width: size,
          height: size,
          background: `color-mix(in srgb, ${color} 20%, var(--surface-2))`,
          color: "var(--bone)",
          fontSize: Math.round(size * 0.34),
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
      src={`/driver-photos/${id}.${EXTS[i]}`}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 rounded-2xl object-cover"
      style={{ width: size, height: size, background: "var(--surface-2)" }}
      onError={() => setI((n) => n + 1)}
    />
  );
}
