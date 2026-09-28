"use client";

// Простые вкладки поверх готовых серверных блоков (контент рендерится на сервере,
// здесь только переключение). Первая вкладка — по умолчанию.
import { useState, type ReactNode } from "react";

export function Tabs({ tabs, right }: { tabs: { id: string; label: string; content: ReactNode }[]; right?: ReactNode }) {
  const [cur, setCur] = useState(tabs[0]?.id);
  const active = tabs.find((t) => t.id === cur) ?? tabs[0];
  return (
    <div className="card-soft overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="inline-flex rounded-full border border-line bg-surface-2 p-0.5 text-sm" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === active?.id}
              onClick={() => setCur(t.id)}
              className={`pressable rounded-full px-3.5 py-1 ${t.id === active?.id ? "bg-[var(--bone)] text-[var(--surface-0)]" : "text-mute hover:text-bone"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {right}
      </div>
      <div role="tabpanel">{active?.content}</div>
    </div>
  );
}
