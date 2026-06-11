import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { MockMatch } from './mock-data';
import { getTeamName } from './team-names';

export type IncidentType = 'goal' | 'yellow' | 'red' | 'sub';

export interface MatchIncident {
  minute: number;
  type: IncidentType;
  player: string;
  detail?: string;
  teamSlug: string;
}

export interface PlayerPosition {
  name: string;
  number: number;
  x: number;
  y: number;
  role: string;
  teamSlug: string;
}

export interface TeamLineup {
  teamSlug: string;
  teamName: string;
  formation: string;
  accent: string;
  players: PlayerPosition[];
}

export interface LiveMatchDetails {
  incidents: MatchIncident[];
  homeLineup: TeamLineup;
  awayLineup: TeamLineup;
}

const PITCH_TEMPLATE = [
  { role: 'GK', x: 50, y: 88 },
  { role: 'RB', x: 14, y: 72 },
  { role: 'CB', x: 36, y: 70 },
  { role: 'CB', x: 64, y: 70 },
  { role: 'LB', x: 86, y: 72 },
  { role: 'DM', x: 22, y: 52 },
  { role: 'CM', x: 50, y: 44 },
  { role: 'CM', x: 78, y: 52 },
  { role: 'RW', x: 18, y: 24 },
  { role: 'ST', x: 50, y: 16 },
  { role: 'LW', x: 82, y: 24 },
] as const;

function buildLineup(
  match: MockMatch,
  side: 'home' | 'away',
  accent: string,
  locale: 'vi' | 'en'
): TeamLineup {
  const teamSlug = side === 'home' ? match.home_slug : match.away_slug;
  const teamName = getTeamName(teamSlug, locale);
  const mirrored = side === 'home';

  return {
    teamSlug,
    teamName,
    formation: '4-3-3',
    accent,
    players: PITCH_TEMPLATE.map((slot, index) => ({
      name: `${teamName} ${slot.role}`,
      number: index + 1,
      role: slot.role,
      teamSlug,
      x: slot.x,
      y: mirrored ? 100 - slot.y : slot.y,
    })),
  };
}

export function loadMatchDetails(match: MockMatch, locale: 'vi' | 'en' = 'en'): LiveMatchDetails {
  const detailsPath = join(process.cwd(), 'content', 'match-details', `${match.match_id}.json`);
  if (existsSync(detailsPath)) {
    const raw = JSON.parse(readFileSync(detailsPath, 'utf-8')) as LiveMatchDetails;
    // Patch teamName with locale-aware name so VI/EN renders correctly
    return {
      ...raw,
      homeLineup: { ...raw.homeLineup, teamName: getTeamName(match.home_slug, locale) },
      awayLineup: { ...raw.awayLineup, teamName: getTeamName(match.away_slug, locale) },
    };
  }
  return buildLiveMatchDetails(match, locale);
}

export function buildLiveMatchDetails(match: MockMatch, locale: 'vi' | 'en' = 'en'): LiveMatchDetails {
  const homeLineup = buildLineup(match, 'home', '#ef4444', locale);
  const awayLineup = buildLineup(match, 'away', '#2563eb', locale);
  const incidents: MatchIncident[] = [];

  return {
    incidents,
    homeLineup,
    awayLineup,
  };
}
