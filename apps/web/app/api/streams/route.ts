// Прокси к внутреннему API: список стримов для клиентского опроса (напоминания об эфире).
const BASE = process.env.API_INTERNAL_URL ?? "http://api:8000";

export async function GET() {
  try {
    const r = await fetch(`${BASE}/api/v1/streams`, { cache: "no-store" });
    return Response.json(await r.json());
  } catch {
    return Response.json([], { status: 502 });
  }
}
