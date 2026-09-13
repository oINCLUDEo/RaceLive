"use client";

// Затемнённый болид как фоновый наполнитель героя — статичный, с шейдерами
// (three.js + Bloom/Vignette). Оптимизация: frameloop="demand" — после того как
// модель/окружение устаканились, сцена ЗАМИРАЕТ и не жрёт GPU/CPU (важно для нагрузки).
import { Bounds, Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useState } from "react";

const MODEL = "/models/bolid-2023.glb";

function Car() {
  const { scene } = useGLTF(MODEL, true);
  return <primitive object={scene} />;
}
useGLTF.preload(MODEL, true);

// Толкает несколько кадров, пока грузится модель и подгоняется кадрирование,
// затем перестаёт — сцена статична и рендер простаивает.
function SettleThenIdle() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      invalidate();
      if (++n > 40) clearInterval(id); // ~4 c, потом покой
    }, 100);
    return () => clearInterval(id);
  }, [invalidate]);
  return null;
}

export function CarScene() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Canvas
      frameloop="demand"
      camera={{ position: [3.4, 1.05, 4.6], fov: 32 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 0.72, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <SettleThenIdle />
      <ambientLight intensity={0.14} />
      <directionalLight position={[5, 6, 4]} intensity={1.1} color="#fbeee9" />
      <directionalLight position={[-4, 2, -5]} intensity={2.6} color="#e0402f" />

      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.12}>
          <Car />
        </Bounds>
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
