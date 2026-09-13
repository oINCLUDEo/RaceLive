"use client";

import { useEffect, useState } from "react";
import { formatDate, formatDateTime, formatTime, userTimeZone } from "@/lib/format";

type Mode = "datetime" | "date" | "time";

export function SessionTime({
  iso,
  mode = "datetime",
  withZone = false,
}: {
  iso: string | null;
  mode?: Mode;
  withZone?: boolean;
}) {
  const [text, setText] = useState("");
  const [zone, setZone] = useState("");

  useEffect(() => {
    if (!iso) return;
    const fn =
      mode === "date" ? formatDate : mode === "time" ? formatTime : formatDateTime;
    setText(fn(iso));
    if (withZone) setZone(userTimeZone().label);
  }, [iso, mode, withZone]);

  if (!iso) return <span className="text-mute">—</span>;
  return (
    <span suppressHydrationWarning className="tabular">
      {text || "…"}
      {withZone && zone ? <span className="text-mute"> {zone}</span> : null}
    </span>
  );
}
