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
import type { MatchIncident, PlayerPosition, TeamLineup, LiveMatchDetails } from '../src/lib/live-match-details';
import type { MatchPostData } from './fotmob';

// ─── Claude call ──────────────────────────────────────────

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

// ─── Prompts ──────────────────────────────────────────────

interface AILineupPlayer { name: string; number: number; }
interface AILineupResponse { formation: string; players: AILineupPlayer[]; }
interface AIIncident {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'sub';
  player: string;
  detail: string;
  team: 'home' | 'away';
}

function lineupPrompt(teamName: string, opponent: string, stage: string): string {
  return `You are a football data expert. Generate the projected starting XI for ${teamName} vs ${opponent} at World Cup 2026 (${stage}).

Use real active players (2025-2026 season). Return ONLY valid JSON, no markdown fences.

{
  "formation": "4-3-3",
  "players": [
    { "name": "PlayerName", "number": 1 },
    ... 11 players in positional order: GK, RB, CB, CB, LB, DM, CM, CM, RW, ST, LW
  ]
}

Rules: exactly 11 players, formation one of "4-3-3"/"4-4-2"/"4-2-3-1", GK number is 1.`;
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

// ─── Builders ─────────────────────────────────────────────

function buildLineup(
  ai: AILineupResponse,
  teamSlug: string,
  teamName: string,
  accent: string,
  mirrored: boolean
): TeamLineup {
  const template = getTemplate(ai.formation);
  const players: PlayerPosition[] = ai.players.slice(0, 11).map((p, i) => {
    const slot = template[i] ?? template[template.length - 1];
    return {
      name: p.name,
      number: p.number,
      role: slot.role,
      x: slot.x,
      y: mirrored ? 100 - slot.y : slot.y,
      teamSlug,
    };
  });
  return { teamSlug, teamName, formation: ai.formation, accent, players };
}

// ─── Pre-match: lineups only ──────────────────────────────

async function generateLineups(matchId: string, outDir: string): Promise<void> {
  const m = MOCK_MATCHES.find(x => x.match_id === matchId);
  if (!m) throw new Error(`Match not found: ${matchId}`);

  console.log(`\n⚽ ${m.home_team} vs ${m.away_team} (${matchId})`);

  process.stdout.write(`   🤖 Home lineup (${m.home_team})...`);
  const homeAI = extractJson<AILineupResponse>(runClaude(lineupPrompt(m.home_team, m.away_team, m.stage)));
  console.log(` ✅  ${homeAI.formation}`);

  process.stdout.write(`   🤖 Away lineup (${m.away_team})...`);
  const awayAI = extractJson<AILineupResponse>(runClaude(lineupPrompt(m.away_team, m.home_team, m.stage)));
  console.log(` ✅  ${awayAI.formation}`);

  const homeLineup = buildLineup(homeAI, m.home_slug, m.home_team, '#ef4444', true);
  const awayLineup = buildLineup(awayAI, m.away_slug, m.away_team, '#2563eb', false);

  // incidents intentionally empty — will be filled by --post after match
  const details: LiveMatchDetails = { incidents: [], homeLineup, awayLineup };

  const outPath = join(outDir, `${matchId}.json`);
  writeFileSync(outPath, JSON.stringify(details, null, 2), 'utf-8');
  console.log(`   💾 Saved → content/match-details/${matchId}.json`);
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

  // Use lineup player names from scraped squads if available, else fall back to existing lineup
  const homeXI = existing.homeLineup.players.length
    ? existing.homeLineup.players.map(p => p.name).join(', ')
    : squads.home.slice(0, 11).map(p => p.name).join(', ');
  const awayXI = existing.awayLineup.players.length
    ? existing.awayLineup.players.map(p => p.name).join(', ')
    : squads.away.slice(0, 11).map(p => p.name).join(', ');

  process.stdout.write(`   🤖 Generating incidents (score: ${score.home}–${score.away})...`);
  const aiIncidents = extractJson<AIIncident[]>(
    runClaude(postIncidentsPrompt(
      m.home_team, m.away_team,
      score.home, score.away,
      m.stage, m.stadium,
      homeXI, awayXI
    ))
  );

  // Validate goal count matches real score
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

  const incidents: MatchIncident[] = aiIncidents
    .sort((a, b) => a.minute - b.minute)
    .map(inc => ({
      minute: inc.minute,
      type: inc.type,
      player: inc.player,
      detail: inc.detail,
      teamSlug: inc.team === 'home' ? m.home_slug : m.away_slug,
    }));

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
