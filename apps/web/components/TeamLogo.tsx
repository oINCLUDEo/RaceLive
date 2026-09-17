"use client";

// Логотип команды из public/teams/<slug>.<ext>. Перебор форматов: сначала webp,
// затем png, затем svg-плейсхолдер, иначе — цветной кружок. Кладите настоящие
// лого в любом из форматов (webp предпочтителен — легче), имя = slug.
import { useState } from "react";
import { TEAMS } from "@/lib/teams";

// webp (настоящее лого) → svg (плейсхолдер). Без png: лишний формат = холостой 404
// и мельтешение на страницах с 20 логотипами.
const EXTS = ["webp", "svg"] as const;

// vt — имя для View Transitions (shared-element): передавай только там, где логотип
// уникален на странице, иначе браузер бросит ошибку о дубле имени.
export function TeamLogo({ slug, size = 26, vt }: { slug: string; size?: number; vt?: string }) {
  const team = TEAMS[slug];
  const [i, setI] = useState(0);
  const vtStyle = vt ? { viewTransitionName: vt } : undefined;
  // Неизвестная команда — рендерим пустой слот (не null!), иначе ломается грид:
  // соседние ячейки съезжают, а имя обрезается в узкую колонку логотипа.
  if (!team) {
    return (
      <span
        className="inline-block shrink-0 rounded-lg"
        style={{ width: size, height: size, background: "var(--surface-2)" }}
      />
    );
  }

  if (i >= EXTS.length) {
    // все форматы отсутствуют — аккуратный цветной запасной вариант
    return (
      <span
        className="inline-block shrink-0 rounded-lg"
        title={team.name}
        style={{ width: size, height: size, background: team.color, ...vtStyle }}
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
      // небольшой равномерный отступ, чтобы лого не липло к краям квадрата
      style={{ width: size, height: size, padding: Math.round(size * 0.08), ...vtStyle }}
      onError={() => setI((n) => n + 1)}
    />
  );
}
