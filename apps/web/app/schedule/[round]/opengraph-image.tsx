import { getMeeting } from "@/lib/api";
import { OG_SIZE, ogImage } from "@/lib/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Этап Формулы-1 — race.live";

export default async function Image({ params }: { params: { round: string } }) {
  try {
    const m = await getMeeting(Number(params.round));
    return ogImage({
      eyebrow: `Этап ${m.round}`,
      title: m.name_ru ?? m.name_en,
      subtitle: m.circuit?.name_ru ?? m.circuit?.name_en ?? "",
    });
  } catch {
    return ogImage({ eyebrow: "Этап", title: "race.live" });
  }
}
