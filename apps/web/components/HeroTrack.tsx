"use client";

// Графика героя: контур трассы ближайшего этапа (как ТВ-графика — в перспективе), по нему
// едет светящийся «болид» со шлейфом. Скорость зависит от кривизны: тормозит перед
// поворотами, разгоняется на прямых. Контур — public/tracks/<circuit>.svg (один path).
// Анимация на requestAnimationFrame без ре-рендеров; пауза вне экрана/в фоне; при
// prefers-reduced-motion — статичный кадр.
import { useEffect, useRef, useState } from "react";

type Shape = { d: string; vb: string };

const LAP_SEC = 9; // «круг» за ~9 секунд
const SAMPLES = 480;

export function HeroTrack({ circuit, label }: { circuit: string | null | undefined; label?: string | null }) {
  const [shape, setShape] = useState<Shape | null>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const base = useRef<SVGPathElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const car = useRef<SVGGElement>(null);
  const start = useRef<SVGLineElement>(null);

  // контур трассы
  useEffect(() => {
    if (!circuit) return;
    let off = false;
    fetch(`/tracks/${circuit}.svg`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => {
        const d = t.match(/\sd="([^"]+)"/)?.[1];
        const vb = t.match(/viewBox="([^"]+)"/)?.[1];
        if (!off && d && vb) setShape({ d, vb });
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [circuit]);

  // анимация
  useEffect(() => {
    const path = base.current;
    if (!shape || !path) return;
    const total = path.getTotalLength();
    if (!total) return;

    // профиль скорости по кривизне (с «взглядом вперёд» — тормозим до поворота)
    const pts = Array.from({ length: SAMPLES }, (_, i) => path.getPointAtLength((total * i) / SAMPLES));
    const curv = pts.map((b, i) => {
      const a = pts[(i - 1 + SAMPLES) % SAMPLES];
      const c = pts[(i + 1) % SAMPLES];
      let d = Math.abs(Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x));
      if (d > Math.PI) d = 2 * Math.PI - d;
      return d;
    });
    const speed = curv.map((_, i) => {
      let m = 0;
      for (let k = -3; k <= 9; k++) m = Math.max(m, curv[(i + k + SAMPLES) % SAMPLES]);
      return 1 / (1 + m * 10);
    });
    const meanInv = speed.reduce((acc, v) => acc + 1 / v, 0) / SAMPLES;
    const vmax = (total * meanInv) / LAP_SEC;

    const trailLen = total * 0.2;
    trail.current?.setAttribute("stroke-dasharray", `${trailLen.toFixed(2)} ${(total - trailLen).toFixed(2)}`);

    // линия старт/финиш поперёк трассы
    const p0 = path.getPointAtLength(0);
    const p1 = path.getPointAtLength(Math.min(1, total));
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x) + Math.PI / 2;
    const half = 3.2;
    start.current?.setAttribute("x1", (p0.x + Math.cos(ang) * half).toFixed(2));
    start.current?.setAttribute("y1", (p0.y + Math.sin(ang) * half).toFixed(2));
    start.current?.setAttribute("x2", (p0.x - Math.cos(ang) * half).toFixed(2));
    start.current?.setAttribute("y2", (p0.y - Math.sin(ang) * half).toFixed(2));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let s = total * 0.02;
    let last = performance.now();
    let raf = 0;
    let running = false;
    let rx = 0, ry = 0, tx = 0, ty = 0;

    const draw = () => {
      const p = path.getPointAtLength(s);
      car.current?.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
      trail.current?.setAttribute("stroke-dashoffset", (trailLen - s).toFixed(2));
      rx += (tx - rx) * 0.06;
      ry += (ty - ry) * 0.06;
      if (tilt.current) tilt.current.style.transform = `perspective(1100px) rotateX(${(24 + ry).toFixed(2)}deg) rotateZ(${(-10 + rx).toFixed(2)}deg)`;
    };
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const i = Math.floor((s / total) * SAMPLES) % SAMPLES;
      s = (s + vmax * speed[i] * dt) % total;
      draw();
      raf = requestAnimationFrame(loop);
    };
    const run = () => {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const halt = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    draw();
    if (reduce) return;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 8;
      ty = (e.clientY / window.innerHeight - 0.5) * -6;
    };
    const onVis = () => (document.hidden ? halt() : run());
    const io = new IntersectionObserver(([en]) => (en.isIntersecting && !document.hidden ? run() : halt()));
    if (tilt.current) io.observe(tilt.current);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    run();
    return () => {
      halt();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [shape]);

  if (!shape) return null;

  return (
    <div className="pointer-events-none absolute inset-y-0 right-[-2%] hidden w-[62%] flex-col items-center justify-center md:flex" aria-hidden>
      <div
        ref={tilt}
        className="w-[96%]"
        style={{ transform: "perspective(1100px) rotateX(24deg) rotateZ(-10deg)", transformStyle: "preserve-3d" }}
      >
        <svg viewBox={shape.vb} className="h-auto w-full overflow-visible">
          <defs>
            <linearGradient id="ht-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F5834F" />
              <stop offset="0.55" stopColor="#E0402F" />
              <stop offset="1" stopColor="#6E7BF2" />
            </linearGradient>
            <filter id="ht-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
            <filter id="ht-car" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
          </defs>

          {/* «асфальт» и тень */}
          <path d={shape.d} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="5.5" strokeLinejoin="round" strokeLinecap="round" transform="translate(1.2 2)" />
          <path ref={base} d={shape.d} fill="none" stroke="#2a2128" strokeWidth="4.2" strokeLinejoin="round" strokeLinecap="round" />
          {/* разметка — тонкая градиентная линия по центру */}
          <path d={shape.d} fill="none" stroke="url(#ht-g)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round" opacity="0.75" />
          {/* шлейф болида */}
          <path ref={trail} d={shape.d} fill="none" stroke="#FFB38A" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" filter="url(#ht-glow)" opacity="0.95" />

          {/* старт/финиш */}
          <line ref={start} stroke="#F4EFEC" strokeWidth="1.1" strokeDasharray="0.9 0.9" />

          {/* болид */}
          <g ref={car}>
            <circle r="4.2" fill="#F5834F" filter="url(#ht-car)" opacity="0.9" />
            <circle r="1.7" fill="#FFF3EA" />
          </g>
        </svg>
      </div>
      {label && (
        <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-mute">
          <span className="h-px w-6" style={{ background: "var(--line-strong)" }} />
          Трасса этапа · <span className="text-bone">{label}</span>
        </div>
      )}
    </div>
  );
}
