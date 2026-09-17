// Мгновенный отклик при навигации: Next показывает это, пока серверная страница
// готовится (иначе клик «висит» без реакции на холодной загрузке).
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton h-40 rounded-[24px]" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-[18px]" />
        ))}
      </div>
      <div className="skeleton h-56 rounded-[18px]" />
    </div>
  );
}
