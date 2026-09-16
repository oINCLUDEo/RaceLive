import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Шрифты (PT Sans, латиница+кириллица) лежат в public/fonts — public копируется в
// standalone-образ, поэтому доступны на рантайме через fs.
const fontsDir = join(process.cwd(), "public", "fonts");

export const OG_SIZE = { width: 1200, height: 630 };

export async function ogImage(opts: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  const [reg, bold] = await Promise.all([
    readFile(join(fontsDir, "reg.ttf")),
    readFile(join(fontsDir, "bold.ttf")),
  ]);
  const accent = opts.accent ?? "#E0402F";

  const res = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #1c0f13 0%, #120a0c 70%)",
          color: "#EDE6E4",
          fontFamily: "PT",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, background: accent }} />
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>
            race<span style={{ color: "#9E96A0" }}>.live</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {opts.eyebrow ? (
            <div style={{ fontSize: 28, color: "#9E96A0", textTransform: "uppercase", letterSpacing: 6 }}>
              {opts.eyebrow}
            </div>
          ) : null}
          <div style={{ display: "flex", fontSize: 78, fontWeight: 700, lineHeight: 1.04 }}>{opts.title}</div>
          {opts.subtitle ? <div style={{ display: "flex", fontSize: 36, color: "#9E96A0" }}>{opts.subtitle}</div> : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26, color: "#9E96A0" }}>
          <span style={{ display: "flex" }}>Формула-1 на русском</span>
          <div style={{ width: 140, height: 10, borderRadius: 8, background: accent }} />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "PT", data: reg, weight: 400, style: "normal" },
        { name: "PT", data: bold, weight: 700, style: "normal" },
      ],
    },
  );

  // Буферизуем и отдаём с Content-Length: часть фетчеров превью (в т.ч. Telegram)
  // не принимает картинку, отданную стримом без длины.
  const buf = await res.arrayBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(buf.byteLength),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
