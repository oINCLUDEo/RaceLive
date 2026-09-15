// Прокси к внутреннему API: данные сравнения для выбранной гонки (браузер до api не ходит).
const BASE = process.env.API_INTERNAL_URL ?? "http://api:8000";

export async function GET(req: Request) {
  const s = new URL(req.url).searchParams.get("session");
  const q = s ? `?session=${encodeURIComponent(s)}` : "";
  try {
    const r = await fetch(`${BASE}/api/v1/compare${q}`, { next: { revalidate: 3600 } });
    return Response.json(await r.json());
  } catch {
    return Response.json({ session: null, session_key: null, drivers: [], sessions: [] }, { status: 502 });
  }
}
