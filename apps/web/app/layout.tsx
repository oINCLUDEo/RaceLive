import type { Metadata } from "next";
import { Geologica, Golos_Text } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Geologica({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});

const sans = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Живой тайминг автогонок на русском",
    template: "%s · race.live",
  },
  description:
    "Расписание, результаты и живой тайминг автогонок с русской локализацией.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${display.variable} ${sans.variable}`}>
      <body>
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="font-display text-lg font-semibold lowercase tracking-tight"
            >
              race<span className="text-mute">.live</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/schedule" className="hover:text-bone text-mute transition-colors">
                Расписание
              </Link>
              <span className="text-disabled" title="Скоро — Фаза 2">
                Результаты
              </span>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-mute">
            race.live · данные предоставлены Jolpica / Ergast · проект в разработке (Фаза 1).
          </div>
        </footer>
      </body>
    </html>
  );
}
