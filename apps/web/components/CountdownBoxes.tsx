"use client";

import { useEffect, useState } from "react";

function calc(target: number) {
  const ms = Math.max(0, target - Date.now());
  const total = Math.floor(ms / 1000);
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function CountdownBoxes({ iso }: { iso: string }) {
  const target = new Date(iso).getTime();
  const [t, setT] = useState<ReturnType<typeof calc> | null>(null);

  useEffect(() => {
    const tick = () => setT(calc(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells: [string, string][] = [
    [t ? pad(t.d) : "—", "дней"],
    [t ? pad(t.h) : "—", "часов"],
    [t ? pad(t.m) : "—", "мин"],
  ];

  return (
    <div className="flex gap-2" suppressHydrationWarning>
      {cells.map(([v, l]) => (
        <div
          key={l}
          className="min-w-[56px] rounded-xl border border-line bg-black/35 px-3 py-2 text-center"
        >
          <div className="tabular font-display text-2xl font-semibold leading-none">{v}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-mute">{l}</div>
        </div>
      ))}
    </div>
  );
}
