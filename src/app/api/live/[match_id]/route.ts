import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { MOCK_MATCHES } from '../../../../lib/mock-data';

function toStatus(s: string): string {
  if (s === 'finished') return 'Finished';
  if (s === 'live') return 'In_Play';
  return 'Scheduled';
}

function toIncidentType(t: string): string {
  if (t === 'goal') return 'Goal';
  if (t === 'yellow') return 'YellowCard';
  if (t === 'red') return 'RedCard';
  return 'Sub';
}

export async function GET(
  _req: Request,
  { params }: { params: { match_id: string } }
) {
  const m = MOCK_MATCHES.find(x => x.match_id === params.match_id);
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const root = process.cwd();
  const postPath = join(root, 'content', 'scraped', `${m.match_id}-post.json`);
  const prePath  = join(root, 'content', 'scraped', `${m.match_id}-pre.json`);
  const detailsPath = join(root, 'content', 'match-details', `${m.match_id}.json`);

  let score = { home: 0, away: 0 };
  let status = 'Scheduled';

  if (existsSync(postPath)) {
    const post = JSON.parse(readFileSync(postPath, 'utf-8'));
    score = post.score;
    status = toStatus(post.status);
  } else if (existsSync(prePath)) {
    const pre = JSON.parse(readFileSync(prePath, 'utf-8'));
    status = toStatus(pre.status);
  }

  let incidents: unknown[] = [];
  if (existsSync(detailsPath)) {
    const details = JSON.parse(readFileSync(detailsPath, 'utf-8'));
    incidents = (details.incidents ?? []).map(
      (inc: { type: string; player: string; minute: number; teamSlug: string }, i: number) => ({
        incident_id: i + 1,
        type: toIncidentType(inc.type),
        player_name: inc.player,
        time_minute: inc.minute,
        team_slug: inc.teamSlug,
      })
    );
  }

  return NextResponse.json(
    {
      match_id: m.match_id,
      status,
      stage: m.stage,
      current_minute: status === 'Finished' ? 90 : 0,
      stadium: m.stadium,
      kickoff_time: m.kickoff_utc,
      home_team: { slug: m.home_slug, name: m.home_team, name_vi: m.home_team_vi, score: score.home },
      away_team: { slug: m.away_slug, name: m.away_team, name_vi: m.away_team_vi, score: score.away },
      incidents,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
