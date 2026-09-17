// Прогноз погоды на гоночный уик-энд. Данные — из бэкенда (Open-Meteo, уже локализовано).
// Серверный компонент: чистый рендер, без клиентского состояния.
import type { WeatherDayOut, WeekendForecastOut } from "@/lib/api";

const dayMonth = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(`${iso}T12:00:00`));

// Иконка по slug условия. Цвет осадков — синий акцент (функциональный, «в данных»).
function WxIcon({ c }: { c: string }) {
  const s = { width: 30, height: 30, viewBox: "0 0 24 24", fill: "none", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (c === "clear")
    return (
      <svg {...s} stroke="var(--yellow)">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
      </svg>
    );
  if (c === "rain")
    return (
      <svg {...s} stroke="var(--blue)">
        <path d="M6 15a4 4 0 01.6-7.96A5.5 5.5 0 0117.5 8.5 3.5 3.5 0 0118 15" stroke="var(--mute)" />
        <path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2" />
      </svg>
    );
  if (c === "storm")
    return (
      <svg {...s} stroke="var(--mute)">
        <path d="M6 14a4 4 0 01.6-7.96A5.5 5.5 0 0117.5 7.5 3.5 3.5 0 0118 14" />
        <path d="M12 12l-2.5 4H12l-1 4 3.5-5H12l1.5-3z" fill="var(--yellow)" stroke="var(--yellow)" />
      </svg>
    );
  if (c === "snow")
    return (
      <svg {...s} stroke="var(--mute)">
        <path d="M6 14a4 4 0 01.6-7.96A5.5 5.5 0 0117.5 7.5 3.5 3.5 0 0118 14" />
        <path d="M9 18h.01M12 20h.01M15 18h.01M12 17h.01" stroke="var(--bone)" />
      </svg>
    );
  if (c === "fog")
    return (
      <svg {...s} stroke="var(--mute)">
        <path d="M4 9h13M6 13h13M4 17h11" />
      </svg>
    );
  // cloudy (default)
  return (
    <svg {...s} stroke="var(--mute)">
      <path d="M6 16a4 4 0 01.6-7.96A5.5 5.5 0 0117.5 9.5 3.5 3.5 0 0118 16z" />
    </svg>
  );
}

function DayCard({ d }: { d: WeatherDayOut }) {
  return (
    <div className="flex flex-col gap-2 bg-surface-1 px-4 py-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{d.label_ru}</span>
        <span className="text-[11px] text-mute">{dayMonth(d.date)}</span>
      </div>
      {d.session_ru && (
        <span className="w-fit rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide text-mute">
          {d.session_ru}
        </span>
      )}
      <div className="mt-1 flex items-center gap-3">
        <WxIcon c={d.condition} />
        <div className="min-w-0">
          <div className="tabular font-display text-xl font-semibold leading-none">
            {d.t_max != null ? `${d.t_max}°` : "—"}
            {d.t_min != null && <span className="ml-1 text-sm font-normal text-mute">/ {d.t_min}°</span>}
          </div>
          <div className="mt-1 truncate text-[11px] text-mute">{d.condition_ru}</div>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-3 text-[11px] text-mute">
        {d.precip_prob != null && (
          <span className="inline-flex items-center gap-1" style={d.rain ? { color: "var(--blue)" } : undefined}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 3s6 7 6 11a6 6 0 11-12 0c0-4 6-11 6-11z" />
            </svg>
            {d.precip_prob}%
          </span>
        )}
        {d.wind_max != null && (
          <span className="tabular inline-flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M3 8h11a2.5 2.5 0 10-2.5-2.5M3 12h15a2.5 2.5 0 11-2.5 2.5" />
            </svg>
            {d.wind_max} м/с
          </span>
        )}
      </div>
    </div>
  );
}

export function WeekendForecast({ data }: { data: WeekendForecastOut }) {
  if (!data.available || data.days.length === 0) return null;
  return (
    <div className="card-soft overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-mute">
        <span>Прогноз на уик-энд</span>
        <span className="normal-case tracking-normal">Open-Meteo</span>
      </div>
      <div
        className="grid gap-px bg-line"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}
      >
        {data.days.slice(0, 6).map((d) => (
          <DayCard key={d.date} d={d} />
        ))}
      </div>
    </div>
  );
}
