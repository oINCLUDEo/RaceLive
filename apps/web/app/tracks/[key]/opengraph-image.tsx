import { getCircuit } from "@/lib/api";
import { OG_SIZE, ogImage } from "@/lib/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Трасса Формулы-1 — race.live";

export default async function Image({ params }: { params: { key: string } }) {
  try {
    const c = await getCircuit(params.key);
    return ogImage({ eyebrow: "Трасса", title: c.name_ru ?? c.name_en, subtitle: c.country ?? "" });
  } catch {
    return ogImage({ eyebrow: "Трасса", title: "race.live" });
  }
}
