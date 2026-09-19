"use client";

// Напоминания об эфире кастеров — набор id в localStorage (по вкладке пользователя).
import { useCallback, useEffect, useState } from "react";

const KEY = "racelive:stream-reminders";

export function getReminders(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function save(ids: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    /* приватный режим */
  }
}

export function useReminder(id: string): [boolean, () => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(getReminders().has(id));
  }, [id]);
  const toggle = useCallback(() => {
    const ids = getReminders();
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    save(ids);
    setOn(ids.has(id));
  }, [id]);
  return [on, toggle];
}
