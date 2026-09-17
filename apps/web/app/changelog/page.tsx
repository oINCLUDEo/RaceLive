import { Reveal } from "@/components/Reveal";
import { CHANGELOG, KIND_LABEL, type ChangeKind } from "@/lib/changelog";

export const metadata = {
  title: "Обновления",
  description: "Что нового на race.live: свежие возможности, улучшения и исправления портала живого тайминга и результатов Формулы-1.",
  alternates: { canonical: "/changelog" },
};

// Страница обновлений (публичный чейнджлог). Источник — lib/changelog.ts.
// Чипы используют только фирменные акценты (ember/индиго) и нейтраль — по дизайн-системе.
const KIND_STYLE: Record<ChangeKind, { color: string; bg: string }> = {
  new: { color: "var(--ember)", bg: "var(--ember-soft)" },
  improve: { color: "var(--accent2)", bg: "var(--accent2-soft)" },
  fix: { color: "var(--mute)", bg: "var(--surface-2)" },
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${iso}T12:00:00`),
  );

export default function ChangelogPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* ШАПКА */}
      <section
        className="relative overflow-hidden rounded-[24px] p-8 shadow-[var(--soft)] md:p-10"
        style={{ background: "linear-gradient(115deg, var(--ember-soft), var(--surface-1) 58%)" }}
      >
        <span
          className="pointer-events-none absolute right-0 top-0 h-full w-[6px]"
          style={{ background: "var(--ember)" }}
          aria-hidden
        />
        <div className="text-xs uppercase tracking-[0.16em] text-mute">Что нового</div>
        <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Обновления</h1>
        <p className="mt-2 max-w-prose text-mute">
          Коротко и по-человечески — что мы добавили и починили на race.live. Самое свежее сверху.
        </p>
      </section>

      {/* ТАЙМЛАЙН */}
      <div className="relative">
        {/* вертикальная линия таймлайна */}
        <span
          className="pointer-events-none absolute bottom-2 left-[7px] top-2 w-px"
          style={{ background: "var(--line-strong)" }}
          aria-hidden
        />
        <ol className="flex flex-col gap-7">
          {CHANGELOG.map((e, i) => {
            const st = KIND_STYLE[e.kind];
            return (
              <li key={`${e.date}-${i}`} className="relative pl-8">
                {/* точка */}
                <span
                  className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-[3px] border-surface-0"
                  style={{ background: st.color }}
                  aria-hidden
                />
                <Reveal>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <time className="tabular text-sm text-mute" dateTime={e.date}>
                      {fmtDate(e.date)}
                    </time>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ color: st.color, background: st.bg }}
                    >
                      {KIND_LABEL[e.kind]}
                    </span>
                  </div>
                  <h2 className="mt-1.5 font-display text-lg font-semibold">{e.title}</h2>
                  <ul className="mt-2.5 flex flex-col gap-2">
                    {e.items.map((it, k) => (
                      <li key={k} className="flex gap-2.5 text-sm leading-relaxed text-bone/90">
                        <span
                          className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: st.color, opacity: 0.7 }}
                          aria-hidden
                        />
                        <span className="text-mute">{it}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="text-xs text-mute">
        Есть идея или нашли неточность? Мы постоянно дорабатываем портал — спасибо, что вы с нами.
      </p>
    </div>
  );
}
