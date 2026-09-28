"use client";

// Компактный зачёт сезона — живёт в колонке справа на широком экране и в шторке
// (кнопка «Зачёт» в навигации) на остальных. Вкладки «Пилоты/Команды», топ-10 с
// раскрытием до полного списка и переход к подробной странице.
import { Link } from "next-view-transitions";
import { useState } from "react";
import { TeamLogo } from "@/components/TeamLogo";
import type { ConstructorStandingOut, DriverStandingOut } from "@/lib/api";
import { TEAMS } from "@/lib/teams";

const colorOf = (slug: string | null) => (slug ? TEAMS[slug]?.color : undefined) ?? "var(--line-strong)";
const TOP = 10;

type RowData = { key: string; pos: number; name: string; sub: string; href: string | null; slug: string | null; pts: number; wins: number };

export function SeasonPanel({
  drivers,
  constructors,
  onNavigate,
}: {
  drivers: DriverStandingOut[];
  constructors: ConstructorStandingOut[];
  onNavigate?: () => void;
}) {
  const [tab, setTab] = useState<"d" | "c">("d");
  const [all, setAll] = useState(false);

  const rows: RowData[] =
    tab === "d"
      ? drivers.map((d) => ({
          key: d.driver_id,
          pos: d.position,
          name: d.name_ru ?? d.name_en,
          sub: d.team_name ?? "",
          href: `/drivers/${d.driver_id}`,
          slug: d.team_slug,
          pts: d.points,
          wins: d.wins,
        }))
      : constructors.map((c) => ({
          key: c.team_slug ?? c.team_name,
          pos: c.position,
          name: c.team_name,
          sub: c.wins ? `${c.wins} ${c.wins === 1 ? "победа" : c.wins < 5 ? "победы" : "побед"}` : "",
          href: c.team_slug ? `/teams/${c.team_slug}` : null,
          slug: c.team_slug,
          pts: c.points,
          wins: c.wins,
        }));
  const leader = rows[0]?.pts || 1;
  const shown = all ? rows : rows.slice(0, TOP);

  if (!drivers.length && !constructors.length) {
    return <div className="card-soft p-5 text-sm text-mute">Зачёт временно недоступен.</div>;
  }

  return (
    <section className="card-soft flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="font-display text-base font-semibold">Зачёт сезона</span>
        <div className="inline-flex rounded-full border border-line bg-surface-2 p-0.5 text-xs" role="tablist">
          {(
            [
              ["d", "Пилоты"],
              ["c", "Команды"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => {
                setTab(k);
                setAll(false);
              }}
              className={`pressable rounded-full px-3 py-1 ${tab === k ? "bg-[var(--bone)] text-[var(--surface-0)]" : "text-mute hover:text-bone"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ol className="flex flex-col">
        {shown.map((r) => {
          const color = colorOf(r.slug);
          const gap = rows[0].pts - r.pts;
          const inner = (
            <>
              <span className={`tabular w-5 shrink-0 text-right text-sm ${r.pos === 1 ? "font-semibold text-bone" : "text-mute"}`}>{r.pos}</span>
              <TeamLogo slug={r.slug ?? ""} size={22} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm leading-tight text-bone">{r.name}</span>
                {/* полоска очков относительно лидера — видно отрыв без цифр */}
                <span className="mt-1 block h-[3px] overflow-hidden rounded-full bg-surface-2">
                  <span className="block h-full rounded-full" style={{ width: `${Math.max(2, (r.pts / leader) * 100)}%`, background: color }} />
                </span>
              </span>
              <span className="shrink-0 text-right leading-tight">
                <span className="tabular block font-display text-sm font-semibold">{r.pts}</span>
                <span className="tabular block text-[10px] text-mute">{r.pos === 1 ? "лидер" : `−${gap}`}</span>
              </span>
            </>
          );
          return (
            <li key={r.key} className="border-b border-line last:border-b-0">
              {r.href ? (
                <Link href={r.href} onClick={onNavigate} className="flex items-center gap-2.5 px-4 py-2 hover:bg-surface-2" title={r.sub || undefined}>
                  {inner}
                </Link>
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-2">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-xs">
        {rows.length > TOP ? (
          <button onClick={() => setAll((a) => !a)} className="pressable text-mute hover:text-bone">
            {all ? "Свернуть" : `Показать всех (${rows.length})`}
          </button>
        ) : (
          <span />
        )}
        <Link href="/standings" onClick={onNavigate} className="text-bone hover:underline">
          Подробно →
        </Link>
      </div>
    </section>
  );
}
