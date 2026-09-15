import type { Metadata } from "next";
import { Geologica, Golos_Text } from "next/font/google";
import { Link, ViewTransitions } from "next-view-transitions";
import { RailNav } from "@/components/RailNav";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Смотрим Формулу вместе — race.live",
    template: "%s · race.live",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Формула-1", "F1", "автогонки", "расписание Формулы-1", "результаты гран-при",
    "живой тайминг", "зачёт пилотов", "кубок конструкторов", "рейс-контроль", "на русском",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ru_RU",
    url: SITE_URL,
    title: "Смотрим Формулу вместе — race.live",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Смотрим Формулу вместе — race.live",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransitions>
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
            <RailNav />
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
              <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-mute md:px-8">
                <span className="flex items-center gap-4">
                  <span className="font-display lowercase text-bone">
                    race<span className="text-mute">.live</span>
                  </span>
                  <Link href="/glossary" className="hover:text-bone">
                    Словарь терминов
                  </Link>
                  <Link href="/compare" className="hover:text-bone">
                    Сравнение пилотов
                  </Link>
                </span>
                <span>Данные — Jolpica / Ergast · логотипы команд — плейсхолдеры · проект в разработке</span>
              </div>
            </footer>
          </div>
        </div>

        {/* MINI-CHAT FAB */}
        <div className="fixed bottom-5 right-5 z-30 flex items-center gap-2.5 rounded-full border border-line bg-surface-1 px-4 py-2.5 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.8)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="1.8">
            <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="font-display text-sm">Чат</span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide text-mute">скоро</span>
        </div>
      </body>
      </html>
    </ViewTransitions>
  );
}
