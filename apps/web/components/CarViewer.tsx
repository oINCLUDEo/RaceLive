"use client";

// 3D-болид через <model-viewer> (CDN — без npm-зависимости). Модель ~1.6 МБ (Draco+webp).
// backdrop=true: СТАТИЧНАЯ неинтерактивная подложка (фиксированный ракурс, без вращения,
// клики проходят сквозь) — красиво встроенный элемент сцены.
import { createElement, useEffect, useState } from "react";

const CDN =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js";

export function CarViewer({ backdrop = false }: { backdrop?: boolean }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!document.getElementById("model-viewer-cdn")) {
      const s = document.createElement("script");
      s.id = "model-viewer-cdn";
      s.type = "module";
      s.src = CDN;
      document.body.appendChild(s);
    }
    let alive = true;
    customElements?.whenDefined("model-viewer").then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const common = {
    src: "/models/bolid-2023.glb",
    alt: "Болид Формулы-1 2023",
    "interaction-prompt": "none",
    "environment-image": "neutral",
    loading: "lazy" as const,
    reveal: "auto" as const,
  };

  const attrs = backdrop
    ? {
        ...common,
        // статичный ракурс — сбоку, чуть спереди; авто-кадрирование; без вращения/интеракции
        "camera-orbit": "-20deg 80deg auto",
        "disable-zoom": "",
        "disable-tap": "",
        "disable-pan": "",
        exposure: "1.25",
        "shadow-intensity": "0",
        style: {
          width: "100%",
          height: "100%",
          background: "transparent",
          pointerEvents: "none" as const,
          ["--poster-color" as string]: "transparent",
        },
      }
    : {
        ...common,
        "camera-controls": "",
        "auto-rotate": "",
        "touch-action": "pan-y",
        exposure: "1.05",
        "shadow-intensity": "0.5",
        style: {
          width: "100%",
          height: "100%",
          background: "transparent",
          ["--poster-color" as string]: "transparent",
        },
      };

  return (
    <div className="relative h-full w-full">
      {!ready && !backdrop && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-mute">
          загрузка 3D…
        </div>
      )}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {createElement("model-viewer", attrs as any)}
    </div>
  );
}
