"use client";

// Флаг страны по ISO2-коду. Самохостинг из /public/flags (набор lipis/flag-icons, MIT).
// Нет файла/кода — аккуратный плейсхолдер вместо битой картинки.
import { useState } from "react";

export function Flag({ code, w = 28 }: { code: string | null; w?: number }) {
  const [broken, setBroken] = useState(false);
  const h = Math.round((w * 3) / 4);
  const box = (
    <span className="inline-block shrink-0 rounded-[3px] bg-surface-2" style={{ width: w, height: h }} />
  );
  if (!code || broken) return box;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt=""
      width={w}
      height={h}
      className="shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
      style={{ width: w, height: h }}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
