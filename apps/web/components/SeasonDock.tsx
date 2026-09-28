"use client";

// Колонка «Зачёт сезона» справа от контента на широком экране (2xl+). На «Эфире»,
// «Сравнении» и в самом разделе «Сезон → Зачёт» не показываем — там своё.
// Если сервер отдал пустой зачёт (статичные страницы собираются при билде без API),
// догружаем его в браузере.
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SeasonPanel } from "@/components/SeasonPanel";
import type { ConstructorStandingOut, DriverStandingOut } from "@/lib/api";

const NO_DOCK = ["/live", "/compare", "/standings", "/streams"];

export function SeasonDock({ drivers, constructors }: { drivers: DriverStandingOut[]; constructors: ConstructorStandingOut[] }) {
  const path = usePathname();
  const [data, setData] = useState({ drivers, constructors });
  const empty = !data.drivers.length && !data.constructors.length;

  useEffect(() => {
    if (!empty) return;
    let off = false;
    fetch("/api/season")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!off && j) setData(j);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [empty]);

  if (NO_DOCK.some((p) => path.startsWith(p)) || empty) return null;
  return (
    <aside
      className="no-scrollbar sticky top-4 hidden max-h-[calc(100vh-2rem)] w-[340px] shrink-0 self-start overflow-y-auto 2xl:block"
      aria-label="Зачёт сезона"
    >
      <SeasonPanel drivers={data.drivers} constructors={data.constructors} />
    </aside>
  );
}
