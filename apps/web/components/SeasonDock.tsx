"use client";

// Где живёт зачёт сезона: на широком экране (2xl+) — постоянная колонка справа от
// контента; на остальных — шторка, которую открывает «Зачёт» в навигации (событие
// OPEN_SEASON). На «Эфире»/«Сравнении»/самом зачёте колонку не показываем — там своё.
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SeasonPanel } from "@/components/SeasonPanel";
import type { ConstructorStandingOut, DriverStandingOut } from "@/lib/api";

export const OPEN_SEASON = "racelive:season";
export const openSeason = () => window.dispatchEvent(new Event(OPEN_SEASON));

const NO_DOCK = ["/live", "/compare", "/standings", "/streams"];

export function SeasonDock({ drivers, constructors }: { drivers: DriverStandingOut[]; constructors: ConstructorStandingOut[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const aside = useRef<HTMLElement>(null);
  const docked = !NO_DOCK.some((p) => path.startsWith(p));

  useEffect(() => {
    const on = () => {
      // Колонка на экране — подсветим её, шторка не нужна.
      if (aside.current && aside.current.offsetParent !== null) {
        aside.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
        setFlash(true);
        window.setTimeout(() => setFlash(false), 900);
      } else setOpen(true);
    };
    window.addEventListener(OPEN_SEASON, on);
    return () => window.removeEventListener(OPEN_SEASON, on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <>
      {docked && (
        <aside
          ref={aside}
          className={`no-scrollbar sticky top-4 hidden max-h-[calc(100vh-2rem)] w-[340px] shrink-0 self-start overflow-y-auto rounded-[var(--r-card)] transition-shadow 2xl:block ${flash ? "shadow-[0_0_0_2px_var(--bone)]" : ""}`}
          aria-label="Зачёт сезона"
        >
          <SeasonPanel drivers={drivers} constructors={constructors} />
        </aside>
      )}

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Зачёт сезона">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
          <div
            className="sheet-in absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-line bg-surface-0 p-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] md:bottom-auto md:left-auto md:right-3 md:top-3 md:max-h-[calc(100vh-24px)] md:w-[380px] md:rounded-3xl md:pb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="mx-auto h-1 w-10 rounded-full bg-[var(--line-strong)] md:hidden" aria-hidden />
              <button
                onClick={() => setOpen(false)}
                className="pressable ml-auto hidden h-8 w-8 items-center justify-center rounded-full text-mute hover:bg-surface-2 hover:text-bone md:flex"
                aria-label="Закрыть"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <SeasonPanel drivers={drivers} constructors={constructors} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
