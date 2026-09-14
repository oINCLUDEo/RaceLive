"use client";

// Болид-подложка героя + переключатель. Когда выключено — CarScene не монтируется,
// а значит three.js даже не подгружается (чанк не запрашивается) → ноль нагрузки.
// Выбор запоминается в localStorage.
import { useEffect, useState } from "react";
import { CarSceneLazy } from "./CarSceneLazy";

export function HeroCar() {
  const [on, setOn] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setOn(localStorage.getItem("car3d") !== "off");
    } catch {
      setOn(true);
    }
  }, []);

  function toggle() {
    setOn((prev) => {
      const v = !prev;
      try {
        localStorage.setItem("car3d", v ? "on" : "off");
      } catch {
        /* ignore */
      }
      return v;
    });
  }

  return (
    <>
      {on && (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 md:-right-[4%] md:left-[24%]">
          <CarSceneLazy />
        </div>
      )}
      {on !== null && (
        <button
          type="button"
          onClick={toggle}
          className="pointer-events-auto absolute right-3 top-3 z-20 rounded-full border border-line bg-black/40 px-3 py-1.5 text-[11px] text-mute backdrop-blur-sm transition-colors hover:text-bone"
          title="Тяжёлая 3D-графика — можно отключить, если тормозит"
        >
          {on ? "выключить 3D" : "включить 3D"}
        </button>
      )}
    </>
  );
}
