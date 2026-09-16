import { getTeam } from "@/lib/api";
import { OG_SIZE, ogImage } from "@/lib/og";
import { TEAMS } from "@/lib/teams";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Команда Формулы-1 — race.live";

export default async function Image({ params }: { params: { slug: string } }) {
  try {
    const t = await getTeam(params.slug);
    const accent = TEAMS[params.slug]?.color as string | undefined;
    const parts = [
      t.position != null ? `P${t.position} в кубке` : null,
      t.points != null ? `${t.points} очков` : null,
    ].filter(Boolean);
    return ogImage({ eyebrow: "Команда", title: t.name, subtitle: parts.join(" · "), accent });
  } catch {
    return ogImage({ eyebrow: "Команда", title: "race.live" });
  }
}
