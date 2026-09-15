import { getDriverProfile } from "@/lib/api";
import { OG_SIZE, ogImage } from "@/lib/og";
import { TEAMS } from "@/lib/teams";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Профиль пилота — race.live";

export default async function Image({ params }: { params: { id: string } }) {
  try {
    const d = await getDriverProfile(params.id);
    const accent = (d.team_slug ? TEAMS[d.team_slug]?.color : undefined) as string | undefined;
    const parts = [d.team_name, d.points != null ? `${d.points} очков` : null].filter(Boolean);
    return ogImage({
      eyebrow: "Пилот",
      title: d.name_ru ?? d.name_en,
      subtitle: parts.join(" · "),
      accent,
    });
  } catch {
    return ogImage({ eyebrow: "Пилот", title: "race.live" });
  }
}
