#!/usr/bin/env npx tsx
/**
 * Automated sync — run this once daily, no arguments needed.
 *
 *   npx tsx scripts/sync.ts
 *
 * What it does for every match in MOCK_MATCHES:
 *   1. If no scraped data → skip (event ID unknown; add via fotmob.ts manually once)
 *   2. If pre.json exists with a real eventId → re-scrape to detect if match finished
 *   3. If post.json exists:
 *        - generate post-match report if missing
 *        - generate match-details incidents if missing
 *   4. If still upcoming/live:
 *        - generate pre-match report if missing
 *        - generate match-details lineup if missing
 *   5. Commit + push if anything changed
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync, spawnSync } from 'child_process';
import { MOCK_MATCHES } from '../src/lib/mock-data';
import { TEAMS_DATA } from '../src/lib/teams-data';

const ROOT = process.cwd();
const SCRAPED = join(ROOT, 'content', 'scraped');
const REPORTS = join(ROOT, 'content', 'reports');
const DETAILS = join(ROOT, 'content', 'match-details');
const TSDB = 'https://www.thesportsdb.com/api/v1/json/3';

// ─── TSDB auto-discovery ──────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

// TSDB search/event naming sometimes differs from our team names
const TSDB_NAME_ALIASES: Record<string, string> = {
  'czechia': 'Czech Republic',
  'türkiye': 'Turkey',
  'bosnia & herzegovina': 'Bosnia-Herzegovina',
};

async function findEventIdBySearch(m: typeof MOCK_MATCHES[0]): Promise<string | null> {
  const home = TSDB_NAME_ALIASES[m.home_team.toLowerCase()] ?? m.home_team;
  const away = TSDB_NAME_ALIASES[m.away_team.toLowerCase()] ?? m.away_team;
  const query = `${home}_vs_${away}`.replace(/ /g, '_');
  try {
    const res = await fetch(`${TSDB}/searchevents.php?e=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const data = await res.json() as { event?: Array<{ idEvent: string; strLeague: string }> };
    const match = (data.event ?? []).find(e => e.strLeague.toLowerCase().includes('world cup'));
    return match?.idEvent ?? null;
  } catch {
    return null;
  }
}

async function findEventId(m: typeof MOCK_MATCHES[0]): Promise<string | null> {
  const date = m.kickoff_utc.slice(0, 10);
  try {
    const res = await fetch(`${TSDB}/eventsday.php?d=${date}&s=Soccer`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (res.ok) {
      const data = await res.json() as { events?: Array<{ idEvent: string; strHomeTeam: string; strAwayTeam: string; strLeague: string }> };
      const events = (data.events ?? []).filter(e => e.strLeague.toLowerCase().includes('world cup'));
      const homeN = normalize(m.home_team);
      const awayN = normalize(m.away_team);
      const match = events.find(e =>
        (normalize(e.strHomeTeam).includes(homeN.slice(0, 5)) || homeN.includes(normalize(e.strHomeTeam).slice(0, 5))) &&
        (normalize(e.strAwayTeam).includes(awayN.slice(0, 5)) || awayN.includes(normalize(e.strAwayTeam).slice(0, 5)))
      );
      if (match) return match.idEvent;
    }
  } catch {
    // fall through to search-based lookup
  }
  // eventsday.php doesn't index every match — fall back to direct name search
  return findEventIdBySearch(m);
}

// ─── Helpers ──────────────────────────────────────────────

function run(cmd: string): void {
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, shell: '/bin/zsh' });
}

function hasPre(id: string)  { return existsSync(join(SCRAPED, `${id}-pre.json`)); }
function hasPost(id: string) { return existsSync(join(SCRAPED, `${id}-post.json`)); }
function hasPreReport(id: string) {
  return existsSync(join(REPORTS, `${id}-pre-vi.mdx`)) &&
         existsSync(join(REPORTS, `${id}-pre-en.mdx`));
}
function hasPostReport(id: string) {
  return existsSync(join(REPORTS, `${id}-post-vi.mdx`)) &&
         existsSync(join(REPORTS, `${id}-post-en.mdx`));
}
function hasLineup(id: string) { return existsSync(join(DETAILS, `${id}.json`)); }
function hasIncidents(id: string) {
  if (!hasLineup(id)) return false;
  const d = JSON.parse(readFileSync(join(DETAILS, `${id}.json`), 'utf-8'));
  return Array.isArray(d.incidents) && d.incidents.length > 0;
}

function readEventId(id: string): string | null {
  for (const suffix of ['post', 'pre']) {
    const p = join(SCRAPED, `${id}-${suffix}.json`);
    if (existsSync(p)) {
      const d = JSON.parse(readFileSync(p, 'utf-8'));
      if (d.eventId && d.eventId !== 'manual' && d.eventId !== 'local') return d.eventId;
    }
  }
  return null;
}

// Re-fetch the TSDB event; returns true if status changed to finished
function rescrape(eventId: string, matchId: string): boolean {
  const before = hasPost(matchId);
  try {
    execSync(`npx tsx scripts/fotmob.ts ${eventId} ${matchId}`, {
      cwd: ROOT, shell: '/bin/zsh', stdio: 'pipe',
    });
  } catch {
    console.log(`  ⚠️  TSDB fetch failed (rate-limited or offline)`);
  }
  return !before && hasPost(matchId);
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  mkdirSync(SCRAPED, { recursive: true });
  mkdirSync(REPORTS, { recursive: true });
  mkdirSync(DETAILS, { recursive: true });

  let changed = 0;

  for (const m of MOCK_MATCHES) {
    const id = m.match_id;
    console.log(`\n── ${id}: ${m.home_team} vs ${m.away_team}`);

    // No scraped data — try to auto-discover event ID for matches within 7 days
    if (!hasPre(id) && !hasPost(id)) {
      const kickoff = new Date(m.kickoff_utc);
      const daysAhead = (kickoff.getTime() - Date.now()) / 86_400_000;
      if (daysAhead > 7) {
        // Too far ahead — skip silently
        continue;
      }
      console.log(`  🔍 Looking up event ID on TSDB...`);
      const eventId = await findEventId(m);
      if (!eventId) {
        console.log(`  ⏭  Not found on TSDB yet — skipping`);
        continue;
      }
      console.log(`  ✅ Found event ${eventId} — scraping...`);
      run(`npx tsx scripts/fotmob.ts ${eventId} ${id}`);
      changed++;
    }

    // Re-scrape only if kickoff has passed (match could be finished)
    let eventId = readEventId(id);
    const kickoffPassed = new Date(m.kickoff_utc).getTime() < Date.now();
    if (!eventId && (hasPre(id) || hasPost(id)) && kickoffPassed) {
      console.log(`  🔍 No usable event ID on file (placeholder) — rediscovering on TSDB...`);
      eventId = await findEventId(m);
      if (!eventId) console.log(`  ⏭  Still not found on TSDB — skipping rescrape`);
    }
    if (eventId && !hasPost(id) && kickoffPassed) {
      console.log(`  🔄 Kickoff passed — checking if finished...`);
      const nowFinished = rescrape(eventId, id);
      if (nowFinished) console.log(`  🏁 Match finished!`);
    }

    // ── Post-match content ──────────────────────────────
    if (hasPost(id)) {
      if (!hasPostReport(id)) {
        console.log(`  📝 Generating post-match report...`);
        run(`npx tsx scripts/generate-report.ts ${id} post`);
        changed++;
      }
      if (!hasIncidents(id)) {
        console.log(`  ⚡ Generating match incidents...`);
        run(`npx tsx scripts/generate-match-details.ts ${id} --post`);
        changed++;
      }
      continue;
    }

    // ── Pre-match content ───────────────────────────────
    if (!hasPreReport(id)) {
      console.log(`  📝 Generating pre-match report...`);
      run(`npx tsx scripts/generate-report.ts ${id}`);
      changed++;
    }
    if (!hasLineup(id)) {
      console.log(`  📋 Generating lineup...`);
      run(`npx tsx scripts/generate-match-details.ts ${id}`);
      changed++;
    }
  }

  // ── Commit + push ────────────────────────────────────
  console.log('\n');
  const result = spawnSync('git', ['status', '--porcelain', 'content/'], {
    cwd: ROOT, encoding: 'utf8',
  });
  if (!result.stdout.trim()) {
    console.log('✅ Everything up to date — nothing to commit.');
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  run(`git add content/scraped/ content/reports/ content/match-details/`);
  run(`git commit -m "content: sync ${date}"`);
  run(`git push`);
  console.log(`\n🚀 Pushed ${changed} update(s).`);
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});
