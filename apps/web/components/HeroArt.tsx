// Декоративная графика героя вместо тяжёлого 3D-болида: лёгкий SVG в тему гонок
// (телеметрия/тахометр) с фирменными градиентами ember→индиго. Ноль зависимостей.
export function HeroArt() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-[-8%] hidden w-[60%] items-center justify-center md:flex"
      aria-hidden
    >
      <svg viewBox="0 0 420 420" className="h-[116%] w-auto">
        <defs>
          <linearGradient id="ha-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F5834F" />
            <stop offset="0.5" stopColor="#E0402F" />
            <stop offset="1" stopColor="#6E7BF2" />
          </linearGradient>
          <radialGradient id="ha-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(224,64,47,0.34)" />
            <stop offset="1" stopColor="rgba(224,64,47,0)" />
          </radialGradient>
          <filter id="ha-blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* мягкое свечение */}
        <circle cx="210" cy="210" r="185" fill="url(#ha-glow)" />

        {/* внешнее кольцо-градиент */}
        <circle cx="210" cy="210" r="150" fill="none" stroke="url(#ha-g)" strokeWidth="13" strokeLinecap="round" opacity="0.95" />

        {/* засечки-тики по кругу */}
        <circle cx="210" cy="210" r="122" fill="none" stroke="rgba(237,230,228,0.12)" strokeWidth="2" strokeDasharray="2 13" />

        {/* дуга «показания» (частичная, повёрнута) */}
        <circle
          cx="210" cy="210" r="92" fill="none" stroke="url(#ha-g)" strokeWidth="7"
          strokeLinecap="round" strokeDasharray="300 578" opacity="0.85"
          transform="rotate(-52 210 210)"
        />

        {/* скоростные штрихи */}
        <g strokeLinecap="round" stroke="url(#ha-g)">
          <line x1="60" y1="128" x2="196" y2="128" strokeWidth="5" opacity="0.7" />
          <line x1="44" y1="210" x2="150" y2="210" strokeWidth="5" opacity="0.5" />
          <line x1="66" y1="292" x2="188" y2="292" strokeWidth="5" opacity="0.62" />
        </g>

        {/* яркая точка-апекс на кольце + её свечение */}
        <circle cx="316" cy="118" r="16" fill="#F5834F" filter="url(#ha-blur)" opacity="0.8" />
        <circle cx="316" cy="118" r="7" fill="#FDE7DC" />
        <circle cx="316" cy="118" r="7" fill="none" stroke="#F5834F" strokeWidth="2.5" />

        {/* центральная ступица */}
        <circle cx="210" cy="210" r="12" fill="none" stroke="url(#ha-g)" strokeWidth="4" />
        <circle cx="210" cy="210" r="3.5" fill="#6E7BF2" />
      </svg>
    </div>
  );
}
