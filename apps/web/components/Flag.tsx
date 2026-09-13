// Флаг страны по ISO2-коду (flagcdn, бесплатный CDN флагов).
export function Flag({ code, w = 28 }: { code: string | null; w?: number }) {
  if (!code) {
    return <span className="inline-block shrink-0 rounded-[3px] bg-surface-2" style={{ width: w, height: Math.round((w * 3) / 4) }} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt=""
      width={w}
      height={Math.round((w * 3) / 4)}
      className="shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
      style={{ width: w, height: Math.round((w * 3) / 4) }}
      loading="lazy"
    />
  );
}
