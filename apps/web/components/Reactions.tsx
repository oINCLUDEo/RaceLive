"use client";

// Общие реакции у стрима: клик улетает всем, кто смотрит этот стрим на race.live
// (канал Centrifugo reactions:<id>), и всплывает у каждого. Свою реакцию показываем
// сразу и не дублируем по эху (метка n). Там же — сколько людей смотрят стрим у нас
// (presence канала).
import { useEffect, useRef, useState } from "react";
import type { Subscription } from "centrifuge";
import { getCentrifuge } from "@/lib/realtimeClient";

export const REACTIONS = ["🔥", "❤️", "👏", "🏎️", "😮"];

export function Reactions({ streamId }: { streamId: string }) {
  const [items, setItems] = useState<{ id: number; e: string; x: number }[]>([]);
  const [viewers, setViewers] = useState<number | null>(null);
  const mine = useRef<Set<string>>(new Set());
  const lastSend = useRef(0);

  const float = (e: string) => {
    const id = Date.now() + Math.random();
    const x = Math.round(Math.random() * 90 - 20);
    setItems((v) => [...v.slice(-24), { id, e, x }]);
    window.setTimeout(() => setItems((v) => v.filter((i) => i.id !== id)), 1600);
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
        const d = ctx.data as { e?: string; n?: string };
        if (!d?.e || !REACTIONS.includes(d.e)) return;
        if (d.n && mine.current.has(d.n)) return; // своя — уже показали
        float(d.e);
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

  const send = (e: string) => {
    const now = Date.now();
    if (now - lastSend.current < 250) return; // не даём заспамить кликами
    lastSend.current = now;
    const n = Math.random().toString(36).slice(2, 12);
    mine.current.add(n);
    float(e);
    void fetch("/api/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stream: streamId, e, n }),
    }).catch(() => {});
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {viewers != null && (
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-mute" title="Сколько людей смотрят этот стрим на race.live">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="tabular font-medium text-bone">{viewers}</span> на race.live
        </span>
      )}
      {REACTIONS.map((e) => (
        <button
          key={e}
          onClick={() => send(e)}
          className="pressable rounded-full border border-line bg-surface-1 px-2.5 py-1 text-sm leading-none hover:bg-surface-2"
          aria-label={`Реакция ${e}`}
        >
          {e}
        </button>
      ))}
      <div className="pointer-events-none absolute bottom-full left-0 h-28 w-full overflow-visible">
        {items.map((i) => (
          <span key={i.id} className="react-float absolute bottom-0 text-xl" style={{ left: `calc(40% + ${i.x}px)` }}>
            {i.e}
          </span>
        ))}
      </div>
    </div>
  );
}
