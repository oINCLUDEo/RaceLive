// Простой глобальный стек тостов (без внешних зависимостей). Компоненты вызывают
// pushToast(text) откуда угодно; <ToastHost/> в layout подписан и рисует стек.

export type Toast = { id: number; text: string };

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();
let seq = 0;

function emit() {
  for (const l of listeners) l(toasts);
}

export function pushToast(text: string, ttl = 9000): number {
  const id = ++seq;
  toasts = [...toasts, { id, text }].slice(-4); // не больше 4 на экране
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
