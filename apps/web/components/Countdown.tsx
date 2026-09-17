"use client";

import { useEffect, useState } from "react";
import { RollNumber } from "@/components/RollNumber";

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

  return (
    <span suppressHydrationWarning className="tabular inline-flex items-baseline gap-1.5">
      {t.d > 0 && <Seg n={t.d} u="дн" />}
      <Seg n={t.h} u="ч" />
      <Seg n={t.m} u="мин" />
      {t.d === 0 && <Seg n={t.s} u="с" />}
    </span>
  );
}

function Seg({ n, u }: { n: number; u: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <RollNumber value={n} />
      <span className="text-[0.85em] text-mute">{u}</span>
    </span>
  );
}
