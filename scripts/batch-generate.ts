#!/usr/bin/env npx tsx
/**
 * Batch generator — fills in missing pre.json, match-details, and reports.
 *
 * Usage:
 *   npx tsx scripts/batch-generate.ts              # generate everything missing
 *   npx tsx scripts/batch-generate.ts --pre-only   # only generate pre.json files
 *   npx tsx scripts/batch-generate.ts --details-only
 *   npx tsx scripts/batch-generate.ts --reports-only
 *   npx tsx scripts/batch-generate.ts wc26_025 wc26_030  # specific range
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { MOCK_MATCHES } from '../src/lib/mock-data';
import { TEAMS_DATA } from '../src/lib/teams-data';
import type { MatchPreData } from './fotmob';

interface PlayerInfo {
  name: string;
  number: number;
  position: string;
  age?: number;
}

const ROOT = process.cwd();
const SCRAPED = join(ROOT, 'content', 'scraped');
const DETAILS = join(ROOT, 'content', 'match-details');
const REPORTS = join(ROOT, 'content', 'reports');

// ─── Helpers ─────────────────────────────────────────────

function toSlug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

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

function findTeamBySlug(slug: string): typeof TEAMS_DATA[0] | undefined {
  return TEAMS_DATA.find(t => t.slug === slug);
}

function findTeamByName(name: string): typeof TEAMS_DATA[0] | undefined {
  const lower = name.toLowerCase();
  const resolved = TEAM_NAME_ALIASES[lower] ?? lower;
  const slug = toSlug(resolved);
  return (
    findTeamBySlug(slug) ||
    TEAMS_DATA.find(t => t.nameEn.toLowerCase() === resolved) ||
    TEAMS_DATA.find(t => t.nameEn.toLowerCase() === lower)
  );
}

function buildSquad(teamName: string, teamSlug: string): PlayerInfo[] {
  const team = findTeamBySlug(teamSlug) ?? findTeamByName(teamName);
  if (!team?.players?.length) return [];
  return team.players.slice(0, 23).map((p, idx) => ({
    name: p.name,
    number: p.no ?? idx + 1,
    position: p.pos ?? '',
    age: p.age,
  }));
}

// ─── Step 1: Generate pre.json ────────────────────────────

function generatePreJson(matchId: string): boolean {
  const outPath = join(SCRAPED, `${matchId}-pre.json`);
  if (existsSync(join(SCRAPED, `${matchId}-post.json`)) || existsSync(outPath)) {
    return false; // already exists
  }

  const m = MOCK_MATCHES.find(x => x.match_id === matchId);
  if (!m) {
    console.error(`  ❌ ${matchId}: not found in MOCK_MATCHES`);
    return false;
  }

  const homeSquad = buildSquad(m.home_team, m.home_slug);
  const awaySquad = buildSquad(m.away_team, m.away_slug);

  const data: MatchPreData = {
    matchId,
    eventId: 'local',
    status: 'upcoming',
    scrapedAt: new Date().toISOString(),
    general: {
      homeTeam: m.home_team,
      homeSlug: m.home_slug,
      awayTeam: m.away_team,
      awaySlug: m.away_slug,
      stage: m.stage,
      group: m.group ?? '',
      kickoffUTC: m.kickoff_utc,
      venue: m.stadium,
      referee: '',
    },
    form: { home: [], away: [] },
    squads: { home: homeSquad, away: awaySquad },
  };

  writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  💾 ${matchId}: ${m.home_team} vs ${m.away_team}`);
  return true;
}

// ─── Step 2: generate-match-details ──────────────────────

function generateMatchDetails(matchId: string): boolean {
  const outPath = join(DETAILS, `${matchId}.json`);
  if (existsSync(outPath)) return false;

  const result = spawnSync('npx', ['tsx', 'scripts/generate-match-details.ts', matchId], {
    encoding: 'utf8',
    shell: '/bin/zsh',
    timeout: 60_000,
  });

  if (result.status !== 0) {
    console.error(`  ❌ generate-match-details failed for ${matchId}: ${result.stderr}`);
    return false;
  }
  return true;
}

// ─── Step 3: generate-report ─────────────────────────────

function generateReport(matchId: string): boolean {
  const enOut = join(REPORTS, `${matchId}-pre-en.mdx`);
  const viOut = join(REPORTS, `${matchId}-pre-vi.mdx`);
  if (existsSync(enOut) && existsSync(viOut)) return false;

  const scraped = join(SCRAPED, `${matchId}-pre.json`);
  if (!existsSync(scraped)) {
    console.error(`  ❌ ${matchId}: no scraped pre.json — run step 1 first`);
    return false;
  }

  const result = spawnSync('npx', ['tsx', 'scripts/generate-report.ts', matchId, 'pre'], {
    encoding: 'utf8',
    shell: '/bin/zsh',
    timeout: 180_000,
  });

  if (result.status !== 0) {
    console.error(`  ❌ generate-report failed for ${matchId}: ${result.stderr?.slice(0, 200)}`);
    return false;
  }
  return true;
}

// ─── Main ─────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const preOnly = args.includes('--pre-only');
  const detailsOnly = args.includes('--details-only');
  const reportsOnly = args.includes('--reports-only');
  const specificIds = args.filter(a => a.startsWith('wc26_'));

  mkdirSync(SCRAPED, { recursive: true });
  mkdirSync(DETAILS, { recursive: true });
  mkdirSync(REPORTS, { recursive: true });

  const allIds = MOCK_MATCHES.map(m => m.match_id);
  const targetIds = specificIds.length ? specificIds : allIds;

  console.log(`\n🏟  WC2026 Batch Generator`);
  console.log(`   Target: ${targetIds.length} matches\n`);

  // Step 1: pre.json
  if (!detailsOnly && !reportsOnly) {
    console.log('━━━ Step 1: Generate missing pre.json ━━━');
    let count = 0;
    for (const id of targetIds) {
      if (generatePreJson(id)) count++;
    }
    console.log(`  Done: ${count} new pre.json files\n`);
  }

  // Step 2: match-details
  if (!preOnly && !reportsOnly) {
    console.log('━━━ Step 2: Generate match-details ━━━');
    let done = 0, failed = 0;
    for (const id of targetIds) {
      process.stdout.write(`  ${id}...`);
      const ok = generateMatchDetails(id);
      if (ok) { process.stdout.write(' ✅\n'); done++; }
      else { process.stdout.write(' ⏭\n'); }
    }
    console.log(`  Done: ${done} new, failed: ${failed}\n`);
  }

  // Step 3: reports
  if (!preOnly && !detailsOnly) {
    console.log('━━━ Step 3: Generate pre-reports ━━━');
    let done = 0, failed = 0;
    for (const id of targetIds) {
      const enOut = join(REPORTS, `${id}-pre-en.mdx`);
      const viOut = join(REPORTS, `${id}-pre-vi.mdx`);
      if (existsSync(enOut) && existsSync(viOut)) {
        process.stdout.write(`  ${id}... ⏭\n`);
        continue;
      }
      process.stdout.write(`  ${id}...`);
      if (generateReport(id)) {
        process.stdout.write(' ✅\n');
        done++;
      } else {
        process.stdout.write(' ❌\n');
        failed++;
      }
    }
    console.log(`\n  Done: ${done} new reports, failed: ${failed}\n`);
  }

  console.log('✅ Batch complete.');
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});
