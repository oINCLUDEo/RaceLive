"use client";

// Избранное на localStorage (пока без аккаунта). Когда появится вход — синхронизируем.
import { useCallback, useEffect, useState } from "react";

type Kind = "driver" | "team";
const KEY: Record<Kind, string> = {
  driver: "racelive:fav:drivers",
  team: "racelive:fav:teams",
};

export function useFavorites(kind: Kind) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      setIds(JSON.parse(localStorage.getItem(KEY[kind]) || "[]"));
    } catch {
      /* приватный режим / повреждённые данные */
    }
    // синхронизация между вкладками
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY[kind]) {
        try {
          setIds(JSON.parse(e.newValue || "[]"));
        } catch {
          /* noop */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [kind]);

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        try {
          localStorage.setItem(KEY[kind], JSON.stringify(next));
        } catch {
          /* noop */
        }
        return next;
      });
    },
    [kind],
  );

  return { ids, has: (id: string) => ids.includes(id), toggle };
}
