// Цветная иконка площадки: тон-в-тон кнопка «play» в мягком фоне (VK — синий,
// Rutube — фиолетовый). Современный акцент вместо серой точки.
export function PlatformIcon({ platform, size = 24 }: { platform: string; size?: number }) {
  const color = platform === "vk" ? "#3E8FE0" : "#B04CE6";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[8px]"
      style={{ width: size, height: size, background: `color-mix(in srgb, ${color} 22%, transparent)` }}
      aria-hidden
    >
      <svg width={Math.round(size * 0.5)} height={Math.round(size * 0.5)} viewBox="0 0 24 24" fill={color}>
        <path d="M8 5.5v13l11-6.5z" />
      </svg>
    </span>
  );
}
