// Плеер стрима: официальный iframe-embed площадки (VK Video / Rutube). Видео не наше
// (ADR-007) — только встраиваем чужой плеер. Соотношение 16:9, можно на весь экран.

export function StreamPlayer({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[var(--r-card)] border border-line bg-black shadow-[var(--soft)]" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        frameBorder={0}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
