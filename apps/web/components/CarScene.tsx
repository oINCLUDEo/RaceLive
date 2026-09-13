"use client";

// Затемнённый болид как фоновый наполнитель героя.
// Полноценные шейдеры: three.js (react-three-fiber) + постобработка (Bloom, Vignette).
// Модель ~1.6 МБ (Draco). Освещение из Lightformer-окружения — без внешних HDRI.
import { Bounds, Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useState } from "react";

const MODEL = "/models/bolid-2023.glb";

function Car() {
  const { scene } = useGLTF(MODEL, true);
  return <primitive object={scene} />;
}
useGLTF.preload(MODEL, true);

export function CarScene() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Canvas
      camera={{ position: [3.4, 1.05, 4.6], fov: 32 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 0.72 }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.14} />
      {/* холодный ключевой + тёплый ember-контур */}
      <directionalLight position={[5, 6, 4]} intensity={1.1} color="#fbeee9" />
      <directionalLight position={[-4, 2, -5]} intensity={2.6} color="#e0402f" />

      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.12}>
          <Car />
        </Bounds>
        {/* окружение из светоформ — блики на металле без внешних файлов */}
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={2.4} position={[4, 4, 4]} scale={[9, 6, 1]} color="#fff2ec" />
          <Lightformer form="rect" intensity={4.2} position={[-5, 1.5, -4]} scale={[9, 5, 1]} color="#e0402f" />
          <Lightformer form="rect" intensity={1.1} position={[0, -3, 3]} scale={[12, 5, 1]} color="#7a1f16" />
        </Environment>
      </Suspense>

      <EffectComposer>
        <Bloom intensity={0.85} luminanceThreshold={0.62} luminanceSmoothing={0.25} mipmapBlur />
        <Vignette eskil={false} offset={0.22} darkness={0.92} />
      </EffectComposer>
    </Canvas>
  );
}
