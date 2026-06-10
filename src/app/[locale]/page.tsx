import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { MOCK_MATCHES } from '../../lib/mock-data';
import MatchCard from '../../components/MatchCard';

const STAGE_ORDER = ['Vòng Bảng', 'Vòng 1/16', 'Vòng 1/8', 'Tứ Kết', 'Bán Kết', 'Tranh Hạng Ba', 'Chung Kết'];

function getStageGroup(stage: string): string {
  if (stage.startsWith('Vòng Bảng')) return 'Vòng Bảng';
  return STAGE_ORDER.find(s => stage.startsWith(s)) ?? stage;
}

function stageLabel(key: string, t: ReturnType<typeof useTranslations>): string {
  const map: Record<string, string> = {
    'Vòng Bảng':     t('stage.groupStage'),
    'Vòng 1/16':     t('stage.r32'),
    'Vòng 1/8':      t('stage.r16'),
    'Tứ Kết':        t('stage.qf'),
    'Bán Kết':       t('stage.sf'),
    'Tranh Hạng Ba': t('stage.third'),
    'Chung Kết':     t('stage.final'),
  };
  return map[key] ?? key;
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });

  const grouped = MOCK_MATCHES.reduce<Record<string, typeof MOCK_MATCHES>>((acc, m) => {
    const key = getStageGroup(m.stage);
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const stats = [
    { value: '104', label: t('hero.matches') },
    { value: '48',  label: t('hero.teams') },
    { value: '39',  label: t('hero.days') },
    { value: '16',  label: t('hero.stadiums') },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="bg-slate-900 -mx-4 px-6 py-8 sm:py-12 mb-8 sm:rounded-b-2xl">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">
          {t('hero.hosted')}
        </p>
        <h1 className="text-white text-2xl sm:text-3xl font-semibold leading-snug mb-5">
          {t('hero.title')}
        </h1>
        <div className="grid grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-slate-800 rounded-xl p-3 text-center">
              <div className="text-white text-xl sm:text-2xl font-semibold">{s.value}</div>
              <div className="text-slate-400 text-[10px] uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {([
          ['today',       t('filter.today')],
          ['all',         t('filter.all')],
          ['group',       t('filter.groupStage')],
          ['knockout',    t('filter.knockout')],
        ] as [string, string][]).map(([key, label], i) => (
          <button
            key={key}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${
              i === 0
                ? 'bg-red-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Match list grouped by stage */}
      {STAGE_ORDER.map(stageKey => {
        const matches = grouped[stageKey];
        if (!matches?.length) return null;
        return (
          <section key={stageKey} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-semibold text-slate-700 shrink-0">
                {stageLabel(stageKey, t as ReturnType<typeof useTranslations>)}
              </h2>
              <span className="text-xs text-slate-400">({matches.length})</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matches.map(match => (
                <MatchCard key={match.match_id} match={match} status="upcoming" />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
