"use client";

// Графика героя: контур трассы ближайшего этапа (как ТВ-графика — в перспективе), по нему
// едет болид. Движение по «физике»: профиль скорости как у гоночной линии — предельная
// скорость в повороте ~ √(радиус), разгон и (более резкое) торможение ограничены, два
// прохода по кругу (вперёд/назад). Болид — силуэт, повёрнутый по направлению движения,
// с коротким затухающим хвостом. Контур — public/tracks/<circuit>.svg (один path).
// requestAnimationFrame без ре-рендеров; пауза вне экрана/в фоне; reduced motion — статика.
import { useEffect, useRef, useState } from "react";
import { Flag } from "@/components/Flag";

type Shape = { d: string; vb: string };

const LAP_SEC = 12; // «круг» ~12 секунд
const N = 720; // точек профиля
const V_TOP = 1; // нормированная максималка
const A_LAT = 0.028; // боковое ускорение → предел в повороте
const A_ACC = 0.016; // разгон
const A_BRK = 0.05; // торможение (сильнее разгона)
const ACCENT = "#7DE3F4"; // холодный акцент: контраст к красному фону

export function HeroTrack({
  circuit,
  label,
  round,
  country,
}: {
  circuit: string | null | undefined;
  label?: string | null;
  round?: number | null;
  country?: string | null;
}) {
  const [shape, setShape] = useState<Shape | null>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const base = useRef<SVGPathElement>(null);
  const trails = useRef<(SVGPathElement | null)[]>([]);
  const car = useRef<SVGGElement>(null);
  const start = useRef<SVGLineElement>(null);

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

  useEffect(() => {
    const path = base.current;
    if (!shape || !path) return;
    const total = path.getTotalLength();
    if (!total) return;
    const ds = total / N;

    // кривизна по широкой хорде (гасит шум ломаной)
    const pts = Array.from({ length: N }, (_, i) => path.getPointAtLength(i * ds));
    const W = 4;
    const curv = pts.map((b, i) => {
      const a = pts[(i - W + N) % N];
      const c = pts[(i + W) % N];
      let d = Math.abs(Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x));
      if (d > Math.PI) d = 2 * Math.PI - d;
      return d / (2 * W * ds);
    });
    // профиль скорости: предел поворота → проходы разгона вперёд и торможения назад
    const v = curv.map((k) => (k > 1e-4 ? Math.min(V_TOP, Math.sqrt(A_LAT / k)) : V_TOP));
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < N; i++) {
        const p = v[(i - 1 + N) % N];
        v[i] = Math.min(v[i], Math.sqrt(p * p + 2 * A_ACC * ds));
      }
      for (let i = N - 1; i >= 0; i--) {
        const n = v[(i + 1) % N];
        v[i] = Math.min(v[i], Math.sqrt(n * n + 2 * A_BRK * ds));
      }
    }
    const lapNorm = v.reduce((acc, x) => acc + ds / x, 0);
    const scale = lapNorm / LAP_SEC; // единиц пути в секунду при v=1

    // хвост: три наложенных отрезка разной длины и прозрачности → мягкое затухание
    const tails = [total * 0.045, total * 0.028, total * 0.014];
    tails.forEach((len, i) => trails.current[i]?.setAttribute("stroke-dasharray", `${len.toFixed(2)} ${(total - len).toFixed(2)}`));

    const p0 = path.getPointAtLength(0);
    const p1 = path.getPointAtLength(Math.min(1, total));
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x) + Math.PI / 2;
    const half = 3.2;
    start.current?.setAttribute("x1", (p0.x + Math.cos(ang) * half).toFixed(2));
    start.current?.setAttribute("y1", (p0.y + Math.sin(ang) * half).toFixed(2));
    start.current?.setAttribute("x2", (p0.x - Math.cos(ang) * half).toFixed(2));
    start.current?.setAttribute("y2", (p0.y - Math.sin(ang) * half).toFixed(2));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let s = total * 0.03;
    let heading = 0;
    let last = performance.now();
    let raf = 0;
    let running = false;
    let rx = 0, ry = 0, tx = 0, ty = 0;

    const draw = () => {
      const p = path.getPointAtLength(s);
      const q = path.getPointAtLength((s + 1.2) % total);
      const target = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
      let dh = target - heading;
      while (dh > 180) dh -= 360;
      while (dh < -180) dh += 360;
      heading += dh * 0.35; // плавный доворот корпуса
      car.current?.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${heading.toFixed(1)})`);
      tails.forEach((len, i) => trails.current[i]?.setAttribute("stroke-dashoffset", (len - s).toFixed(2)));
      rx += (tx - rx) * 0.06;
      ry += (ty - ry) * 0.06;
      if (tilt.current) tilt.current.style.transform = `perspective(1100px) rotateX(${(26 + ry).toFixed(2)}deg) rotateZ(${(-10 + rx).toFixed(2)}deg)`;
    };
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const i = Math.floor(s / ds) % N;
      const j = (i + 1) % N;
      const f = s / ds - Math.floor(s / ds);
      const vi = v[i] + (v[j] - v[i]) * f; // плавная интерполяция скорости
      s = (s + vi * scale * dt) % total;
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

    // стартовый курс без доворота
    const q0 = path.getPointAtLength(s + 1.2);
    const pS = path.getPointAtLength(s);
    heading = (Math.atan2(q0.y - pS.y, q0.x - pS.x) * 180) / Math.PI;
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
    <>
      <div className="pointer-events-none absolute inset-y-0 right-[-2%] hidden w-[62%] items-center justify-center md:flex" aria-hidden>
        <div
          ref={tilt}
          className="w-[96%]"
          style={{ transform: "perspective(1100px) rotateX(26deg) rotateZ(-10deg)", transformStyle: "preserve-3d" }}
        >
          <svg viewBox={shape.vb} className="h-auto w-full overflow-visible">
            <defs>
              <filter id="ht-soft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="0.9" />
              </filter>
              <filter id="ht-halo" x="-300%" y="-300%" width="700%" height="700%">
                <feGaussianBlur stdDeviation="1.8" />
              </filter>
            </defs>

            {/* тень, асфальт, кромки, осевая */}
            <path d={shape.d} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" transform="translate(1.2 2.2)" />
            <path d={shape.d} fill="none" stroke="rgba(237,230,228,0.22)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
            <path ref={base} d={shape.d} fill="none" stroke="#231d24" strokeWidth="4.3" strokeLinejoin="round" strokeLinecap="round" />
            <path d={shape.d} fill="none" stroke="rgba(237,230,228,0.14)" strokeWidth="0.35" strokeDasharray="1.6 1.6" />

            {/* старт/финиш */}
            <line ref={start} stroke="#F4EFEC" strokeWidth="1.2" strokeDasharray="0.9 0.9" />

            {/* короткий затухающий хвост */}
            {[0.22, 0.4, 0.75].map((o, i) => (
              <path
                key={i}
                ref={(el) => {
                  trails.current[i] = el;
                }}
                d={shape.d}
                fill="none"
                stroke={ACCENT}
                strokeWidth={1.2 + i * 0.3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={o}
                filter="url(#ht-soft)"
              />
            ))}

            {/* болид: силуэт носом по ходу движения */}
            <g ref={car}>
              <ellipse rx="3.4" ry="2" fill={ACCENT} opacity="0.55" filter="url(#ht-halo)" />
              <path d="M2.6 0 L0.9 -0.55 L-1.6 -0.75 L-2.2 -1.35 L-2.6 -1.35 L-2.6 1.35 L-2.2 1.35 L-1.6 0.75 L0.9 0.55 Z" fill="#F4FBFD" />
              <rect x="-2.75" y="-1.5" width="0.5" height="3" rx="0.15" fill="#F4FBFD" />
              <rect x="2.2" y="-1.05" width="0.45" height="2.1" rx="0.15" fill="#F4FBFD" />
            </g>
          </svg>
        </div>
      </div>

      {/* подпись этапа — заметной плашкой в углу */}
      {label && (
        <div className="pointer-events-none absolute bottom-6 right-6 hidden items-center gap-3 rounded-2xl border border-line bg-[rgba(18,11,13,0.62)] px-4 py-3 backdrop-blur-md md:flex md:bottom-8 md:right-8">
          <Flag code={country ?? null} w={28} />
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-mute">
              Трасса этапа{round != null ? ` ${round}` : ""}
            </div>
            <div className="font-display text-base font-semibold text-bone">{label}</div>
          </div>
        </div>
      )}
    </>
  );
}
