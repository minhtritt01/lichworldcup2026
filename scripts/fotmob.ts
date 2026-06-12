#!/usr/bin/env npx tsx
/**
 * Step 1: Match data fetcher
 * Usage: npx tsx scripts/fotmob.ts <tsdb_event_id> <our_match_id>
 * Example: npx tsx scripts/fotmob.ts 2391728 wc26_001
 *
 * Data sources:
 *   - TheSportsDB (free, no key): match overview, score, venue, referee, timeline
 *   - Local TEAMS_DATA: squad/player info
 *
 * Output:
 *   content/scraped/<match_id>-pre.json   (match not yet started)
 *   content/scraped/<match_id>-post.json  (match finished — includes real events)
 *
 * Find TSDB event IDs:
 *   npx tsx scripts/fotmob.ts --list [YYYY-MM-DD]
 *
 * ── Full post-match workflow ──────────────────────────────────────────────────
 *
 *   # 1. Find the TSDB event ID for today's matches
 *   npx tsx scripts/fotmob.ts --list
 *
 *   # 2. Fetch real match data (score + timeline events)
 *   npx tsx scripts/fotmob.ts <tsdb_event_id> wc26_001
 *
 *   # 3. Generate match-details JSON (uses real events; AI fallback if TSDB has none)
 *   npx tsx scripts/generate-match-details.ts wc26_001 --post
 *
 *   Output: content/match-details/wc26_001.json
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { TEAMS_DATA } from '../src/lib/teams-data';

const TSDB = 'https://www.thesportsdb.com/api/v1/json/3';

// ─── Types ───────────────────────────────────────────────

export interface MatchPreData {
  matchId: string;
  eventId: string;
  status: 'upcoming' | 'live';
  scrapedAt: string;
  general: {
    homeTeam: string;
    homeSlug: string;
    awayTeam: string;
    awaySlug: string;
    stage: string;
    group: string;
    kickoffUTC: string;
    venue: string;
    referee: string;
  };
  form: {
    home: FormEntry[];
    away: FormEntry[];
  };
  squads: {
    home: PlayerInfo[];
    away: PlayerInfo[];
  };
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'sub';
  player: string;
  player2?: string;
  team: string;
}

export interface MatchPostData {
  matchId: string;
  eventId: string;
  status: 'finished';
  scrapedAt: string;
  general: {
    homeTeam: string;
    homeSlug: string;
    awayTeam: string;
    awaySlug: string;
    stage: string;
    group: string;
    kickoffUTC: string;
    venue: string;
    referee: string;
  };
  score: { home: number; away: number };
  events: MatchEvent[];
  form: {
    home: FormEntry[];
    away: FormEntry[];
  };
  squads: {
    home: PlayerInfo[];
    away: PlayerInfo[];
  };
}

interface FormEntry {
  opponent: string;
  result: 'W' | 'D' | 'L';
  score: string;
  date: string;
}

interface PlayerInfo {
  name: string;
  number: number;
  position: string;
  age?: number;
}

// ─── TheSportsDB fetch helpers ────────────────────────────

async function tsdbGet<T>(path: string): Promise<T> {
  const url = `${TSDB}${path}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`TSDB ${res.status}: ${url}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) throw new Error(`TSDB returned non-JSON for ${url}`);
  return res.json() as Promise<T>;
}

interface TsdbEvent {
  idEvent: string;
  idAPIfootball?: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  idHomeTeam: string;
  idAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;   // 'NS' | 'FT' | 'HT' | '1H' | '2H'
  dateEvent: string;
  strTime: string;
  strTimestamp?: string;
  strVenue: string;
  strOfficial: string;
  strGroup: string;
  strSeason: string;
  intRound?: string;
  strLeague: string;
}

interface TsdbResult {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string;
  intAwayScore: string;
  strResult?: string;
  dateEvent: string;
  idHomeTeam: string;
  idAwayTeam: string;
}

async function fetchEvent(eventId: string): Promise<TsdbEvent> {
  const data = await tsdbGet<{ events: TsdbEvent[] }>(`/lookupevent.php?id=${eventId}`);
  const event = data.events?.[0];
  if (!event) throw new Error(`Event ${eventId} not found on TheSportsDB`);
  return event;
}

async function fetchTeamForm(teamId: string, teamName: string): Promise<FormEntry[]> {
  try {
    const data = await tsdbGet<{ results: TsdbResult[] }>(`/eventslast.php?id=${teamId}`);
    const results = data.results || [];
    return results.slice(0, 5).map(r => {
      const isHome = r.idHomeTeam === teamId || r.strHomeTeam === teamName;
      const scored = Number(isHome ? r.intHomeScore : r.intAwayScore);
      const conceded = Number(isHome ? r.intAwayScore : r.intHomeScore);
      const opponent = isHome ? r.strAwayTeam : r.strHomeTeam;
      let result: 'W' | 'D' | 'L';
      if (scored > conceded) result = 'W';
      else if (scored === conceded) result = 'D';
      else result = 'L';
      return {
        opponent,
        result,
        score: `${scored}-${conceded}`,
        date: r.dateEvent,
      };
    });
  } catch {
    return [];
  }
}

// ─── Local TEAMS_DATA lookup ──────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// TheSportsDB uses different names for some teams — map to our nameEn
const TEAM_NAME_ALIASES: Record<string, string> = {
  'czech republic': 'czechia',
  'korea republic': 'south korea',
  'republic of korea': 'south korea',
  'ivory coast': "côte d'ivoire",
  "cote d'ivoire": "côte d'ivoire",
  'cape verde islands': 'cape verde',
  'dr congo': 'democratic republic of congo',
  'united states': 'usa',
  'trinidad & tobago': 'trinidad and tobago',
  'bosnia-herzegovina': 'bosnia and herzegovina',
  'bosnia & herzegovina': 'bosnia and herzegovina',
};

function findTeamByName(teamName: string): typeof TEAMS_DATA[0] | undefined {
  const lower = teamName.toLowerCase();
  const resolved = TEAM_NAME_ALIASES[lower] ?? lower;
  const slug = toSlug(resolved);
  return (
    TEAMS_DATA.find(t => t.slug === slug) ||
    TEAMS_DATA.find(t => t.nameEn.toLowerCase() === resolved) ||
    TEAMS_DATA.find(t => t.nameEn.toLowerCase() === lower) ||
    TEAMS_DATA.find(t => t.slug.includes(slug.split('-')[0]))
  );
}

function buildSquad(teamName: string): PlayerInfo[] {
  const team = findTeamByName(teamName);
  if (!team?.players?.length) return [];

  return team.players.slice(0, 23).map((p, idx) => ({
    name: p.name,
    number: p.no ?? idx + 1,
    position: p.pos ?? '',
    age: p.age,
  }));
}

// ─── Match timeline (real events) ────────────────────────

interface TsdbTimelineEvent {
  idEvent: string;
  strTimeline: string;
  strTimelineExtra?: string;
  strComment: string;
  strPlayer: string;
  strPlayer2?: string;
  strTeam: string;
  intHomeScore?: string;
  intAwayScore?: string;
}

function parseEventType(comment: string): MatchEvent['type'] | null {
  const c = comment.toLowerCase();
  if (c.includes('goal')) return 'goal';
  if (c.includes('yellow')) return 'yellow';
  if (c.includes('red')) return 'red';
  if (c.includes('sub')) return 'sub';
  return null;
}

async function fetchMatchTimeline(eventId: string): Promise<MatchEvent[]> {
  try {
    const data = await tsdbGet<{ timeline: TsdbTimelineEvent[] | null }>(
      `/eventtimeline.php?id=${eventId}`
    );
    const raw = data.timeline ?? [];
    const events: MatchEvent[] = [];

    for (const e of raw) {
      const type = parseEventType(e.strComment);
      if (!type) continue;
      const base = parseInt(e.strTimeline ?? '0', 10) || 0;
      const extra = parseInt(e.strTimelineExtra ?? '0', 10) || 0;
      const minute = base + extra;
      if (!minute || !e.strPlayer) continue;
      const ev: MatchEvent = { minute, type, player: e.strPlayer, team: e.strTeam };
      if (type === 'sub' && e.strPlayer2) ev.player2 = e.strPlayer2;
      events.push(ev);
    }

    return events.sort((a, b) => a.minute - b.minute);
  } catch {
    return [];
  }
}

// ─── Status detection ─────────────────────────────────────

type MatchStatus = 'upcoming' | 'live' | 'finished';

function detectStatus(event: TsdbEvent): MatchStatus {
  const s = (event.strStatus ?? '').toUpperCase();
  if (s === 'FT' || s === 'AET' || s === 'PEN' || s === 'FINISHED') return 'finished';
  if (s === 'HT' || s === '1H' || s === '2H' || s === 'LIVE') return 'live';
  return 'upcoming';
}

// ─── List today's WC matches ──────────────────────────────

// TSDB league ID 4429 = FIFA World Cup
const WC_LEAGUE_ID = '4429';

function isWorldCupEvent(e: TsdbEvent): boolean {
  const league = (e.strLeague ?? '').toLowerCase();
  return (
    league.includes('world cup') ||
    league.includes('fifa wc') ||
    (e as unknown as Record<string, string>).idLeague === WC_LEAGUE_ID
  );
}

async function listMatches(dateStr?: string, showAll = false): Promise<void> {
  const date = dateStr ?? new Date().toISOString().slice(0, 10);

  // Strategy 1: fetch by league ID directly (most reliable)
  let events: TsdbEvent[] = [];
  try {
    const leagueData = await tsdbGet<{ events: TsdbEvent[] | null }>(
      `/eventsseason.php?id=${WC_LEAGUE_ID}&s=2026-2027`
    );
    const leagueEvents = (leagueData.events ?? []).filter(e => e.dateEvent === date);
    events = leagueEvents;
  } catch { /* fall through to strategy 2 */ }

  // Strategy 2: eventsday.php fallback
  if (!events.length) {
    try {
      const dayData = await tsdbGet<{ events: TsdbEvent[] | null }>(
        `/eventsday.php?d=${date}&s=Soccer`
      );
      const all = dayData.events ?? [];
      events = showAll ? all : all.filter(isWorldCupEvent);

      if (showAll && !events.length) {
        console.log(`\n📅 All soccer matches on ${date} (--all mode):\n`);
      } else if (!events.length && !showAll) {
        // Show all leagues found so user can debug
        const leagues = [...new Set(all.map(e => e.strLeague))].sort();
        console.log(`\n📅 World Cup 2026 matches on ${date}:\n`);
        console.log('  No World Cup matches found. Leagues returned by TSDB today:');
        leagues.forEach(l => console.log(`    · ${l}`));
        console.log('\n  Tip: run --list-all to see all soccer events for this date.');
        return;
      }
    } catch (err) {
      console.error(`  TSDB error: ${(err as Error).message}`);
      return;
    }
  }

  console.log(`\n📅 ${showAll ? 'All soccer' : 'World Cup 2026'} matches on ${date}:\n`);

  events.forEach(e => {
    const status = detectStatus(e);
    const score = e.intHomeScore !== null && e.intAwayScore !== null
      ? `${e.intHomeScore}–${e.intAwayScore}`
      : e.strTime;
    console.log(`  ${e.idEvent}  ${e.strHomeTeam} vs ${e.strAwayTeam}  ${score}  [${status}]`);
    console.log(`             ${e.strVenue} · ${e.strGroup || e.strLeague}`);
    console.log('');
  });

  console.log(`Usage: npx tsx scripts/fotmob.ts <idEvent> <our_match_id>`);
}

// ─── Main ─────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args[0] === '--list') {
    await listMatches(args[1]);
    return;
  }
  if (args[0] === '--list-all') {
    await listMatches(args[1], true);
    return;
  }

  const [eventId, matchId] = args;
  if (!eventId || !matchId) {
    console.error('Usage:');
    console.error('  npx tsx scripts/fotmob.ts <tsdb_event_id> <our_match_id>');
    console.error('  npx tsx scripts/fotmob.ts --list [YYYY-MM-DD]');
    process.exit(1);
  }

  console.log(`\n📡 Fetching event ${eventId} from TheSportsDB...`);
  const event = await fetchEvent(eventId);
  const status = detectStatus(event);

  console.log(`  ${event.strHomeTeam} vs ${event.strAwayTeam}`);
  console.log(`  ${event.strVenue} · ${event.strGroup || event.strLeague}`);
  console.log(`  Status: ${status}`);

  const kickoffUTC = event.strTimestamp ?? `${event.dateEvent}T${event.strTime}Z`;

  // Fetch form + timeline in parallel
  console.log('\n📊 Fetching team form and match timeline...');
  const [homeForm, awayForm, events] = await Promise.all([
    fetchTeamForm(event.idHomeTeam, event.strHomeTeam),
    fetchTeamForm(event.idAwayTeam, event.strAwayTeam),
    status === 'finished' ? fetchMatchTimeline(eventId) : Promise.resolve([]),
  ]);
  console.log(`  ${event.strHomeTeam}: ${homeForm.map(f => f.result).join('') || '(no data)'}`);
  console.log(`  ${event.strAwayTeam}: ${awayForm.map(f => f.result).join('') || '(no data)'}`);
  if (events.length) console.log(`  Timeline: ${events.length} events (goals/cards/subs)`);
  else if (status === 'finished') console.log(`  Timeline: no events returned from TSDB (AI fallback will be used)`);

  // Build squads from local TEAMS_DATA
  console.log('\n👥 Building squads from local data...');
  const homeSquad = buildSquad(event.strHomeTeam);
  const awaySquad = buildSquad(event.strAwayTeam);
  console.log(`  ${event.strHomeTeam}: ${homeSquad.length} players`);
  console.log(`  ${event.strAwayTeam}: ${awaySquad.length} players`);

  const homeSlug = findTeamByName(event.strHomeTeam)?.slug ?? toSlug(event.strHomeTeam);
  const awaySlug = findTeamByName(event.strAwayTeam)?.slug ?? toSlug(event.strAwayTeam);

  const general = {
    homeTeam: event.strHomeTeam,
    homeSlug,
    awayTeam: event.strAwayTeam,
    awaySlug,
    stage: event.strLeague,
    group: event.strGroup ?? '',
    kickoffUTC,
    venue: event.strVenue,
    referee: event.strOfficial ?? '',
  };

  const formData = { home: homeForm, away: awayForm };
  const squads = { home: homeSquad, away: awaySquad };

  const outDir = join(process.cwd(), 'content', 'scraped');
  mkdirSync(outDir, { recursive: true });

  let outPath: string;

  if (status === 'finished') {
    const data: MatchPostData = {
      matchId,
      eventId,
      status: 'finished',
      scrapedAt: new Date().toISOString(),
      general,
      score: {
        home: Number(event.intHomeScore ?? 0),
        away: Number(event.intAwayScore ?? 0),
      },
      events,
      form: formData,
      squads,
    };
    outPath = join(outDir, `${matchId}-post.json`);
    writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`\n  Final score: ${data.score.home}–${data.score.away}`);
  } else {
    const data: MatchPreData = {
      matchId,
      eventId,
      status: status as 'upcoming' | 'live',
      scrapedAt: new Date().toISOString(),
      general,
      form: formData,
      squads,
    };
    outPath = join(outDir, `${matchId}-pre.json`);
    writeFileSync(outPath, JSON.stringify(data, null, 2));
  }

  console.log(`\n✅ Saved: ${outPath}`);
  console.log(`\nNext step:`);
  console.log(`  npx tsx scripts/generate-report.ts ${matchId}`);
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});
