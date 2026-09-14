"use client";

// Переходы между страницами теперь делает View Transitions API (см. layout +
// globals). Здесь оставляем только MotionConfig reducedMotion="user" — он уважает
// системную «меньше движения» для остальных анимаций (тайминг, count-up).
import { MotionConfig } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
