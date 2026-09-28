"use client";

// Шапка раздела «Сезон»: заголовок и вкладки-ссылки (у каждой вкладки свой адрес —
// можно поделиться ссылкой прямо на зачёт). Сюда же лягут «Штрафные баллы».
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS = [
  { href: "/schedule", label: "Календарь" },
  { href: "/standings", label: "Зачёт" },
];

export function SeasonHeader({ note }: { note?: ReactNode }) {
  const path = usePathname();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="eyebrow">Чемпионат</div>
        <h1 className="mt-1.5 font-display text-3xl font-semibold">Сезон</h1>
        {note && <p className="mt-1.5 text-sm text-mute">{note}</p>}
      </div>
      <nav className="flex gap-1 border-b border-line" aria-label="Разделы сезона">
        {TABS.map((t) => {
          const on = path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={`-mb-px border-b-2 px-3 pb-2.5 pt-1 font-display text-[15px] font-semibold transition-colors ${on ? "border-[var(--bone)] text-bone" : "border-transparent text-mute hover:text-bone"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
