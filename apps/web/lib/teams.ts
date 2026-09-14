// Справочник команд для логотипов и цветов.
// Настоящие логотипы кладутся в public/teams/<slug>.svg (с теми же именами) и
// подхватываются автоматически. Пока там — графические плейсхолдеры-эмблемы.
export interface Team {
  slug: string;
  name: string;
  color: string;
}

export const TEAMS: Record<string, Team> = {
  redbull: { slug: "redbull", name: "Red Bull", color: "#3671C6" },
  mclaren: { slug: "mclaren", name: "McLaren", color: "#FF8000" },
  ferrari: { slug: "ferrari", name: "Ferrari", color: "#E8002D" },
  mercedes: { slug: "mercedes", name: "Mercedes", color: "#27F4D2" },
  astonmartin: { slug: "astonmartin", name: "Aston Martin", color: "#229971" },
  williams: { slug: "williams", name: "Williams", color: "#64C4FF" },
  rb: { slug: "rb", name: "Racing Bulls", color: "#6692FF" },
  haas: { slug: "haas", name: "Haas", color: "#B6BABD" },
  sauber: { slug: "sauber", name: "Kick Sauber", color: "#52E252" },
  alpine: { slug: "alpine", name: "Alpine", color: "#0093CC" },
  audi: { slug: "audi", name: "Audi", color: "#C8102E" },
  cadillac: { slug: "cadillac", name: "Cadillac", color: "#C9A24B" },
};
