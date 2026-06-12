import { getTranslations } from 'next-intl/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { MOCK_MATCHES } from '../../lib/mock-data';
import HomeSchedule from '../../components/HomeSchedule';

const STAGE_GROUPS = [
  { key: 'Vòng Bảng', label: 'Vòng Bảng' },
  { key: 'Vòng 1/16', label: 'Vòng 1/16' },
  { key: 'Vòng 1/8', label: 'Vòng 1/8' },
  { key: 'Tứ Kết', label: 'Tứ Kết' },
  { key: 'Bán Kết', label: 'Bán Kết' },
  { key: 'Tranh Hạng Ba', label: 'Tranh Hạng Ba' },
  { key: 'Chung Kết', label: 'Chung Kết' },
];

export default async function HomePage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });

  const root = process.cwd();
  const matchStatuses: Record<string, { status: 'upcoming' | 'finished' | 'live'; score?: { home: number; away: number } }> = {};
  for (const m of MOCK_MATCHES) {
    const postPath = join(root, 'content', 'scraped', `${m.match_id}-post.json`);
    const prePath  = join(root, 'content', 'scraped', `${m.match_id}-pre.json`);
    if (existsSync(postPath)) {
      const post = JSON.parse(readFileSync(postPath, 'utf-8'));
      matchStatuses[m.match_id] = { status: 'finished', score: post.score };
    } else if (existsSync(prePath)) {
      const pre = JSON.parse(readFileSync(prePath, 'utf-8'));
      matchStatuses[m.match_id] = { status: pre.status === 'live' ? 'live' : 'upcoming' };
    }
  }
  const stageGroups = STAGE_GROUPS.map(group => ({
    key: group.key,
    label:
      group.key === 'Vòng Bảng'
        ? t('stage.groupStage')
        : group.key === 'Vòng 1/16'
        ? t('stage.r32')
        : group.key === 'Vòng 1/8'
        ? t('stage.r16')
        : group.key === 'Tứ Kết'
        ? t('stage.qf')
        : group.key === 'Bán Kết'
        ? t('stage.sf')
        : group.key === 'Tranh Hạng Ba'
        ? t('stage.third')
        : t('stage.final'),
  }));

  const stats = [
    { value: '104', label: t('hero.matches') },
    { value: '48', label: t('hero.teams') },
    { value: '39', label: t('hero.days') },
    { value: '16', label: t('hero.stadiums') },
  ];

  return (
    <main>
      <section className="relative -mx-4 mb-8 overflow-hidden border-b border-slate-200 bg-slate-50 px-6 py-8 sm:rounded-b-2xl sm:py-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.08),transparent_36%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.10),transparent_36%)]" />
        <div className="relative">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('hero.hosted')}
          </p>
          <h1 className="mb-5 text-2xl font-semibold leading-snug text-slate-900 dark:text-white sm:text-3xl">
            {t('hero.title')}
          </h1>
          <div className="grid grid-cols-4 gap-3">
            {stats.map(s => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white/85 p-3 text-center backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">{s.value}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {([
          ['today', t('filter.today')],
          ['all', t('filter.all')],
          ['group', t('filter.groupStage')],
          ['knockout', t('filter.knockout')],
        ] as [string, string][]).map(([key, label], i) => (
          <button
            key={key}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${
              i === 0
                ? 'bg-red-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <HomeSchedule
        matches={MOCK_MATCHES}
        matchStatuses={matchStatuses}
        resultsTitle={params.locale === 'vi' ? 'Kết quả gần đây' : 'Recent Results'}
        stageGroups={stageGroups}
        favoritesTitle={t('filter.pinnedTeams')}
        favoritesEmpty={params.locale === 'vi'
          ? 'Ghim các đội bạn theo dõi để đẩy các trận liên quan lên đầu.'
          : 'Pin the teams you follow and their matches will rise to the top.'}
        scheduleTitle={params.locale === 'vi' ? 'Toàn bộ lịch thi đấu' : 'Full schedule'}
      />
    </main>
  );
}
