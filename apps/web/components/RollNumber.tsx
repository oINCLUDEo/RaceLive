"use client";

// Цифры-«ролики»: при смене значения цифра прокручивается на новую (одометр).
// Высота задаётся в em, поэтому компонент масштабируется под размер шрифта родителя.
// Значение доступно скринридерам через aria-label; сами ролики скрыты.

const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function Reel({ d }: { d: number }) {
  return (
    <span className="rn-digit" aria-hidden>
      <span className="rn-reel" style={{ transform: `translateY(-${d}em)` }}>
        {CELLS.map((n) => (
          <span key={n} className="rn-cell">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

export function RollNumber({ value, pad = 0 }: { value: number; pad?: number }) {
  const str = String(Math.max(0, Math.floor(value))).padStart(pad, "0");
  return (
    <span className="rn tabular" aria-label={str}>
      {str.split("").map((ch, i) =>
        ch >= "0" && ch <= "9" ? (
          <Reel key={i} d={Number(ch)} />
        ) : (
          <span key={i} aria-hidden>
            {ch}
          </span>
        ),
      )}
    </span>
  );
}
