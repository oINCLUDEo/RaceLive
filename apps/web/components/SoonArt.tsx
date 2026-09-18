// Современные цветные иконки для карточек «Скоро» (градиент ember→индиго + акцент).
export function SoonArt({ i }: { i: number }) {
  const g = `soon-g-${i}`;
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F5834F" />
          <stop offset="1" stopColor="#6E7BF2" />
        </linearGradient>
      </defs>
      {i === 0 && (
        <>
          <path d="M12 3l7 3v5c0 4.2-2.8 7.4-7 8.8-4.2-1.4-7-4.6-7-8.8V6l7-3z" stroke={`url(#${g})`} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8.7 11.8l2.2 2.2 4.1-4.4" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {i === 1 && (
        <>
          <path d="M7 4h10v3a5 5 0 01-10 0V4z" stroke={`url(#${g})`} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M5 5H3.5v1.5A2.5 2.5 0 007 8.8M19 5h1.5v1.5A2.5 2.5 0 0117 8.8M9.5 13h5M12 12v4M9 20h6" stroke={`url(#${g})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="6" r="1.4" fill="var(--yellow)" />
        </>
      )}
      {i === 2 && (
        <>
          <path d="M21 14a2 2 0 01-2 2H9l-5 4V6a2 2 0 012-2h12a2 2 0 012 2z" stroke={`url(#${g})`} strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="9" cy="10" r="1.1" fill="var(--accent2)" />
          <circle cx="13" cy="10" r="1.1" fill="var(--ember)" />
          <circle cx="17" cy="10" r="1.1" fill="var(--green)" />
        </>
      )}
    </svg>
  );
}
