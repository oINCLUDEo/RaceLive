// Прокси к внутреннему API: зачёт сезона для клиента. Нужен статичным страницам
// (словарь, обновления): они собираются при билде, когда API ещё недоступен, и без
// этого запекали бы «Зачёт временно недоступен».
import { getConstructorStandings, getDriverStandings } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [drivers, constructors] = await Promise.all([getDriverStandings(), getConstructorStandings()]);
    return Response.json({ drivers, constructors }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return Response.json({ drivers: [], constructors: [] }, { status: 502 });
  }
}
