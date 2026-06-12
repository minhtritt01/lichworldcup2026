#!/usr/bin/env npx tsx
/**
 * Match details generator — lineups (pre-match) + incidents (post-match)
 *
 * PRE-MATCH — generates projected lineups, incidents stay empty:
 *   npx tsx scripts/generate-match-details.ts wc26_001
 *   npx tsx scripts/generate-match-details.ts --all [--skip-existing]
 *
 * POST-MATCH — generates real incidents from scraped result:
 *   npx tsx scripts/generate-match-details.ts wc26_001 --post
 *
 *   Requires content/scraped/wc26_001-post.json from fotmob.ts first:
 *   npx tsx scripts/fotmob.ts <event_id> wc26_001
 *
 * Writes: content/match-details/<match_id>.json
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { MOCK_MATCHES } from '../src/lib/mock-data';
import { TEAMS_DATA } from '../src/lib/teams-data';
import type { MatchIncident, PlayerPosition, TeamLineup, LiveMatchDetails } from '../src/lib/live-match-details';
import type { MatchPostData, MatchEvent } from './fotmob';

// ─── Claude call (used only for post-match incidents) ─────

function runClaude(prompt: string): string {
  const result = spawnSync('claude', ['--print', '--model', 'haiku'], {
    input: prompt,
    encoding: 'utf8',
    shell: '/bin/zsh',
    maxBuffer: 1024 * 1024 * 5,
    timeout: 120_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || 'claude exited non-zero');
  return (result.stdout as string).trim();
}

function extractJson<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  const start = cleaned.search(/[{[]/);
  if (start === -1) throw new Error('No JSON found in Claude response');
  return JSON.parse(cleaned.slice(start)) as T;
}

// ─── Pitch position templates ─────────────────────────────

type PitchSlot = { role: string; x: number; y: number };

const PITCH_433: PitchSlot[] = [
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
];

const PITCH_442: PitchSlot[] = [
  { role: 'GK', x: 50, y: 88 },
  { role: 'RB', x: 14, y: 72 },
  { role: 'CB', x: 36, y: 70 },
  { role: 'CB', x: 64, y: 70 },
  { role: 'LB', x: 86, y: 72 },
  { role: 'RM', x: 14, y: 48 },
  { role: 'CM', x: 36, y: 44 },
  { role: 'CM', x: 64, y: 44 },
  { role: 'LM', x: 86, y: 48 },
  { role: 'ST', x: 36, y: 20 },
  { role: 'ST', x: 64, y: 20 },
];

const PITCH_4231: PitchSlot[] = [
  { role: 'GK', x: 50, y: 88 },
  { role: 'RB', x: 14, y: 72 },
  { role: 'CB', x: 36, y: 70 },
  { role: 'CB', x: 64, y: 70 },
  { role: 'LB', x: 86, y: 72 },
  { role: 'DM', x: 36, y: 54 },
  { role: 'DM', x: 64, y: 54 },
  { role: 'RW', x: 20, y: 36 },
  { role: 'CAM', x: 50, y: 32 },
  { role: 'LW', x: 80, y: 36 },
  { role: 'ST', x: 50, y: 16 },
];

function getTemplate(formation: string): PitchSlot[] {
  if (formation.startsWith('4-4')) return PITCH_442;
  if (formation === '4-2-3-1') return PITCH_4231;
  return PITCH_433;
}

// ─── TEAMS_DATA lineup builder ────────────────────────────

function toSlug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const TEAM_NAME_ALIASES: Record<string, string> = {
  'bosnia & herzegovina': 'bosnia-and-herzegovina',
  'bosnia and herzegovina': 'bosnia-and-herzegovina',
  'usa': 'my',
  'south korea': 'han-quoc',
  'czechia': 'sec',
  "côte d'ivoire": 'cote-d-ivoire',
  'turkey': 'tho-nhi-ky',
  'türkiye': 'tho-nhi-ky',
};

function findTeamSlug(name: string): string {
  const lower = name.toLowerCase();
  return TEAM_NAME_ALIASES[lower] ?? toSlug(name);
}

function buildLineupFromData(
  teamSlug: string,
  teamName: string,
  accent: string,
  mirrored: boolean
): TeamLineup {
  const team = TEAMS_DATA.find(t => t.slug === teamSlug)
    ?? TEAMS_DATA.find(t => t.slug === findTeamSlug(teamName));

  let formation = '4-3-3';
  let players: PlayerPosition[] = [];

  if (team?.players?.length) {
    const gks  = team.players.filter(p => p.pos === 'GK');
    const defs = team.players.filter(p => p.pos === 'DF');
    const mids = team.players.filter(p => p.pos === 'MF');
    const fwds = team.players.filter(p => p.pos === 'FW');

    const xi = [
      ...(gks.slice(0, 1)),
      ...defs.slice(0, 4),
      ...mids.slice(0, 3),
      ...fwds.slice(0, 3),
    ].slice(0, 11);

    const defCount = Math.min(defs.length, 4);
    const midCount = Math.min(mids.length, 3);
    const fwdCount = Math.min(fwds.length, 3);
    if (defCount === 4 && midCount === 4 && fwdCount === 2) formation = '4-4-2';
    else if (defCount === 4 && midCount === 2 && fwdCount === 3) formation = '4-2-3-1';
    else formation = '4-3-3';

    const template = getTemplate(formation);
    players = xi.map((p, i) => {
      const slot = template[i] ?? template[template.length - 1];
      return {
        name: p.name,
        number: p.no,
        role: slot.role,
        x: slot.x,
        y: mirrored ? 100 - slot.y : slot.y,
        teamSlug,
        captain: !!p.captain,
      };
    });
  }

  return { teamSlug, teamName, formation, accent, players };
}

// ─── Prompts ──────────────────────────────────────────────

interface AIIncident {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'sub';
  player: string;
  detail: string;
  team: 'home' | 'away';
}

function postIncidentsPrompt(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  stage: string,
  stadium: string,
  homeXI: string,
  awayXI: string
): string {
  return `You are a football data journalist. The World Cup 2026 match just finished:

${homeTeam} ${homeScore}–${awayScore} ${awayTeam}
${stage} | ${stadium}

Starting lineups:
${homeTeam}: ${homeXI}
${awayTeam}: ${awayXI}

Generate match incidents that are CONSISTENT with the final score (${homeTeam} scored exactly ${homeScore} goal${homeScore !== 1 ? 's' : ''}, ${awayTeam} scored exactly ${awayScore} goal${awayScore !== 1 ? 's' : ''}).

Return ONLY a valid JSON array, no markdown fences:
[
  {
    "minute": 23,
    "type": "goal",
    "player": "Player Name",
    "detail": "Vivid 1-2 sentence description of the incident.",
    "team": "home"
  }
]

Rules:
- goal count must match the score exactly
- 5–8 incidents total (goals + yellows + subs, optionally a red)
- minutes 1–90 sorted ascending, no duplicates
- only use players from the lineups above
- detail should be specific: technique, body part, distance, assist, context`;
}

// ─── Pre-match: lineups only ──────────────────────────────

async function generateLineups(matchId: string, outDir: string): Promise<void> {
  const m = MOCK_MATCHES.find(x => x.match_id === matchId);
  if (!m) throw new Error(`Match not found: ${matchId}`);

  console.log(`\n⚽ ${m.home_team} vs ${m.away_team} (${matchId})`);

  const homeLineup = buildLineupFromData(m.home_slug, m.home_team, '#ef4444', true);
  const awayLineup = buildLineupFromData(m.away_slug, m.away_team, '#2563eb', false);

  console.log(`   ✅ ${m.home_team}: ${homeLineup.formation} (${homeLineup.players.length} players)`);
  console.log(`   ✅ ${m.away_team}: ${awayLineup.formation} (${awayLineup.players.length} players)`);

  // incidents intentionally empty — will be filled by --post after match
  const details: LiveMatchDetails = { incidents: [], homeLineup, awayLineup };

  const outPath = join(outDir, `${matchId}.json`);
  writeFileSync(outPath, JSON.stringify(details, null, 2), 'utf-8');
  console.log(`   💾 Saved → content/match-details/${matchId}.json`);
}

// ─── Map real TSDB events → MatchIncident ────────────────

function mapRealEvents(
  events: import('./fotmob').MatchEvent[],
  homeTeam: string,
  homeSlug: string,
  awaySlug: string,
): MatchIncident[] {
  return events.map(e => ({
    minute: e.minute,
    type: e.type,
    player: e.player,
    detail: e.type === 'sub' && e.player2 ? `${e.player} replaced by ${e.player2}` : '',
    teamSlug: e.team.toLowerCase().includes(homeTeam.toLowerCase()) ? homeSlug : awaySlug,
  }));
}

// ─── Post-match: generate incidents from scraped result ───

async function generateIncidents(matchId: string, outDir: string): Promise<void> {
  const m = MOCK_MATCHES.find(x => x.match_id === matchId);
  if (!m) throw new Error(`Match not found: ${matchId}`);

  // Load scraped post-match data (from fotmob.ts)
  const scrapedPath = join(process.cwd(), 'content', 'scraped', `${matchId}-post.json`);
  if (!existsSync(scrapedPath)) {
    throw new Error(
      `No scraped data found at ${scrapedPath}\n` +
      `   Run first: npx tsx scripts/fotmob.ts <event_id> ${matchId}`
    );
  }
  const scraped = JSON.parse(readFileSync(scrapedPath, 'utf-8')) as MatchPostData;
  const { score, squads } = scraped;

  console.log(`\n⚽ ${m.home_team} ${score.home}–${score.away} ${m.away_team} (${matchId})`);

  // Load existing JSON to preserve lineups (or use empty lineups as fallback)
  const detailsPath = join(outDir, `${matchId}.json`);
  const existing: LiveMatchDetails = existsSync(detailsPath)
    ? JSON.parse(readFileSync(detailsPath, 'utf-8'))
    : { incidents: [], homeLineup: { teamSlug: m.home_slug, teamName: m.home_team, formation: '4-3-3', accent: '#ef4444', players: [] }, awayLineup: { teamSlug: m.away_slug, teamName: m.away_team, formation: '4-3-3', accent: '#2563eb', players: [] } };

  let incidents: MatchIncident[];

  if (scraped.events?.length) {
    // Use real events from TheSportsDB timeline
    console.log(`   ✅ Using ${scraped.events.length} real events from TSDB timeline`);
    incidents = mapRealEvents(scraped.events, m.home_team, m.home_slug, m.away_slug);
  } else {
    // Fall back to AI generation when TSDB returned no timeline data
    const homeXI = existing.homeLineup.players.length
      ? existing.homeLineup.players.map(p => p.name).join(', ')
      : squads.home.slice(0, 11).map(p => p.name).join(', ');
    const awayXI = existing.awayLineup.players.length
      ? existing.awayLineup.players.map(p => p.name).join(', ')
      : squads.away.slice(0, 11).map(p => p.name).join(', ');

    process.stdout.write(`   🤖 No TSDB timeline — generating incidents via AI (score: ${score.home}–${score.away})...`);
    const aiIncidents = extractJson<AIIncident[]>(
      runClaude(postIncidentsPrompt(
        m.home_team, m.away_team,
        score.home, score.away,
        m.stage, m.stadium,
        homeXI, awayXI
      ))
    );

    const homeGoals = aiIncidents.filter(i => i.type === 'goal' && i.team === 'home').length;
    const awayGoals = aiIncidents.filter(i => i.type === 'goal' && i.team === 'away').length;
    if (homeGoals !== score.home || awayGoals !== score.away) {
      console.log(` ⚠️  goal mismatch (got ${homeGoals}–${awayGoals}, expected ${score.home}–${score.away}), retrying...`);
      const retry = extractJson<AIIncident[]>(
        runClaude(postIncidentsPrompt(
          m.home_team, m.away_team,
          score.home, score.away,
          m.stage, m.stadium,
          homeXI, awayXI
        ))
      );
      aiIncidents.splice(0, aiIncidents.length, ...retry);
    }

    console.log(` ✅  ${aiIncidents.length} events`);

    incidents = aiIncidents
      .sort((a, b) => a.minute - b.minute)
      .map(inc => ({
        minute: inc.minute,
        type: inc.type,
        player: inc.player,
        detail: inc.detail,
        teamSlug: inc.team === 'home' ? m.home_slug : m.away_slug,
      }));
  }

  const updated: LiveMatchDetails = { ...existing, incidents };
  writeFileSync(detailsPath, JSON.stringify(updated, null, 2), 'utf-8');
  console.log(`   💾 Saved → content/match-details/${matchId}.json`);
}

// ─── Main ─────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isPost = args.includes('--post');
  const all = args.includes('--all');
  const skipExisting = args.includes('--skip-existing');
  const matchIds = all
    ? MOCK_MATCHES.map(m => m.match_id)
    : args.filter(a => !a.startsWith('--'));

  if (!matchIds.length) {
    console.error('Usage:');
    console.error('  Pre-match (lineups):  npx tsx scripts/generate-match-details.ts <match_id> [--skip-existing]');
    console.error('  Pre-match (all):      npx tsx scripts/generate-match-details.ts --all [--skip-existing]');
    console.error('  Post-match (incidents): npx tsx scripts/generate-match-details.ts <match_id> --post');
    process.exit(1);
  }

  const outDir = join(process.cwd(), 'content', 'match-details');
  mkdirSync(outDir, { recursive: true });

  let done = 0;
  let skipped = 0;

  for (const matchId of matchIds) {
    const outPath = join(outDir, `${matchId}.json`);
    if (!isPost && skipExisting && existsSync(outPath)) {
      console.log(`⏭  Skipping ${matchId} (already exists)`);
      skipped++;
      continue;
    }
    try {
      if (isPost) {
        await generateIncidents(matchId, outDir);
      } else {
        await generateLineups(matchId, outDir);
      }
      done++;
    } catch (err) {
      console.error(`\n❌ ${matchId}: ${(err as Error).message}`);
    }
  }

  console.log(`\n✅ Done: ${done} generated, ${skipped} skipped`);
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});
