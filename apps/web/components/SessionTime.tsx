"use client";

import { useEffect, useState } from "react";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";

type Mode = "datetime" | "date" | "time";

export function SessionTime({
  iso,
  mode = "datetime",
}: {
  iso: string | null;
  mode?: Mode;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!iso) return;
    const fn =
      mode === "date" ? formatDate : mode === "time" ? formatTime : formatDateTime;
    setText(fn(iso));
  }, [iso, mode]);

  if (!iso) return <span className="text-mute">—</span>;
  return (
    <span suppressHydrationWarning className="tabular">
      {text || "…"}
    </span>
  );
}
