import type { MetadataRoute } from "next";
import {
  getCircuits,
  getConstructorStandings,
  getDriverStandings,
  getSchedule,
  type CircuitListItemOut,
  type ConstructorStandingOut,
  type DriverStandingOut,
  type MeetingOut,
} from "@/lib/api";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const url = (p: string) => `${SITE_URL}${p}`;

  const staticRoutes: MetadataRoute.Sitemap = [
    "", "/schedule", "/standings", "/tracks", "/live", "/glossary", "/compare",
  ].map((p) => ({ url: url(p), lastModified: now }));

  const [schedule, drivers, cons, circuits] = await Promise.all([
    getSchedule().catch(() => [] as MeetingOut[]),
    getDriverStandings().catch(() => [] as DriverStandingOut[]),
    getConstructorStandings().catch(() => [] as ConstructorStandingOut[]),
    getCircuits().catch(() => [] as CircuitListItemOut[]),
  ]);

  const dynamic: MetadataRoute.Sitemap = [
    ...schedule.map((m) => ({ url: url(`/schedule/${m.round}`), lastModified: now })),
    ...drivers.map((d) => ({ url: url(`/drivers/${d.driver_id}`), lastModified: now })),
    ...cons.filter((c) => c.team_slug).map((c) => ({ url: url(`/teams/${c.team_slug}`), lastModified: now })),
    ...circuits.map((c) => ({ url: url(`/tracks/${c.key}`), lastModified: now })),
  ];

  return [...staticRoutes, ...dynamic];
}
