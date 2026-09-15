// Прокси к внутреннему API: браузер до api:8000 напрямую не ходит (наружу — только web).
const BASE = process.env.API_INTERNAL_URL ?? "http://api:8000";

export async function GET() {
  try {
    const r = await fetch(`${BASE}/api/v1/live/speed`, { cache: "no-store" });
    return Response.json(await r.json());
  } catch {
    return Response.json({ speed: null, options: [] }, { status: 502 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const r = await fetch(`${BASE}/api/v1/live/speed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ speed: Number(body?.speed) }),
    });
    return Response.json(await r.json());
  } catch {
    return Response.json({ speed: null }, { status: 502 });
  }
}
