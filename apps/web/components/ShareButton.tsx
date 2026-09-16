"use client";

// Поделиться текущей страницей: нативный Web Share (моб.), иначе копирование ссылки.
import { useState } from "react";

export function ShareButton({ title, getUrl }: { title?: string; getUrl?: () => string }) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const url = getUrl ? getUrl() : window.location.href;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: title ?? document.title, url });
        return;
      } catch {
        /* пользователь отменил — упадём в копирование ниже только если это не отмена */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <button
      onClick={onShare}
      className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-bone transition-colors hover:bg-surface-2"
      title="Поделиться"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {copied ? "Скопировано" : "Поделиться"}
    </button>
  );
}
