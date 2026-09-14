"use client";

// Навбар-рейл с активным пунктом по текущему маршруту (раньше «Главная» подсвечивалась
// всегда, т.к. активность была захардкожена).
import Link from "next/link";
import { usePathname } from "next/navigation";

const RAIL = [
  { href: "/", label: "Главная", icon: "M3 11l9-8 9 8 M5 10v10h14V10" },
  { href: "/schedule", label: "Расписание", icon: "M3 5h18 M3 12h18 M3 19h18" },
  { href: "/live", label: "Эфир", icon: "M2 6h14v12H2z M16 10l6-3v10l-6-3" },
  { href: "/tracks", label: "Трассы", icon: "M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z M9 7v13 M15 4v13" },
  { href: "/standings", label: "Зачёт", icon: "M8 21h8 M12 17v4 M5 4h14v4a7 7 0 01-14 0z" },
];

export function RailNav() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  return (
    <>
      {RAIL.map((r) => (
        <Link
          key={r.label}
          href={r.href}
          className={`rail-i ${active(r.href) ? "on" : ""}`}
          aria-label={r.label}
          title={r.label}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d={r.icon} />
          </svg>
        </Link>
      ))}
    </>
  );
}
