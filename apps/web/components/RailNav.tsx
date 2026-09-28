"use client";

// Навбар-рейл с активным пунктом по текущему маршруту (раньше «Главная» подсвечивалась
// всегда, т.к. активность была захардкожена).
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";

export type RailItem = { href: string; label: string; icon: string; also?: string[] };

// «Сезон» — общий раздел: календарь и зачёт (вкладки), поэтому активен на обоих путях.
export const RAIL: RailItem[] = [
  { href: "/", label: "Главная", icon: "M3 11l9-8 9 8 M5 10v10h14V10" },
  { href: "/schedule", label: "Сезон", icon: "M4 5h16v16H4z M4 10h16 M9 3v4 M15 3v4 M8 14h3 M8 17h6", also: ["/standings"] },
  { href: "/live", label: "Эфир", icon: "M2 6h14v12H2z M16 10l6-3v10l-6-3" },
  { href: "/tracks", label: "Трассы", icon: "M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z M9 7v13 M15 4v13" },
  { href: "/compare", label: "Сравнение", icon: "M9 5L5 9l4 4 M15 19l4-4-4-4 M5 9h13 M19 15H6" },
  { href: "/glossary", label: "Словарь", icon: "M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z M4 19.5A2.5 2.5 0 016.5 17H20" },
  { href: "/changelog", label: "Обновления", icon: "M3 12a9 9 0 1 0 3-6.7 M3 5v4h4 M12 8v4l3 2" },
];

export function isActive(item: RailItem, path: string): boolean {
  if (item.href === "/") return path === "/";
  return [item.href, ...(item.also ?? [])].some((h) => path.startsWith(h));
}

export function RailNav() {
  const path = usePathname();
  return (
    <>
      {RAIL.map((r) => (
        <Link key={r.label} href={r.href} className={`rail-i ${isActive(r, path) ? "on" : ""}`} aria-label={r.label} title={r.label}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d={r.icon} />
          </svg>
        </Link>
      ))}
    </>
  );
}
