// Погода сессии (реальные метрики OpenF1): трасса, воздух, влажность, ветер, осадки.
type Weather = {
  track: number | null;
  air: number | null;
  humidity: number | null;
  wind: number | null;
  wind_dir: number | null;
  rain: boolean;
};

function Cell({
  label,
  children,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-surface-1 px-4 py-3.5">
      <div className="tabular font-display text-xl font-semibold leading-none" style={accent ? { color: accent } : undefined}>
        {children}
      </div>
      <div className="mt-1.5 text-[11px] uppercase tracking-wide text-mute">{label}</div>
    </div>
  );
}

export function WeatherCard({ w }: { w: Weather }) {
  return (
    <div className="card-soft overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-xs text-mute">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M14 14V5a2 2 0 10-4 0v9a4 4 0 104 0z" />
        </svg>
        Погода на трассе
      </div>
      <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-5">
        {w.track != null && <Cell label="трасса">{Math.round(w.track)}°</Cell>}
        {w.air != null && <Cell label="воздух">{Math.round(w.air)}°</Cell>}
        {w.humidity != null && <Cell label="влажность">{Math.round(w.humidity)}%</Cell>}
        {w.wind != null && (
          <Cell label="ветер">
            <span className="inline-flex items-center gap-1.5">
              {w.wind_dir != null && (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent2)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: `rotate(${w.wind_dir}deg)` }}
                  aria-label="направление ветра"
                >
                  <path d="M12 4v16M6 10l6-6 6 6" />
                </svg>
              )}
              {Math.round(w.wind)}<span className="text-sm text-mute"> м/с</span>
            </span>
          </Cell>
        )}
        <Cell label="осадки" accent={w.rain ? "var(--blue)" : undefined}>
          {w.rain ? "дождь" : "сухо"}
        </Cell>
      </div>
    </div>
  );
}
