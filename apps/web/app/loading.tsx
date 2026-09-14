// Мгновенный отклик при навигации: Next показывает это, пока серверная страница
// готовится (иначе клик «висит» без реакции на холодной загрузке).
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="h-40 rounded-[24px] bg-surface-1" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-[18px] bg-surface-1" />
        ))}
      </div>
      <div className="h-56 rounded-[18px] bg-surface-1" />
    </div>
  );
}
