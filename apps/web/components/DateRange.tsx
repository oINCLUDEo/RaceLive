"use client";

// Даты уик-энда в часовом поясе зрителя: «1–3 октября», «30 окт. – 1 нояб.».
import { useEffect, useState } from "react";

const day = new Intl.DateTimeFormat("ru-RU", { day: "numeric" });
const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const dayMonthShort = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

export function formatRange(from: string, to: string | null): string {
  const a = new Date(from);
  const b = to ? new Date(to) : a;
  if (a.toDateString() === b.toDateString()) return dayMonth.format(a);
  if (a.getMonth() === b.getMonth()) return `${day.format(a)}–${dayMonth.format(b)}`;
  return `${dayMonthShort.format(a)} – ${dayMonthShort.format(b)}`;
}

export function DateRange({ from, to }: { from: string | null; to: string | null }) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (from) setText(formatRange(from, to));
  }, [from, to]);
  if (!from) return <span className="text-mute">—</span>;
  return (
    <span suppressHydrationWarning className="tabular">
      {text || "…"}
    </span>
  );
}
