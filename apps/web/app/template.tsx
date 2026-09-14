"use client";

// Плавный переход между страницами: контент мягко проявляется при каждой навигации.
// MotionConfig reducedMotion="user" — уважает системную настройку «меньше движения»
// для всех анимаций внутри (переходы, перестроение тайминга, счётчики).
import { MotionConfig, motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
