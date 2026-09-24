// Прокси реакций к внутреннему API. IP зрителя пробрасываем — по нему бэкенд режет спам.
const BASE = process.env.API_INTERNAL_URL ?? "http://api:8000";

export async function POST(req: Request) {
  let body: { stream?: string; e?: string; n?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const stream = (body.stream ?? "").replace(/[^a-z0-9_-]/gi, "");
  if (!stream || !body.e) return Response.json({ ok: false }, { status: 400 });
  try {
    const r = await fetch(`${BASE}/api/v1/streams/${stream}/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": req.headers.get("x-forwarded-for") ?? "",
      },
      body: JSON.stringify({ e: body.e, n: body.n }),
      cache: "no-store",
    });
    return Response.json(await r.json().catch(() => ({})), { status: r.status });
  } catch {
    return Response.json({ ok: false }, { status: 502 });
  }
}
