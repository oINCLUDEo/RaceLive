import { Link } from "next-view-transitions";

// «Форма» — очки по этапам столбиками на всю ширину карточки (раньше — узкая
// полоска слева). Цвет — команды (данные), подпись сверху — очки, снизу — этап.
export function FormChart({
  items,
  color,
  height = 96,
}: {
  items: { round: number; value: number; title: string; label?: string }[];
  color: string;
  height?: number;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="card-soft px-3 pb-2 pt-3 sm:px-4">
      <div className="flex items-end gap-1 sm:gap-1.5">
        {items.map((it) => (
          <Link
            key={it.round}
            href={`/schedule/${it.round}`}
            title={it.title}
            className="group flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <span className="tabular hidden text-[11px] text-mute group-hover:text-bone sm:block">{it.label ?? it.value}</span>
            <span
              className="block w-full max-w-[28px] rounded-t-[4px] transition-opacity group-hover:opacity-80"
              style={{
                height: `${Math.max(3, Math.round((it.value / max) * height))}px`,
                background: it.value > 0 ? color : "var(--surface-2)",
              }}
            />
            <span className="tabular text-[11px] text-mute">{it.round}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
