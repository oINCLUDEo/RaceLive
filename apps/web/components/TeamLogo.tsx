import { TEAMS } from "@/lib/teams";

// Рендерит логотип команды из public/teams/<slug>.svg.
// Замените файл на настоящий логотип — вёрстка не изменится.
export function TeamLogo({ slug, size = 26 }: { slug: string; size?: number }) {
  const team = TEAMS[slug];
  if (!team) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/teams/${slug}.svg`}
      alt={team.name}
      title={team.name}
      width={size}
      height={size}
      className="team-logo"
      style={{ width: size, height: size }}
    />
  );
}
