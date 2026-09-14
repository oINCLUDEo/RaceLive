"use client";

// Плавный «отсчёт» числа при появлении (уважает reduced-motion через MotionConfig).
import { animate } from "framer-motion";
import { useEffect, useState } from "react";

export function CountUp({ value, className }: { value: number; className?: string }) {
  const [n, setN] = useState(value);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.2, 0, 0, 1],
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);

  return <span className={className}>{n}</span>;
}
