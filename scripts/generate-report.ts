#!/usr/bin/env npx tsx
/**
 * Step 2: Report generator
 * Usage: npx tsx scripts/generate-report.ts <match_id> [pre|post]
 * Example: npx tsx scripts/generate-report.ts wc26_001
 *          npx tsx scripts/generate-report.ts wc26_001 post
 *
 * Reads:  content/scraped/<match_id>-{pre|post}.json
 * Writes: content/reports/<match_id>-{pre|post}-vi.mdx
 *         content/reports/<match_id>-{pre|post}-en.mdx
 *
 * Architecture:
 *   - DATA JSON (lineup, odds, form) is built deterministically here
 *   - Claude only writes the analysis text (~600 words) → fast, focused
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import type { MatchPreData, MatchPostData } from './fotmob';

// ─── Claude call ──────────────────────────────────────────

function runClaude(prompt: string): string {
  const tmpFile = `/tmp/rpt-${Date.now()}.txt`;
  writeFileSync(tmpFile, prompt, 'utf-8');
  try {
    const out = execSync(`claude --print --model haiku < "${tmpFile}"`, {
      shell: '/bin/zsh',
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 5,
      timeout: 180_000,
    });
    return (out as unknown as string).trim();
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

function stripFences(text: string): string {
  return text.replace(/^```(?:mdx|markdown|md)?\n/i, '').replace(/\n```\s*$/i, '').trim();
}

// ─── Position mapping ─────────────────────────────────────

const POSITION_ORDER = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'CM', 'RW', 'ST', 'LW'];
const POSITION_ROLES: Record<string, string[]> = {
  GK: ['Goalkeeper', 'GK'],
  DEF: ['Defender', 'RB', 'CB', 'LB', 'Centre-Back', 'Right-Back', 'Left-Back', 'DEF'],
  MID: ['Midfielder', 'CM', 'DM', 'CAM', 'Central Midfield', 'MID'],
  FWD: ['Forward', 'ST', 'RW', 'LW', 'Striker', 'FWD', 'ATT'],
};

function pickStartingXI(
  players: Array<{ name: string; number: number; position?: string; age?: number }>
): Array<{ name: string; number: number; position: string; captain?: boolean }> {
  // Sort: GK first, then DEF, MID, FWD
  const gks = players.filter(p => POSITION_ROLES.GK.some(r => (p.position ?? '').includes(r)));
  const defs = players.filter(p => POSITION_ROLES.DEF.some(r => (p.position ?? '').includes(r)));
  const mids = players.filter(p => POSITION_ROLES.MID.some(r => (p.position ?? '').includes(r)));
  const fwds = players.filter(p => POSITION_ROLES.FWD.some(r => (p.position ?? '').includes(r)));
  const rest = players.filter(p => !gks.includes(p) && !defs.includes(p) && !mids.includes(p) && !fwds.includes(p));

  // Build XI from buckets
  const xi: typeof players = [
    ...(gks[0] ? [gks[0]] : []),
    ...defs.slice(0, 4),
    ...mids.slice(0, 3),
    ...fwds.slice(0, 3),
    ...rest,
  ].slice(0, 11);

  // If we don't have 11 from positions, just take first 11
  const final = xi.length >= 11 ? xi : players.slice(0, 11);

  return final.map((p, i) => ({
    name: p.name,
    number: p.number,
    position: POSITION_ORDER[i] ?? 'MID',
    captain: i === 5, // rough: captain = CM/first midfielder
  }));
}

function guessFormation(players: Array<{ position?: string }>): string {
  const defs = players.filter(p => POSITION_ROLES.DEF.some(r => (p.position ?? '').includes(r))).length;
  const mids = players.filter(p => POSITION_ROLES.MID.some(r => (p.position ?? '').includes(r))).length;
  const fwds = players.filter(p => POSITION_ROLES.FWD.some(r => (p.position ?? '').includes(r))).length;
  if (defs === 4 && mids === 3 && fwds === 3) return '4-3-3';
  if (defs === 4 && mids === 4 && fwds === 2) return '4-4-2';
  if (defs === 4 && mids === 2 && fwds === 3) return '4-2-3-1';
  if (defs === 3 && mids === 5 && fwds === 2) return '3-5-2';
  return '4-3-3';
}

// ─── Build pre-match DATA JSON ────────────────────────────

function buildPreData(data: MatchPreData) {
  const homeXI = pickStartingXI(data.squads.home);
  const awayXI = pickStartingXI(data.squads.away);

  const formToLetters = (entries: Array<{ result: string }>): string[] => {
    const letters: string[] = entries.map(e => e.result as 'W' | 'D' | 'L');
    while (letters.length < 5) letters.push('?');
    return letters.slice(0, 5);
  };

  return {
    odds: { home: 55, draw: 25, away: 20 },
    form: {
      home: formToLetters(data.form.home),
      away: formToLetters(data.form.away),
    },
    lineups: {
      home: {
        formation: guessFormation(data.squads.home),
        players: homeXI,
      },
      away: {
        formation: guessFormation(data.squads.away),
        players: awayXI,
      },
    },
    xFactor: { name: homeXI[9]?.name ?? 'TBC', reason: 'Key attacker to watch.' },
    prediction: { home: 2, away: 1, reasoning: 'Home advantage expected to be decisive.' },
  };
}

// ─── Build post-match DATA JSON ───────────────────────────

function buildPostData(data: MatchPostData) {
  return {
    score: data.score,
    ...(data.penalties ? { penalties: data.penalties } : {}),
    goals: [
      // Claude will fill these in the analysis; we leave an empty array here
      // so the structure renders cleanly
    ] as unknown[],
    stats: [
      { label: 'Possession', labelVi: 'Kiểm soát bóng', home: '52%', away: '48%', homePercent: 52 },
      { label: 'Shots', labelVi: 'Sút', home: 12, away: 9, homePercent: 57 },
      { label: 'On Target', labelVi: 'Trúng đích', home: 5, away: 3, homePercent: 63 },
      { label: 'Corners', labelVi: 'Góc', home: 6, away: 4, homePercent: 60 },
      { label: 'Yellow Cards', labelVi: 'Thẻ vàng', home: 2, away: 3, homePercent: 40 },
    ],
    turningPoint: { minute: '65\'', description: 'Tactical substitution changed the game.' },
    motm: {
      name: data.squads.home[8]?.name ?? 'TBC',
      rating: 8.1,
      metrics: ['1 goal', '3 key passes', '6/8 duels won'],
      reason: 'Dominated the attacking third throughout.',
    },
    standings: [],
    nextMatches: [],
  };
}

// ─── Analysis prompts ─────────────────────────────────────

function preAnalysisPrompt(data: MatchPreData, locale: 'vi' | 'en'): string {
  const { general, form, squads } = data;
  const homeForm = form.home.map(f => `${f.result} vs ${f.opponent}`).join(', ') || 'limited data';
  const awayForm = form.away.map(f => `${f.result} vs ${f.opponent}`).join(', ') || 'limited data';
  const homePlayers = squads.home.slice(0, 11).map(p => p.name).join(', ');
  const awayPlayers = squads.away.slice(0, 11).map(p => p.name).join(', ');

  if (locale === 'vi') {
    return `Bạn là chuyên gia phân tích chiến thuật World Cup 2026. Viết bài phân tích trước trận bằng tiếng Việt.

THÔNG TIN TRẬN:
${general.homeTeam} vs ${general.awayTeam} — Bảng ${general.group}, ${general.stage}
Sân: ${general.venue} | Giờ đá: ${general.kickoffUTC}

PHONG ĐỘ GẦN ĐÂY:
${general.homeTeam}: ${homeForm}
${general.awayTeam}: ${awayForm}

CẦU THỦ TIÊU BIỂU:
${general.homeTeam}: ${homePlayers}
${general.awayTeam}: ${awayPlayers}

YÊU CẦU: Viết 4 đoạn phân tích bằng tiếng Việt, mỗi đoạn 100-150 từ:
1. ## Nhận định chiến thuật trận đấu — sơ đồ, vùng chiến thuật then chốt, điểm yếu có thể khai thác
2. ## Phong độ & Tâm lý thi đấu — phong độ gần đây, áp lực tâm lý
3. ## Đội hình ra sân dự kiến — danh sách cầu thủ dự kiến, nhân tố quan trọng
4. ## Dự đoán tỷ số & Tỷ lệ thắng — lịch sử đối đầu, nhận định kết quả

Chỉ trả lời nội dung markdown thuần, KHÔNG dùng code fence.`;
  }

  return `You are a World Cup 2026 tactical analyst. Write a pre-match analysis in English.

MATCH: ${general.homeTeam} vs ${general.awayTeam} — Group ${general.group}, ${general.stage}
Venue: ${general.venue} | Kickoff: ${general.kickoffUTC}

RECENT FORM:
${general.homeTeam}: ${homeForm}
${general.awayTeam}: ${awayForm}

KEY PLAYERS:
${general.homeTeam}: ${homePlayers}
${general.awayTeam}: ${awayPlayers}

Write 4 sections, each 100-150 words:
1. ## Tactical Analysis — formations, key battle zones, exploitable weaknesses
2. ## Form & Momentum — recent results, psychological edge
3. ## Predicted Lineup & Key Players — expected starting XI, players to watch
4. ## Score Prediction & Match Odds — head-to-head history and final verdict

Plain markdown only, NO code fences.`;
}

function postAnalysisPrompt(data: MatchPostData, locale: 'vi' | 'en'): string {
  const { general, score, squads, penalties } = data;
  const homePlayers = squads.home.slice(0, 11).map(p => p.name).join(', ');
  const awayPlayers = squads.away.slice(0, 11).map(p => p.name).join(', ');
  const penWinner = penalties
    ? (penalties.home > penalties.away ? general.homeTeam : general.awayTeam)
    : null;

  if (locale === 'vi') {
    const penLineVi = penalties
      ? `\nLOẠT SÚT LUÂN LƯU: ${general.homeTeam} ${penalties.home}–${penalties.away} ${general.awayTeam} — ${penWinner} đi tiếp. Bài viết BẮT BUỘC phải nêu rõ trận đấu được định đoạt trên chấm 11m và ${penWinner} giành quyền đi tiếp.\n`
      : '';
    return `Bạn là biên tập viên thể thao World Cup 2026 viết cho website tường thuật trực tiếp. Hãy viết bài phân tích sau trận hấp dẫn và hợp lý bằng tiếng Việt dựa trên hai đội, tỷ số cuối và phong cách thi đấu đặc trưng. KHÔNG từ chối và KHÔNG yêu cầu thêm dữ liệu — hãy sáng tạo các chi tiết chiến thuật, khoảnh khắc then chốt và bước ngoặt phù hợp với tỷ số và các đội.

KẾT QUẢ: ${general.homeTeam} ${score.home}–${score.away} ${general.awayTeam}
${penLineVi}Bảng ${general.group} | ${general.stage} | Sân: ${general.venue}

ĐỘI HÌNH:
${general.homeTeam}: ${homePlayers}
${general.awayTeam}: ${awayPlayers}

YÊU CẦU: Viết 4 đoạn phân tích bằng tiếng Việt, mỗi đoạn 120-150 từ:
1. ## Tường thuật trận đấu — diễn biến các giai đoạn chính, bàn thắng, bước ngoặt
2. ## Nhận định chiến thuật — chiến lược hai đội, điều chỉnh trong trận, ai thắng cuộc chiến sơ đồ
3. ## Bước ngoặt quyết định — khoảnh khắc định đoạt trận đấu (cụ thể phút, tình huống)
4. ## Phân tích sau trận — ảnh hưởng bảng xếp hạng, nhận xét HLV hai đội

Chỉ trả lời nội dung markdown thuần, KHÔNG dùng code fence.`;
  }

  const penLineEn = penalties
    ? `\nPENALTY SHOOTOUT: ${general.homeTeam} ${penalties.home}–${penalties.away} ${general.awayTeam} — ${penWinner} advance. The article MUST make clear the tie was settled on penalties and that ${penWinner} went through.\n`
    : '';

  return `You are a World Cup 2026 senior sports analyst writing for a live score website. Write a plausible, engaging post-match analysis in English based on the teams, the final score, and typical playing styles. Do not refuse or ask for more data — invent plausible tactical details, key moments, and a turning point that fit the scoreline and teams.

RESULT: ${general.homeTeam} ${score.home}–${score.away} ${general.awayTeam}
${penLineEn}Group ${general.group} | ${general.stage} | ${general.venue}

SQUADS:
${general.homeTeam}: ${homePlayers}
${general.awayTeam}: ${awayPlayers}

Write 4 sections, each 120-150 words:
1. ## Match Narrative — key phases, goals, turning point moments
2. ## Tactical Breakdown — each team's approach, in-game adjustments, formation battle
3. ## Key Moments — the decisive moment with specific minute and situation
4. ## Aftermath — standings impact, manager reactions

Plain markdown only, NO code fences.`;
}

// ─── MDX assembler ────────────────────────────────────────

function assemblePre(
  data: MatchPreData,
  structuredData: ReturnType<typeof buildPreData>,
  analysis: string,
  locale: 'vi' | 'en'
): string {
  const { general } = data;
  const isVi = locale === 'vi';
  const now = new Date().toISOString();

  const title = isVi
    ? `Nhận định ${general.homeTeam} vs ${general.awayTeam} — Bảng ${general.group} World Cup 2026`
    : `${general.homeTeam} vs ${general.awayTeam} Preview — Group ${general.group} World Cup 2026`;

  const desc = isVi
    ? `Phân tích chiến thuật, đội hình dự kiến và dự đoán tỉ số trận ${general.homeTeam} vs ${general.awayTeam} tại World Cup 2026.`
    : `Tactical analysis, predicted lineups and score prediction for ${general.homeTeam} vs ${general.awayTeam} at the 2026 FIFA World Cup.`;

  const tags = isVi
    ? `["world cup 2026", "${general.homeSlug}", "${general.awaySlug}", "nhan dinh bong da"]`
    : `["world cup 2026", "${general.homeSlug}", "${general.awaySlug}", "match preview"]`;

  const dataJson = JSON.stringify(structuredData);

  return `---
title: "${title}"
description: "${desc}"
matchId: "${data.matchId}"
type: "pre-match"
locale: "${locale}"
publishedAt: "${now}"
homeTeam: "${general.homeTeam}"
awayTeam: "${general.awayTeam}"
homeSlug: "${general.homeSlug}"
awaySlug: "${general.awaySlug}"
stage: "Bảng ${general.group} - ${general.stage}"
kickoff: "${general.kickoffUTC}"
stadium: "${general.venue}"
referee: "${general.referee || 'TBC'}"
tags: ${tags}
---

<!-- DATA: ${dataJson} -->

${analysis}
`;
}

function assemblePost(
  data: MatchPostData,
  structuredData: ReturnType<typeof buildPostData>,
  analysis: string,
  locale: 'vi' | 'en'
): string {
  const { general, score, penalties } = data;
  const isVi = locale === 'vi';
  const now = new Date().toISOString();

  // A shootout tie is level on the scoreline — say who actually went through
  const penSuffix = penalties
    ? isVi
      ? ` (pen ${penalties.home}-${penalties.away})`
      : ` (${penalties.home}-${penalties.away} pens)`
    : '';

  const title = isVi
    ? `Kết quả ${general.homeTeam} ${score.home}-${score.away}${penSuffix} ${general.awayTeam} — World Cup 2026 Bảng ${general.group}`
    : `${general.homeTeam} ${score.home}-${score.away}${penSuffix} ${general.awayTeam} — World Cup 2026 Group ${general.group} Result`;

  const desc = isVi
    ? `Phân tích chiến thuật và tổng kết sau trận ${general.homeTeam} ${score.home}-${score.away}${penSuffix} ${general.awayTeam} tại World Cup 2026.`
    : `Post-match analysis for ${general.homeTeam} ${score.home}-${score.away}${penSuffix} ${general.awayTeam} at the 2026 FIFA World Cup.`;

  const tags = isVi
    ? `["world cup 2026", "ket qua", "${general.homeSlug}", "${general.awaySlug}"]`
    : `["world cup 2026", "result", "${general.homeSlug}", "${general.awaySlug}"]`;

  const dataJson = JSON.stringify(structuredData);

  return `---
title: "${title}"
description: "${desc}"
matchId: "${data.matchId}"
type: "post-match"
locale: "${locale}"
publishedAt: "${now}"
homeTeam: "${general.homeTeam}"
awayTeam: "${general.awayTeam}"
homeSlug: "${general.homeSlug}"
awaySlug: "${general.awaySlug}"
stage: "Bảng ${general.group} - ${general.stage}"
kickoff: "${general.kickoffUTC}"
stadium: "${general.venue}"
finalScore: "${score.home}-${score.away}${penSuffix}"
tags: ${tags}
---

<!-- DATA: ${dataJson} -->

${analysis}
`;
}

// ─── Main ─────────────────────────────────────────────────

async function main(): Promise<void> {
  const [matchId, typeOverride] = process.argv.slice(2);

  if (!matchId) {
    console.error('Usage: npx tsx scripts/generate-report.ts <match_id> [pre|post]');
    process.exit(1);
  }

  const scrapedDir = join(process.cwd(), 'content', 'scraped');
  const reportsDir = join(process.cwd(), 'content', 'reports');
  mkdirSync(reportsDir, { recursive: true });

  const type: 'pre' | 'post' = typeOverride === 'post' ? 'post'
    : typeOverride === 'pre' ? 'pre'
    : existsSync(join(scrapedDir, `${matchId}-post.json`)) ? 'post' : 'pre';

  const dataPath = join(scrapedDir, `${matchId}-${type}.json`);
  if (!existsSync(dataPath)) {
    console.error(`❌ Not found: ${dataPath}`);
    console.error(`   Run first: npx tsx scripts/fotmob.ts <event_id> ${matchId}`);
    process.exit(1);
  }

  const rawData = JSON.parse(readFileSync(dataPath, 'utf-8'));

  console.log(`\n🤖 Generating ${type}-match report — ${rawData.general.homeTeam} vs ${rawData.general.awayTeam}`);
  if (type === 'post') console.log(`   Score: ${rawData.score.home}–${rawData.score.away}`);

  const structuredData = type === 'post'
    ? buildPostData(rawData as MatchPostData)
    : buildPreData(rawData as MatchPreData);

  for (const locale of ['vi', 'en'] as const) {
    const outFile = join(reportsDir, `${matchId}-${type}-${locale}.mdx`);
    process.stdout.write(`\n⏳ [${locale.toUpperCase()}] Calling claude haiku...`);

    const prompt = type === 'post'
      ? postAnalysisPrompt(rawData as MatchPostData, locale)
      : preAnalysisPrompt(rawData as MatchPreData, locale);

    const raw = runClaude(prompt);
    const analysis = stripFences(raw);

    const mdx = type === 'post'
      ? assemblePost(rawData as MatchPostData, structuredData as ReturnType<typeof buildPostData>, analysis, locale)
      : assemblePre(rawData as MatchPreData, structuredData as ReturnType<typeof buildPreData>, analysis, locale);

    writeFileSync(outFile, mdx);
    const words = analysis.split(/\s+/).length;
    console.log(` ✅ ${words} words → ${outFile.replace(process.cwd() + '/', '')}`);
  }

  console.log(`\n🔗 Preview:`);
  console.log(`   http://localhost:3000/reports/${matchId}-${type}`);
  console.log(`   http://localhost:3000/en/reports/${matchId}-${type}`);
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});
