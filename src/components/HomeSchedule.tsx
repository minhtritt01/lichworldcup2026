'use client';

import { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { useFavorites } from '../lib/hooks/useFavorites';
import MatchCard from './MatchCard';
import type { MockMatch } from '../lib/mock-data';

interface StageGroup {
  key: string;
  label: string;
}

interface MatchStatus {
  status: 'upcoming' | 'finished' | 'live';
  score?: { home: number; away: number };
}

type FilterKey = 'today' | 'all' | 'group' | 'knockout';

interface Props {
  matches: MockMatch[];
  stageGroups: StageGroup[];
  favoritesTitle: string;
  favoritesEmpty: string;
  scheduleTitle: string;
  resultsTitle: string;
  matchStatuses?: Record<string, MatchStatus>;
  filterLabels: Record<FilterKey, string>;
  filterEmptyLabel: string;
}

function getStageGroup(stage: string, stageOrder: string[]): string {
  if (stage.startsWith('Vòng Bảng')) return 'Vòng Bảng';
  return stageOrder.find(item => stage.startsWith(item)) ?? stage;
}

export default function HomeSchedule({ matches, stageGroups, favoritesTitle, favoritesEmpty, scheduleTitle, resultsTitle, matchStatuses = {}, filterLabels, filterEmptyLabel }: Props) {
  const { favorites } = useFavorites();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('today');

  const filteredMatches = useMemo(() => {
    if (activeFilter === 'today') {
      const todayStr = new Date().toISOString().slice(0, 10);
      return matches.filter(m => m.kickoff_utc.slice(0, 10) === todayStr);
    }
    if (activeFilter === 'group') {
      return matches.filter(m => m.stage.startsWith('Vòng Bảng'));
    }
    if (activeFilter === 'knockout') {
      return matches.filter(m => !m.stage.startsWith('Vòng Bảng'));
    }
    return matches;
  }, [matches, activeFilter]);

  const finishedMatches = useMemo(
    () => filteredMatches.filter(m => matchStatuses[m.match_id]?.status === 'finished'),
    [filteredMatches, matchStatuses]
  );

  const { favoriteMatches, regularMatches } = useMemo(() => {
    const favoritesSet = new Set(favorites);
    const isFavoriteMatch = (match: MockMatch) => favoritesSet.has(match.home_slug) || favoritesSet.has(match.away_slug);

    const isFinished = (match: MockMatch) => matchStatuses[match.match_id]?.status === 'finished';

    return {
      favoriteMatches: filteredMatches.filter(isFavoriteMatch),
      regularMatches: filteredMatches.filter(match => !isFavoriteMatch(match) && !isFinished(match)),
    };
  }, [favorites, filteredMatches, matchStatuses]);

  const groupedMatches = useMemo(() => {
    const stageOrder = stageGroups.map(group => group.key);
    return regularMatches.reduce<Record<string, MockMatch[]>>((acc, match) => {
      const key = getStageGroup(match.stage, stageOrder);
      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    }, {});
  }, [regularMatches, stageGroups]);

  const filters: [FilterKey, string][] = [
    ['today', filterLabels.today],
    ['all', filterLabels.all],
    ['group', filterLabels.group],
    ['knockout', filterLabels.knockout],
  ];

  return (
    <div className="space-y-10">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFilter(key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeFilter === key
                ? 'bg-red-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {filterEmptyLabel}
        </p>
      )}
      {finishedMatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {resultsTitle}
            </h2>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs text-slate-500 dark:text-slate-400">{finishedMatches.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {finishedMatches.map(match => (
              <MatchCard key={match.match_id} match={match}
                status="finished"
                score={matchStatuses[match.match_id]?.score} />
            ))}
          </div>
        </section>
      )}

      {favoriteMatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {favoritesTitle}
            </h2>
            <Star size={14} className="text-yellow-500 fill-current" />
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {favoriteMatches.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favoriteMatches.map(match => (
              <MatchCard key={match.match_id} match={match}
                status={matchStatuses[match.match_id]?.status ?? 'upcoming'}
                score={matchStatuses[match.match_id]?.score} />
            ))}
          </div>
        </section>
      )}

      {favoriteMatches.length === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 p-5 text-sm text-slate-500 dark:text-slate-400">
          {favoritesEmpty}
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {scheduleTitle}
          </h2>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {stageGroups.map(group => {
          const matchesInStage = groupedMatches[group.key];
          if (!matchesInStage?.length) return null;

          return (
            <section key={group.key} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                  {group.label}
                </h3>
                <span className="text-xs text-slate-400">({matchesInStage.length})</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchesInStage.map(match => (
                  <MatchCard key={match.match_id} match={match}
                    status={matchStatuses[match.match_id]?.status ?? 'upcoming'}
                    score={matchStatuses[match.match_id]?.score} />
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}
