"use client";

// Живая графика героя (телеметрия/тахометр): комета бежит по кольцу, дуга «оборотов»
// набирает и сбрасывает на переключении передачи, засечки медленно вращаются, штрихи
// скорости летят, вся сцена чуть смещается за курсором. Анимация на requestAnimationFrame
// через прямую запись атрибутов (без ре-рендеров React); пауза вне экрана и во фоновой
// вкладке; при prefers-reduced-motion — статичный кадр.
import { useEffect, useRef } from "react";

const CX = 210;
const CY = 210;
const R_OUT = 150;
const R_RPM = 92;
const C_OUT = 2 * Math.PI * R_OUT;
const C_RPM = 2 * Math.PI * R_RPM;
const TRAIL = 180; // длина хвоста кометы по дуге
const STREAKS = [
  { x1: 60, y1: 128, x2: 196, y2: 128, o: 0.7, v: 150 },
  { x1: 44, y1: 210, x2: 150, y2: 210, o: 0.5, v: 210 },
  { x1: 66, y1: 292, x2: 188, y2: 292, o: 0.62, v: 180 },
];

export function HeroArt() {
  const svg = useRef<SVGSVGElement>(null);
  const scene = useRef<SVGGElement>(null);
  const dot = useRef<SVGGElement>(null);
  const trail = useRef<SVGCircleElement>(null);
  const rpm = useRef<SVGCircleElement>(null);
  const ticks = useRef<SVGCircleElement>(null);
  const hub = useRef<SVGCircleElement>(null);
  const streaks = useRef<(SVGLineElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = 0;
    let running = false;
    let px = 0, py = 0, tx = 0, ty = 0;

    const draw = (t: number) => {
      // комета по внешнему кольцу (старт — сверху, по часовой)
      const a = t * 0.5 - Math.PI / 2;
      dot.current?.setAttribute("transform", `translate(${(CX + R_OUT * Math.cos(a)).toFixed(2)} ${(CY + R_OUT * Math.sin(a)).toFixed(2)})`);
      const trailDeg = ((a - TRAIL / R_OUT) * 180) / Math.PI;
      trail.current?.setAttribute("transform", `rotate(${trailDeg.toFixed(2)} ${CX} ${CY})`);

      // «обороты»: разгон 0.45→1, затем переключение передачи — сброс до 0.45
      const cycle = 2.8;
      const p = (t % cycle) / cycle;
      const rev = p < 0.82 ? 0.45 + 0.55 * (1 - Math.pow(1 - p / 0.82, 2.2)) : 1 - ((p - 0.82) / 0.18) * 0.55;
      rpm.current?.setAttribute("stroke-dasharray", `${(rev * 440).toFixed(1)} ${C_RPM.toFixed(1)}`);

      ticks.current?.setAttribute("transform", `rotate(${(-t * 5) % 360} ${CX} ${CY})`);
      hub.current?.setAttribute("r", (12 + Math.sin(t * 3) * 1.6).toFixed(2));
      streaks.current.forEach((l, i) => l?.setAttribute("stroke-dashoffset", ((t * STREAKS[i].v) % 460).toFixed(1)));

      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;
      scene.current?.setAttribute("transform", `translate(${px.toFixed(2)} ${py.toFixed(2)})`);
    };

    const loop = (now: number) => {
      draw((now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    draw(1.2); // первый кадр сразу (и единственный — при reduced motion)
    if (reduce) return;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 18;
      ty = (e.clientY / window.innerHeight - 0.5) * 14;
    };
    const onVis = () => (document.hidden ? stop() : start());
    const io = new IntersectionObserver(([en]) => (en.isIntersecting && !document.hidden ? start() : stop()));
    if (svg.current) io.observe(svg.current);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-[-8%] hidden w-[60%] items-center justify-center md:flex"
      aria-hidden
    >
      <svg ref={svg} viewBox="0 0 420 420" className="h-[116%] w-auto overflow-visible">
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
          <filter id="ha-soft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <g ref={scene}>
          <circle cx={CX} cy={CY} r="185" fill="url(#ha-glow)" />

          {/* внешнее кольцо + бегущий по нему светлый хвост кометы */}
          <circle cx={CX} cy={CY} r={R_OUT} fill="none" stroke="url(#ha-g)" strokeWidth="13" strokeLinecap="round" opacity="0.9" />
          <circle
            ref={trail}
            cx={CX} cy={CY} r={R_OUT} fill="none" stroke="#FDE7DC" strokeWidth="13" strokeLinecap="round"
            strokeDasharray={`${TRAIL} ${C_OUT.toFixed(1)}`} opacity="0.45" filter="url(#ha-soft)"
            transform={`rotate(${(-90 - (TRAIL / R_OUT) * (180 / Math.PI)).toFixed(2)} ${CX} ${CY})`}
          />

          {/* засечки — медленно вращаются навстречу */}
          <circle ref={ticks} cx={CX} cy={CY} r="122" fill="none" stroke="rgba(237,230,228,0.14)" strokeWidth="2" strokeDasharray="2 13" />

          {/* дуга «оборотов» */}
          <circle
            ref={rpm}
            cx={CX} cy={CY} r={R_RPM} fill="none" stroke="url(#ha-g)" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`300 ${C_RPM.toFixed(1)}`} opacity="0.9" transform={`rotate(135 ${CX} ${CY})`}
          />

          {/* штрихи скорости (бегут справа налево) */}
          <g strokeLinecap="round" stroke="url(#ha-g)">
            {STREAKS.map((s, i) => (
              <line
                key={i}
                ref={(el) => {
                  streaks.current[i] = el;
                }}
                x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} strokeWidth="5" opacity={s.o} strokeDasharray="58 172"
              />
            ))}
          </g>

          {/* комета-апекс */}
          <g ref={dot} transform={`translate(${CX} ${CY - R_OUT})`}>
            <circle r="17" fill="#F5834F" filter="url(#ha-blur)" opacity="0.85" />
            <circle r="7" fill="#FDE7DC" />
            <circle r="7" fill="none" stroke="#F5834F" strokeWidth="2.5" />
          </g>

          {/* ступица */}
          <circle ref={hub} cx={CX} cy={CY} r="12" fill="none" stroke="url(#ha-g)" strokeWidth="4" />
          <circle cx={CX} cy={CY} r="3.5" fill="#6E7BF2" />
        </g>
      </svg>
    </div>
  );
}
