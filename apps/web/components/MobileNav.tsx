"use client";

// Нижняя панель навигации на телефоне (на десктопе — левый рейл). Четыре главных раздела
// + «Ещё» — шторка с остальными. Учитывает «чёлку»/домашнюю полоску (safe-area).
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RAIL } from "@/components/RailNav";

const MAIN = ["/", "/schedule", "/live", "/standings"];

function Icon({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function MobileNav() {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const main = RAIL.filter((r) => MAIN.includes(r.href));
  const rest = RAIL.filter((r) => !MAIN.includes(r.href));
  const restActive = rest.some((r) => active(r.href));

  useEffect(() => setMore(false), [path]);

  return (
    <>
      {more && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
          <div
            className="absolute inset-x-3 rounded-3xl border border-line bg-surface-1 p-2 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.8)]"
            style={{ bottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-1">
              {rest.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm ${active(r.href) ? "bg-[var(--ember-soft)] text-[var(--ember)]" : "text-bone active:bg-surface-2"}`}
                >
                  <Icon d={r.icon} size={20} />
                  {r.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[rgba(18,16,19,0.92)] backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Навигация"
      >
        <div className="grid grid-cols-5">
          {main.map((r) => {
            const on = active(r.href);
            return (
              <Link
                key={r.href}
                href={r.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${on ? "text-[var(--ember)]" : "text-mute"}`}
                aria-current={on ? "page" : undefined}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full ${on ? "bg-[var(--ember-soft)]" : ""}`}>
                  <Icon d={r.icon} />
                </span>
                {r.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMore((m) => !m)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${more || restActive ? "text-[var(--ember)]" : "text-mute"}`}
            aria-expanded={more}
          >
            <span className={`flex h-7 w-12 items-center justify-center rounded-full ${more || restActive ? "bg-[var(--ember-soft)]" : ""}`}>
              <Icon d="M5 12h.01M12 12h.01M19 12h.01" size={24} />
            </span>
            Ещё
          </button>
        </div>
      </nav>
    </>
  );
}
