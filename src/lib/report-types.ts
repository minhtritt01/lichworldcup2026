import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

export interface ReportMeta {
  title: string;
  description: string;
  matchId: string;
  type: 'pre-match' | 'post-match';
  locale: 'vi' | 'en';
  publishedAt: string;
  homeTeam: string;
  awayTeam: string;
  homeSlug: string;
  awaySlug: string;
  stage: string;
  kickoff: string;
  stadium: string;
  referee?: string;
  finalScore?: string;
  tags: string[];
}

export interface PreMatchData {
  odds: { home: number; draw: number; away: number };
  weather?: { temp: string; condition: string; humidity: string };
  form: { home: string[]; away: string[] };
  lineups: {
    home: { formation: string; players: LineupPlayer[] };
    away: { formation: string; players: LineupPlayer[] };
  };
  xFactor: { name: string; reason: string };
  prediction: { home: number; away: number; reasoning: string };
  analysis: string;
}

export interface PostMatchData {
  score: { home: number; away: number };
  // Only present when the tie went to a shootout
  penalties?: { home: number; away: number };
  goals: GoalEvent[];
  stats: MatchStat[];
  turningPoint: { minute: string; description: string };
  motm: { name: string; rating: number; metrics: string[]; reason: string };
  standings: StandingRow[];
  nextMatches: NextMatch[];
  analysis: string;
}

export interface LineupPlayer {
  name: string;
  number: number;
  position: string;
  captain?: boolean;
}

export interface GoalEvent {
  minute: string;
  player: string;
  team: 'home' | 'away';
  description: string;
  isPenalty?: boolean;
  isOwnGoal?: boolean;
}

export interface MatchStat {
  label: string;
  labelVi: string;
  home: number | string;
  away: number | string;
  homePercent?: number;
}

export interface StandingRow {
  pos: number;
  team: string;
  flag: string;
  slug: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: number;
  points: number;
  highlight?: boolean;
  qualify?: 'direct' | 'third';
}

export interface NextMatch {
  date: string;
  homeTeam: string;
  homeFlag: string;
  awayTeam: string;
  awayFlag: string;
  matchId: string;
}

export interface ParsedReport {
  meta: ReportMeta;
  content: string;
  htmlContent: string;
  preMatchData?: PreMatchData;
  postMatchData?: PostMatchData;
}

const REPORTS_DIR = join(process.cwd(), 'content', 'reports');

export function getReportsDir(): string {
  return REPORTS_DIR;
}

export function getAllReportFiles(): string[] {
  if (!existsSync(REPORTS_DIR)) return [];
  return readdirSync(REPORTS_DIR).filter(f => f.endsWith('.mdx'));
}

export function getAllReportSlugs(locale: string): string[] {
  return getAllReportFiles()
    .filter(f => f.endsWith(`-${locale}.mdx`))
    .map(f => f.replace(`.mdx`, '').replace(`-${locale}`, ''));
}

export function parseReportFile(slug: string, locale: string): ParsedReport | null {
  const filePath = join(REPORTS_DIR, `${slug}-${locale}.mdx`);
  if (!existsSync(filePath)) return null;

  try {
    const raw = readFileSync(filePath, 'utf-8');

    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!fmMatch) return null;
    const [, fmBlock, content] = fmMatch;

    const meta: Record<string, unknown> = {};
    for (const line of fmBlock.split('\n')) {
      const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
      if (m) {
        const [, key, val] = m;
        if (val.startsWith('[')) {
          try { meta[key] = JSON.parse(val.replace(/'/g, '"')); } catch { meta[key] = []; }
        } else {
          meta[key] = val;
        }
      }
    }

    let preMatchData: PreMatchData | undefined;
    let postMatchData: PostMatchData | undefined;

    const jsonMatch = content.match(/<!--\s*DATA:\s*([\s\S]*?)\s*-->/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (meta.type === 'pre-match') preMatchData = data;
        if (meta.type === 'post-match') postMatchData = data;
      } catch {}
    }

    const htmlContent = markdownToHtml(content.replace(/<!--[\s\S]*?-->/g, '').trim());

    return {
      meta: meta as unknown as ReportMeta,
      content: content.trim(),
      htmlContent,
      preMatchData,
      postMatchData,
    };
  } catch {
    return null;
  }
}

function markdownToHtml(md: string): string {
  let html = md;

  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  html = html.replace(
    /\|(.+)\|\n\|[-|:\s]+\|\n((?:\|.+\|\n?)+)/g,
    (_, header: string, body: string) => {
      const ths = header.split('|').filter(Boolean).map((h: string) => `<th>${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const tds = row.split('|').filter(Boolean).map((d: string) => `<td>${d.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    }
  );

  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  html = html.replace(/^---$/gm, '<hr />');

  const lines = html.split('\n');
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^<(h[1-4]|blockquote|table|thead|tbody|tr|th|td|ul|li|hr|div|p)/.test(trimmed)) {
      result.push(trimmed);
    } else {
      result.push(`<p>${trimmed}</p>`);
    }
  }

  return result.join('\n');
}
