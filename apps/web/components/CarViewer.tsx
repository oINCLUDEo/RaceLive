"use client";

// Интерактивный 3D-болид через <model-viewer> (грузится с CDN — без npm-зависимости,
// чтобы не ломать кэш сборки). Модель оптимизирована до ~1.6 МБ (Draco + webp).
import { createElement, useEffect, useState } from "react";

const CDN =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js";

export function CarViewer() {
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

  return (
    <div className="relative h-full w-full">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-mute">
          загрузка 3D…
        </div>
      )}
      {createElement("model-viewer", {
        src: "/models/bolid-2023.glb",
        alt: "Болид Формулы-1 2023 в 3D",
        "camera-controls": "",
        "auto-rotate": "",
        "rotation-per-second": "18deg",
        "touch-action": "pan-y",
        "interaction-prompt": "none",
        exposure: "1.05",
        "shadow-intensity": "0.5",
        loading: "lazy",
        reveal: "auto",
        style: {
          width: "100%",
          height: "100%",
          background: "transparent",
          ["--poster-color" as string]: "transparent",
        },
      })}
    </div>
  );
}
