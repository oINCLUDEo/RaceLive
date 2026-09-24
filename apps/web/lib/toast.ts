// Глобальный стек уведомлений (без внешних зависимостей). Компоненты вызывают
// pushToast(...) откуда угодно; <ToastHost/> в layout подписан и рисует стек.

export type ToastKind = "live" | "reminder" | "info";

export type ToastInput = {
  title?: string;
  text: string;
  kind?: ToastKind;
  image?: string | null; // картинка слева (напр. постер эфира)
  href?: string; // кнопка «Смотреть»
  sound?: boolean; // звуковой сигнал (по умолчанию — для live/reminder)
};

export type Toast = ToastInput & { id: number; kind: ToastKind; ttl: number };

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();
let seq = 0;

function emit() {
  for (const l of listeners) l(toasts);
}

export function pushToast(input: string | ToastInput, ttl = 9000): number {
  const base: ToastInput = typeof input === "string" ? { text: input } : input;
  const id = ++seq;
  toasts = [...toasts, { ...base, kind: base.kind ?? "info", id, ttl }].slice(-3);
  emit();
  if (ttl > 0 && typeof window !== "undefined") {
    window.setTimeout(() => dismissToast(id), ttl);
  }
  return id;
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}
