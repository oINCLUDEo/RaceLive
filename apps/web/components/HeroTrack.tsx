"use client";

// Графика героя: контур трассы ближайшего этапа в ТВ-перспективе и маркеры пилотов,
// как на карте трассы в трансляции F1 — кружки в цветах команд с трёхбуквенными кодами
// (лидеры чемпионата). Едут по «гоночной линии»: предел скорости в повороте ~√радиуса,
// разгон и более резкое торможение; одинаковый профиль → постоянный разрыв во времени,
// поэтому на прямых они растягиваются, в поворотах сжимаются, как в жизни.
// requestAnimationFrame без ре-рендеров; пауза вне экрана/в фоне; reduced motion — статика.
import { useEffect, useRef, useState } from "react";
import { Flag } from "@/components/Flag";

type Shape = { d: string; vb: string };
export type TrackDriver = { code: string; color: string };

const LAP_SEC = 14;
const N = 720;
const V_TOP = 1;
const A_LAT = 0.028;
const A_ACC = 0.016;
const A_BRK = 0.05;
const GAPS_SEC = [0, 0.9, 1.7]; // отставание 2-го и 3-го от лидера (в секундах анимации)

export function HeroTrack({
  circuit,
  label,
  round,
  country,
  drivers,
}: {
  circuit: string | null | undefined;
  label?: string | null;
  round?: number | null;
  country?: string | null;
  drivers?: TrackDriver[];
}) {
  const [shape, setShape] = useState<Shape | null>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const base = useRef<SVGPathElement>(null);
  const marks = useRef<(SVGGElement | null)[]>([]);
  const start = useRef<SVGLineElement>(null);
  const cars = (drivers?.length ? drivers : [{ code: "", color: "#EDE6E4" }]).slice(0, 3);

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

    const pts = Array.from({ length: N }, (_, i) => path.getPointAtLength(i * ds));
    const W = 4;
    const curv = pts.map((b, i) => {
      const a = pts[(i - W + N) % N];
      const c = pts[(i + W) % N];
      let d = Math.abs(Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x));
      if (d > Math.PI) d = 2 * Math.PI - d;
      return d / (2 * W * ds);
    });
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
    const scale = v.reduce((acc, x) => acc + ds / x, 0) / LAP_SEC;
    const speedAt = (s: number) => {
      const i = Math.floor(s / ds) % N;
      const f = s / ds - Math.floor(s / ds);
      return v[i] + (v[(i + 1) % N] - v[i]) * f;
    };
    const advance = (s: number, sec: number) => {
      let t = sec;
      let x = s;
      while (t > 0) {
        const dt = Math.min(0.02, t);
        x = (x + speedAt(x) * scale * dt) % total;
        t -= dt;
      }
      return x;
    };

    // старт/финиш
    const p0 = path.getPointAtLength(0);
    const p1 = path.getPointAtLength(Math.min(1, total));
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x) + Math.PI / 2;
    const half = 2;
    start.current?.setAttribute("x1", (p0.x + Math.cos(ang) * half).toFixed(2));
    start.current?.setAttribute("y1", (p0.y + Math.sin(ang) * half).toFixed(2));
    start.current?.setAttribute("x2", (p0.x - Math.cos(ang) * half).toFixed(2));
    start.current?.setAttribute("y2", (p0.y - Math.sin(ang) * half).toFixed(2));

    // разводим машины по времени: лидер впереди на GAPS_SEC
    const s0 = total * 0.02;
    const maxGap = GAPS_SEC[cars.length - 1] ?? 0;
    const pos = cars.map((_, k) => advance(s0, maxGap - (GAPS_SEC[k] ?? 0)));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now();
    let raf = 0;
    let running = false;
    let rx = 0, ry = 0, tx = 0, ty = 0;

    const draw = () => {
      pos.forEach((s, k) => {
        const p = path.getPointAtLength(s);
        marks.current[k]?.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
      });
      rx += (tx - rx) * 0.06;
      ry += (ty - ry) * 0.06;
      if (tilt.current) tilt.current.style.transform = `perspective(1100px) rotateX(${(26 + ry).toFixed(2)}deg) rotateZ(${(-10 + rx).toFixed(2)}deg)`;
    };
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (let k = 0; k < pos.length; k++) pos[k] = (pos[k] + speedAt(pos[k]) * scale * dt) % total;
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
    // cars задаются сервером один раз; перезапуск нужен только при смене трассы
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            {/* тень, кромка, асфальт, осевая — тонко, чтобы близкие участки не слипались */}
            <path d={shape.d} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" transform="translate(0.9 1.6)" />
            <path d={shape.d} fill="none" stroke="rgba(237,230,228,0.26)" strokeWidth="2.9" strokeLinejoin="round" strokeLinecap="round" />
            <path ref={base} d={shape.d} fill="none" stroke="#211b22" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            <path d={shape.d} fill="none" stroke="rgba(237,230,228,0.16)" strokeWidth="0.22" strokeDasharray="1.1 1.1" />

            <line ref={start} stroke="#F4EFEC" strokeWidth="0.9" strokeDasharray="0.6 0.6" />

            {/* маркеры пилотов, как на карте трассы в трансляции */}
            {cars
              .map((c, k) => ({ c, k }))
              .reverse()
              .map(({ c, k }) => (
                <g
                  key={k}
                  ref={(el) => {
                    marks.current[k] = el;
                  }}
                >
                  <circle r="2.6" fill={c.color} opacity="0.35" />
                  <circle r="1.55" fill={c.color} stroke="#fff" strokeWidth="0.45" />
                  {c.code && (
                    <g transform="translate(2.4 -4.6)">
                      <rect width={c.code.length * 1.75 + 2.6} height="3.4" rx="0.9" fill="rgba(12,9,12,0.86)" />
                      <rect width="0.7" height="3.4" rx="0.3" fill={c.color} />
                      <text x="1.5" y="2.55" fontSize="2.4" fontWeight="700" fill="#F4EFEC" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", letterSpacing: "0.05em" }}>
                        {c.code}
                      </text>
                    </g>
                  )}
                </g>
              ))}
          </svg>
        </div>
      </div>

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
