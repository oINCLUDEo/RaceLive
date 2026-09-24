import { Link } from "next-view-transitions";
import { PlatformIcon } from "@/components/PlatformIcon";
import type { StreamOut } from "@/lib/api";

// Карточка «в эфире» в герое главной: кто стримит сейчас + переход сразу к эфиру.
export function HeroLiveCard({ stream }: { stream: StreamOut }) {
  return (
    <Link
      href="/live#streams"
      className="pressable group flex w-full max-w-[340px] items-center gap-3.5 rounded-2xl border border-line bg-[rgba(18,11,13,0.62)] p-4 backdrop-blur-md"
    >
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--ember)" }}>
        <span className="absolute inset-0 animate-ping rounded-full opacity-30" style={{ background: "var(--ember)" }} aria-hidden />
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden>
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--ember)" }}>
          <span className="live-dot" aria-hidden /> В эфире
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <PlatformIcon platform={stream.platform} size={20} />
          <span className="truncate font-display font-semibold">{stream.caster}</span>
        </span>
        {stream.title && <span className="mt-0.5 block truncate text-xs text-mute">{stream.title}</span>}
      </span>
      <span className="shrink-0 text-sm text-bone transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  );
}
