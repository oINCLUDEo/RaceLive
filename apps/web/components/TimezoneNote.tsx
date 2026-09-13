"use client";

import { useEffect, useState } from "react";
import { userTimeZone } from "@/lib/format";

// Явно сообщает пользователю, что время — по часам его устройства.
export function TimezoneNote({ className }: { className?: string }) {
  const [tz, setTz] = useState<{ iana: string; label: string } | null>(null);

  useEffect(() => setTz(userTimeZone()), []);

  return (
    <span suppressHydrationWarning className={className}>
      {tz
        ? `Время — по часам вашего устройства: ${tz.iana}${tz.label ? ` (${tz.label})` : ""}`
        : "Время — по часам вашего устройства"}
    </span>
  );
}
