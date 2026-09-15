// Прокси к внутреннему API: перемотать реплей к старту гонки.
const BASE = process.env.API_INTERNAL_URL ?? "http://api:8000";

export async function POST() {
  try {
    const r = await fetch(`${BASE}/api/v1/live/seek-start`, { method: "POST" });
    return Response.json(await r.json());
  } catch {
    return Response.json({ ok: false }, { status: 502 });
  }
}
