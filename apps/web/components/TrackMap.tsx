"use client";

// Схема трассы из public/tracks/<circuit>.svg. Пока настоящих контуров нет —
// падаем на нейтральный плейсхолдер. Реальные контуры кладутся теми же именами.
import { useState } from "react";

export function TrackMap({
  circuit,
  size = 120,
  className,
}: {
  circuit: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState(circuit ? `/tracks/${circuit}.svg` : "/tracks/_placeholder.svg");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
      onError={() => setSrc("/tracks/_placeholder.svg")}
    />
  );
}
