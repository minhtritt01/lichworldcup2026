// src/lib/standings.ts
// Server-only utility: computes live group standings (A–L) from finished group-stage
// matches stored in content/scraped/*-post.json. Reads the filesystem, so it must only
// be imported from server components.

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { MOCK_MATCHES } from './mock-data';
import { TEAMS_DATA } from './teams-data';
import { getTeamName } from './team-names';
import type { StandingRow } from './report-types';

interface Tally {
  slug: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}

function newTally(slug: string, flag: string): Tally {
  return { slug, flag, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
}

/**
 * Compute standings for every group, keyed by group letter ("A".."L").
 * Each group always lists all 4 teams (0 stats if no finished matches yet).
 */
export function computeAllStandings(locale: 'vi' | 'en'): Record<string, StandingRow[]> {
  // Group letters in display order, plus each group's 4 teams from team data.
  const groupOrder: string[] = [];
  const tallies: Record<string, Record<string, Tally>> = {};
  for (const team of TEAMS_DATA) {
    const g = team.group;
    if (!tallies[g]) {
      tallies[g] = {};
      groupOrder.push(g);
    }
    tallies[g][team.slug] = newTally(team.slug, team.flag);
  }
  groupOrder.sort();

  // Apply finished group-stage match results.
  const root = process.cwd();
  for (const m of MOCK_MATCHES) {
    if (!m.group) continue;
    const postPath = join(root, 'content', 'scraped', `${m.match_id}-post.json`);
    if (!existsSync(postPath)) continue;

    let post: { status?: string; score?: { home: number; away: number } };
    try {
      post = JSON.parse(readFileSync(postPath, 'utf-8'));
    } catch {
      continue;
    }
    if (post.status !== 'finished' || !post.score) continue;

    const groupTallies = tallies[m.group];
    const home = groupTallies?.[m.home_slug];
    const away = groupTallies?.[m.away_slug];
    if (!home || !away) continue;

    const hs = post.score.home;
    const as = post.score.away;

    home.played++; away.played++;
    home.gf += hs; home.ga += as;
    away.gf += as; away.ga += hs;

    if (hs > as) {
      home.won++; away.lost++; home.points += 3;
    } else if (hs < as) {
      away.won++; home.lost++; away.points += 3;
    } else {
      home.drawn++; away.drawn++; home.points += 1; away.points += 1;
    }
  }

  // Sort + map each group to StandingRow[].
  const result: Record<string, StandingRow[]> = {};
  for (const g of groupOrder) {
    const rows = Object.values(tallies[g]).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.gf - a.ga;
      const gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return getTeamName(a.slug, locale).localeCompare(getTeamName(b.slug, locale));
    });

    result[g] = rows.map((r, i) => ({
      pos: i + 1,
      team: getTeamName(r.slug, locale),
      flag: r.flag,
      slug: r.slug,
      played: r.played,
      won: r.won,
      drawn: r.drawn,
      lost: r.lost,
      gd: r.gf - r.ga,
      points: r.points,
      qualify: i < 2 ? 'direct' : i === 2 ? 'third' : undefined,
    }));
  }

  return result;
}
