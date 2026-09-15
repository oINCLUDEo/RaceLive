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

export interface LiveOut {
  live: boolean;
  round: number | null;
  meeting_name_ru: string | null;
  meeting_name_en: string | null;
  session: SessionOut | null;
}

export function getLive(): Promise<LiveOut> {
  return getJSON<LiveOut>(`/api/v1/live`, 30);
}

export interface DriverStandingOut {
  position: number;
  points: number;
  wins: number;
  code: string;
  driver_id: string;
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

export interface TeamDriverOut {
  code: string;
  driver_id: string;
  name_ru: string | null;
  name_en: string;
  points: number;
}

export interface TeamRoundEntryOut {
  code: string;
  driver_id: string;
  name_ru: string | null;
  name_en: string;
  position: number;
  status: string;
  points: number;
}

export interface TeamRoundOut {
  round: number;
  name_ru: string | null;
  name_en: string;
  team_points: number;
  entries: TeamRoundEntryOut[];
}

export interface TeamH2HOut {
  a_id: string;
  a_name: string;
  b_id: string;
  b_name: string;
  a_ahead: number;
  b_ahead: number;
}

export interface TeamProfileOut {
  slug: string;
  name: string;
  nationality: string | null;
  position: number | null;
  points: number | null;
  wins: number | null;
  drivers: TeamDriverOut[];
  rounds: TeamRoundOut[];
  h2h: TeamH2HOut | null;
}

export function getTeam(slug: string): Promise<TeamProfileOut> {
  return getJSON<TeamProfileOut>(`/api/v1/teams/${slug}`, 1800);
}

export interface RaceResultOut {
  position: number;
  points: number;
  grid: number;
  status: string;
  time: string | null;
  code: string;
  driver_id: string;
  name_ru: string | null;
  name_en: string;
  team_slug: string | null;
  team_name: string;
}

export function getRaceResults(round: number | string): Promise<RaceResultOut[]> {
  return getJSON<RaceResultOut[]>(`/api/v1/results/${round}`, 1800);
}

export interface QualifyingResultOut {
  position: number;
  code: string;
  driver_id: string;
  name_ru: string | null;
  name_en: string;
  team_slug: string | null;
  team_name: string;
  q1: string | null;
  q2: string | null;
  q3: string | null;
}

export function getQualifyingResults(
  round: number | string,
): Promise<QualifyingResultOut[]> {
  return getJSON<QualifyingResultOut[]>(`/api/v1/qualifying/${round}`, 1800);
}

export interface DriverSeasonResultOut {
  round: number;
  name_ru: string | null;
  name_en: string;
  position: number;
  points: number;
  status: string;
}

export interface DriverProfileOut {
  driver_id: string;
  code: string;
  name_ru: string | null;
  name_en: string;
  number: string | null;
  nationality: string | null;
  dob: string | null;
  team_slug: string | null;
  team_name: string | null;
  position: number | null;
  points: number | null;
  wins: number | null;
  results: DriverSeasonResultOut[];
}

export function getDriverProfile(id: string): Promise<DriverProfileOut> {
  return getJSON<DriverProfileOut>(`/api/v1/drivers/${id}`, 1800);
}

export interface CircuitListItemOut {
  key: string;
  name_ru: string | null;
  name_en: string;
  country: string | null;
  country_code: string | null;
  round: number | null;
}

export interface CircuitPageOut {
  key: string;
  name_ru: string | null;
  name_en: string;
  country: string | null;
  country_code: string | null;
  length_m: number | null;
  opened: number | null;
  first_gp: number | null;
  locality: string | null;
  round: number | null;
  meeting_starts_at: string | null;
  meeting_name_ru: string | null;
  meeting_name_en: string | null;
  winner_name_ru: string | null;
  winner_name_en: string | null;
  winner_team_slug: string | null;
}

export function getCircuits(): Promise<CircuitListItemOut[]> {
  return getJSON<CircuitListItemOut[]>(`/api/v1/circuits`, 1800);
}

export function getCircuit(key: string): Promise<CircuitPageOut> {
  return getJSON<CircuitPageOut>(`/api/v1/circuits/${key}`, 1800);
}

export interface CompareLap {
  lap: number;
  time: number;
}
export interface CompareDriver {
  num: number;
  code: string;
  name_ru: string;
  name_en: string;
  team: string | null;
  laps: CompareLap[];
}
export interface CompareOut {
  session: string | null;
  session_key: number | null;
  drivers: CompareDriver[];
}

export function getCompare(session?: number): Promise<CompareOut> {
  const q = session ? `?session=${session}` : "";
  return getJSON<CompareOut>(`/api/v1/compare${q}`, 3600);
}
