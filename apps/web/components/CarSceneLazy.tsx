"use client";

// Ленивая подгрузка 3D-сцены отдельным чанком (three.js не входит в критический
// бандл главной): текст/CTA героя рисуются сразу, болид подтягивается после.
import dynamic from "next/dynamic";

export const CarSceneLazy = dynamic(
  () => import("./CarScene").then((m) => m.CarScene),
  { ssr: false },
);
