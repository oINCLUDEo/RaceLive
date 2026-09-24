"use client";

// Общие реакции у стрима: клик улетает всем, кто смотрит этот стрим на race.live
// (канал Centrifugo reactions:<id>). Свои SVG-реакты вместо эмодзи; лайк — отдельная
// кнопка с общим счётчиком и «взрывом» сердечек. Свою реакцию показываем сразу и не
// дублируем по эху (метка n). Там же — сколько людей смотрят стрим у нас (presence).
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { Subscription } from "centrifuge";
import { REACT_IDS, REACT_LABEL, ReactIcon, type ReactId } from "@/components/ReactIcon";
import { getCentrifuge } from "@/lib/realtimeClient";

type Floater = { id: number; r: ReactId; x: number; sway: number; burst: boolean };

const compact = (n: number) => new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const BURST = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return { dx: Math.round(Math.cos(a) * 46), dy: Math.round(Math.sin(a) * 38) - 10 };
});

export function Reactions({ streamId, initialLikes = 0 }: { streamId: string; initialLikes?: number }) {
  const [items, setItems] = useState<Floater[]>([]);
  const [viewers, setViewers] = useState<number | null>(null);
  const [likes, setLikes] = useState(initialLikes);
  const [pop, setPop] = useState(0);
  const mine = useRef<Set<string>>(new Set());
  const lastSend = useRef(0);

  useEffect(() => setLikes(initialLikes), [streamId, initialLikes]);

  const spawn = (r: ReactId, own: boolean) => {
    const id = Date.now() + Math.random();
    const f: Floater = {
      id,
      r,
      x: own && r === "like" ? 8 : Math.round(12 + Math.random() * 62),
      sway: Math.round(Math.random() * 36 - 18),
      burst: r === "like",
    };
    setItems((v) => [...v.slice(-28), f]);
    window.setTimeout(() => setItems((v) => v.filter((i) => i.id !== id)), 2000);
  };

  useEffect(() => {
    let cancelled = false;
    let sub: Subscription | null = null;
    let iv = 0;
    setViewers(null);
    (async () => {
      const c = await getCentrifuge();
      if (!c || cancelled) return;
      const ch = `reactions:${streamId}`;
      sub = c.getSubscription(ch) ?? c.newSubscription(ch);
      sub.on("publication", (ctx) => {
        const d = ctx.data as { e?: string; n?: string; c?: number };
        if (!d?.e || !REACT_IDS.includes(d.e as ReactId)) return;
        if (typeof d.c === "number") setLikes((v) => Math.max(v, d.c!));
        if (d.n && mine.current.has(d.n)) return; // своя — уже показали
        spawn(d.e as ReactId, false);
      });
      sub.subscribe();
      const poll = async () => {
        try {
          const st = await sub!.presenceStats();
          if (!cancelled) setViewers(st.numClients);
        } catch {
          /* presence ещё не готов — в следующий раз */
        }
      };
      window.setTimeout(poll, 1500);
      iv = window.setInterval(poll, 15_000);
    })();
    return () => {
      cancelled = true;
      clearInterval(iv);
      if (sub) {
        sub.removeAllListeners();
        sub.unsubscribe();
        void getCentrifuge().then((c) => c && sub && c.removeSubscription(sub));
      }
    };
  }, [streamId]);

  const send = (r: ReactId) => {
    const now = Date.now();
    if (now - lastSend.current < 220) return; // не даём заспамить кликами
    lastSend.current = now;
    const n = Math.random().toString(36).slice(2, 12);
    mine.current.add(n);
    spawn(r, true);
    if (r === "like") {
      setLikes((v) => v + 1);
      setPop((p) => p + 1);
    }
    void fetch("/api/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stream: streamId, e: r, n }),
    }).catch(() => {});
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {/* ЛАЙК — главная кнопка с общим счётчиком */}
      <button
        key={pop}
        onClick={() => send("like")}
        className={`pressable inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${pop ? "like-pop" : ""}`}
        style={{ borderColor: "rgba(255,122,147,0.35)", background: "linear-gradient(110deg, rgba(255,122,147,0.18), rgba(224,64,47,0.12))" }}
        aria-label="Лайк"
      >
        <ReactIcon id="like" size={20} uid="btn" />
        <span className="tabular text-bone">{likes > 0 ? compact(likes) : "Лайк"}</span>
      </button>

      {/* необычные реакты */}
      {REACT_IDS.filter((r) => r !== "like").map((r) => (
        <button
          key={r}
          onClick={() => send(r)}
          title={REACT_LABEL[r]}
          aria-label={REACT_LABEL[r]}
          className="pressable flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-1 hover:bg-surface-2"
        >
          <ReactIcon id={r} size={20} uid={`b-${r}`} />
        </button>
      ))}

      {viewers != null && (
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-mute" title="Сколько людей смотрят этот стрим на race.live">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="tabular font-medium text-bone">{viewers}</span> на race.live
        </span>
      )}

      {/* слой всплывающих реакций */}
      <div className="pointer-events-none absolute bottom-full left-0 h-44 w-full overflow-visible">
        {items.map((f) => (
          <span key={f.id} className="absolute bottom-0" style={{ left: `${f.x}%` }}>
            <span className="react-rise block" style={{ "--sway": `${f.sway}px` } as CSSProperties}>
              <ReactIcon id={f.r} size={36} uid={String(f.id).replace(".", "")} />
            </span>
            {f.burst &&
              BURST.map((b, i) => (
                <span
                  key={i}
                  className="react-burst absolute left-2 top-2"
                  style={{ "--dx": `${b.dx}px`, "--dy": `${b.dy}px` } as CSSProperties}
                >
                  <ReactIcon id="like" size={12} uid={`${String(f.id).replace(".", "")}-${i}`} />
                </span>
              ))}
          </span>
        ))}
      </div>
    </div>
  );
}
