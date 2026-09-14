// Серверный слой доступа к API. В RSC ходим по внутреннему URL docker-сети.
const BASE = process.env.API_INTERNAL_URL ?? "http://api:8000";

export interface SessionOut {
  type: string;
  name_ru: string | null;
  name_en: string;
  starts_at: string | null;
  status: string;
  is_final: boolean;
}

export interface CircuitOut {
  key: string;
  name_ru: string | null;
  name_en: string;
  country: string | null;
  country_code: string | null;
}

export interface MeetingOut {
  round: number;
  name_ru: string | null;
  name_en: string;
  starts_at: string | null;
  ends_at: string | null;
  circuit: CircuitOut | null;
  sessions: SessionOut[];
}

export interface NextSessionOut {
  round: number;
  meeting_name_ru: string | null;
  meeting_name_en: string;
  session: SessionOut;
}

async function getJSON<T>(path: string, revalidate = 300): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
  if (!res.ok) {
    throw new Error(`API ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getSchedule(season?: number): Promise<MeetingOut[]> {
  const q = season ? `?season=${season}` : "";
  return getJSON<MeetingOut[]>(`/api/v1/schedule${q}`);
}

export function getMeeting(round: number, season?: number): Promise<MeetingOut> {
  const q = season ? `?season=${season}` : "";
  return getJSON<MeetingOut>(`/api/v1/meetings/${round}${q}`);
}

export function getNextSession(): Promise<NextSessionOut | null> {
  return getJSON<NextSessionOut | null>(`/api/v1/next-session`, 60);
}

export interface DriverStandingOut {
  position: number;
  points: number;
  wins: number;
  code: string;
  name_ru: string | null;
  name_en: string;
  team_slug: string | null;
  team_name: string | null;
}

export function getDriverStandings(): Promise<DriverStandingOut[]> {
  return getJSON<DriverStandingOut[]>(`/api/v1/standings/drivers`, 1800);
}

export interface ConstructorStandingOut {
  position: number;
  points: number;
  wins: number;
  team_slug: string | null;
  team_name: string;
}

export function getConstructorStandings(): Promise<ConstructorStandingOut[]> {
  return getJSON<ConstructorStandingOut[]>(`/api/v1/standings/constructors`, 1800);
}

export interface RaceResultOut {
  position: number;
  points: number;
  grid: number;
  status: string;
  time: string | null;
  code: string;
  name_ru: string | null;
  name_en: string;
  team_slug: string | null;
  team_name: string;
}

export function getRaceResults(round: number | string): Promise<RaceResultOut[]> {
  return getJSON<RaceResultOut[]>(`/api/v1/results/${round}`, 1800);
}
