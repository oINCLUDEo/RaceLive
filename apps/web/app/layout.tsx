import type { Metadata } from "next";
import { Geologica, Golos_Text } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Geologica({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
  // У вариативной Geologica нет метрик фолбэка в базе Next — отключаем авто-подгонку,
  // чтобы убрать предупреждение сборки; свой фолбэк-стек задаём явно.
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

const sans = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Смотрим Формулу вместе — race.live",
    template: "%s · race.live",
  },
  description:
    "Живой тайминг на русском, чат во время гонки, стримы комьюнити. Место, куда возвращаются между этапами.",
};

const rail = [
  { href: "/", label: "Главная", on: true, icon: "M3 11l9-8 9 8 M5 10v10h14V10" },
  { href: "/schedule", label: "Расписание", icon: "M3 5h18 M3 12h18 M3 19h18" },
  { href: "#", label: "Стримы", icon: "M2 6h14v12H2z M16 10l6-3v10l-6-3" },
  { href: "/tracks", label: "Трассы", icon: "M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z M9 7v13 M15 4v13" },
  { href: "/standings", label: "Зачёт", icon: "M8 21h8 M12 17v4 M5 4h14v4a7 7 0 01-14 0z" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${sans.variable}`}>
      <body>
        <div className="flex min-h-screen glow-page">
          {/* LEFT RAIL */}
          <aside className="sticky top-0 hidden h-screen w-[76px] shrink-0 flex-col items-center gap-2 border-r border-line py-[18px] md:flex">
            <Link
              href="/"
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--ember)]"
              aria-label="race.live"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 7l5 5-5 5" />
                <path d="M13 7l5 5-5 5" />
              </svg>
            </Link>
            {rail.map((r) => (
              <Link key={r.label} href={r.href} className={`rail-i ${r.on ? "on" : ""}`} aria-label={r.label} title={r.label}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d={r.icon} />
                </svg>
              </Link>
            ))}
          </aside>

          {/* MAIN */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* TOP BAR */}
            <header className="flex items-center gap-4 border-b border-line px-5 py-4 md:px-8">
              <Link href="/" className="font-display text-xl font-semibold lowercase tracking-tight">
                race<span className="text-mute">.live</span>
              </Link>
              <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface-1 px-4 py-2.5 text-sm text-mute sm:flex md:max-w-[520px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: "var(--accent2)" }}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4-4" />
                </svg>
                <span className="truncate">Найди пилота, этап или стримера</span>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="hidden items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] sm:flex" style={{ borderColor: "var(--accent2-soft)", background: "var(--accent2-soft)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent2)"><path d="M3 7l4 3 5-6 5 6 4-3-2 12H5z" /></svg>
                  <span className="font-display" style={{ color: "var(--accent2)" }}>race.live+</span>
                </span>
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-1 text-mute">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10 21a2 2 0 004 0" />
                  </svg>
                  <span className="absolute right-2 top-1.5 h-[7px] w-[7px] rounded-full border-2 border-surface-1 bg-[var(--ember)]" />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A4DB0] font-display text-[13px] font-semibold text-white">
                  КЗ
                </span>
              </div>
            </header>

            <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-7 md:px-8">{children}</div>

            <footer className="border-t border-line">
              <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-6 text-xs text-mute md:px-8">
                <span className="font-display lowercase text-bone">
                  race<span className="text-mute">.live</span>
                </span>
                <span>Данные — Jolpica / Ergast · логотипы команд — плейсхолдеры · проект в разработке</span>
              </div>
            </footer>
          </div>
        </div>

        {/* MINI-CHAT FAB */}
        <div className="fixed bottom-5 right-5 z-30 flex items-center gap-2.5 rounded-full border border-line bg-surface-1 px-4 py-2.5 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.8)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ember)" strokeWidth="1.8">
            <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="font-display text-sm">Мини-чат</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ember)] text-[10px] font-semibold text-white">7</span>
        </div>
      </body>
    </html>
  );
}
