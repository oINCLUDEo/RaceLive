"use client";

// Логотип команды из public/teams/<slug>.<ext>. Перебор форматов: сначала webp,
// затем png, затем svg-плейсхолдер, иначе — цветной кружок. Кладите настоящие
// лого в любом из форматов (webp предпочтителен — легче), имя = slug.
import { useState } from "react";
import { TEAMS } from "@/lib/teams";

const EXTS = ["webp", "png", "svg"] as const;

export function TeamLogo({ slug, size = 26 }: { slug: string; size?: number }) {
  const team = TEAMS[slug];
  const [i, setI] = useState(0);
  if (!team) return null;

  if (i >= EXTS.length) {
    // все форматы отсутствуют — аккуратный цветной запасной вариант
    return (
      <span
        className="inline-block shrink-0 rounded-lg"
        title={team.name}
        style={{ width: size, height: size, background: team.color }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/teams/${slug}.${EXTS[i]}`}
      alt={team.name}
      title={team.name}
      width={size}
      height={size}
      className="team-logo"
      style={{ width: size, height: size }}
      onError={() => setI((n) => n + 1)}
    />
  );
}
