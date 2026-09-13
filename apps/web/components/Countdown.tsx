"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s, done: ms === 0 };
}

export function Countdown({ iso }: { iso: string }) {
  const target = new Date(iso).getTime();
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!t) {
    return <span suppressHydrationWarning className="tabular text-mute">…</span>;
  }
  if (t.done) {
    return <span className="tabular">идёт сейчас</span>;
  }

  const parts: string[] = [];
  if (t.d) parts.push(`${t.d} дн`);
  parts.push(`${t.h} ч`, `${t.m} мин`);
  if (!t.d) parts.push(`${t.s} с`);

  return (
    <span suppressHydrationWarning className="tabular">
      {parts.join(" ")}
    </span>
  );
}
