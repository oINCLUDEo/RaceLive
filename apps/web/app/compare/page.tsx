import { CompareView } from "@/components/CompareView";
import { getCompare, type CompareOut } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Сравнение пилотов",
  description: "Сравнение двух пилотов по кругам гонки: времена кругов, лучший и средний темп.",
};

export default async function ComparePage() {
  let data: CompareOut | null = null;
  try {
    data = await getCompare();
  } catch {
    data = null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-mute">
          сравнение
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] normal-case tracking-normal">тест</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Сравнение пилотов</h1>
        {data?.session && <p className="mt-1 text-mute">{data.session}</p>}
      </div>

      {data && data.drivers.length >= 2 ? (
        <CompareView data={data} />
      ) : (
        <div className="card-soft p-6 text-sm text-mute">
          Пока нет данных по кругам для сравнения — они появляются во время или после гоночного уик-энда.
        </div>
      )}
    </div>
  );
}
