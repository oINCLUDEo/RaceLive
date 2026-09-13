"use client";

// 3D-болид через <model-viewer> (CDN — без npm-зависимости). Модель ~1.6 МБ (Draco+webp).
// backdrop=true: неинтерактивная подложка героя (медленное вращение, свет, клики проходят сквозь).
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
    alt: "Болид Формулы-1 2023 в 3D",
    "auto-rotate": "",
    "rotation-per-second": backdrop ? "14deg" : "20deg",
    "interaction-prompt": "none",
    "environment-image": "neutral",
    exposure: backdrop ? "1.3" : "1.05",
    "shadow-intensity": backdrop ? "0" : "0.5",
    loading: "lazy" as const,
    reveal: "auto" as const,
  };

  const attrs = backdrop
    ? {
        ...common,
        "disable-zoom": "",
        "disable-tap": "",
        "disable-pan": "",
        "camera-orbit": "-20deg 78deg 3.9m",
        "field-of-view": "28deg",
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
        "touch-action": "pan-y",
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
