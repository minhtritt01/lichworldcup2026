import type { Metadata } from 'next';
import { computeAllStandings } from '../../../lib/standings';
import GroupStandingsCard from '../../../components/report/GroupStandingsCard';

const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lichworldcup2026.vn').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isEn = params.locale === 'en';
  return {
    title: isEn
      ? 'World Cup 2026 Group Standings — Live Group Tables A–L'
      : 'Bảng Xếp Hạng World Cup 2026 — Bảng A–L Cập Nhật Trực Tiếp',
    description: isEn
      ? 'Live World Cup 2026 group standings — points, played, wins, draws, losses and goal difference for all 12 groups (A–L), updated after every match.'
      : 'Bảng xếp hạng World Cup 2026 trực tiếp — điểm, số trận, thắng, hòa, thua và hiệu số bàn thắng của cả 12 bảng (A–L), cập nhật sau mỗi trận.',
    keywords: isEn
      ? ['World Cup 2026 standings', 'World Cup 2026 group tables', 'World Cup 2026 points table', 'FIFA World Cup 2026 group A B C standings']
      : ['bảng xếp hạng world cup 2026', 'bảng đấu world cup 2026', 'điểm số world cup 2026', 'bxh world cup 2026 bảng A B C'],
    alternates: {
      canonical: isEn ? `${BASE}/en/standings` : `${BASE}/standings`,
      languages: { vi: `${BASE}/standings`, en: `${BASE}/en/standings` },
    },
  };
}

export default function StandingsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as 'vi' | 'en';
  const standings = computeAllStandings(locale);
  const groups = Object.keys(standings).sort();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
          {locale === 'vi' ? 'Bảng xếp hạng' : 'Group Standings'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {locale === 'vi'
            ? 'Xếp hạng 12 bảng (A–L) — điểm, số trận, hiệu số. Cập nhật sau mỗi trận.'
            : 'All 12 groups (A–L) — points, played and goal difference. Updated after every match.'}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/50" />
          {locale === 'vi' ? 'Đi tiếp (nhất, nhì bảng)' : 'Advance (top 2)'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-900/50" />
          {locale === 'vi' ? 'Tranh vé vớt (hạng 3)' : 'Best-third playoff (3rd)'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(g => (
          <div key={g} id={`group-${g}`} className="scroll-mt-20">
            <GroupStandingsCard groupName={g} rows={standings[g]} />
          </div>
        ))}
      </div>
    </main>
  );
}
