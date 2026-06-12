'use client';

import { useTranslations, useLocale } from 'next-intl';
import { getTeamName } from '../lib/team-names';
import { getFlag } from '../lib/flag-map';
import { Timer } from 'lucide-react';

interface Incident {
  incident_id: number;
  type: string;
  player_name: string;
  time_minute: number;
  team_slug: string;
}

interface TeamData {
  slug: string;
  name: string;
  name_vi: string;
  score: number;
}

interface MatchData {
  status: string;
  stage: string;
  current_minute: number;
  stadium: string;
  kickoff_time: string;
  home_team: TeamData;
  away_team: TeamData;
  incidents: Incident[];
}

interface Props {
  matchId: string;
  initialStaticData: MatchData;
}

export default function LiveScoreTicker({ initialStaticData: data }: Props) {
  const t = useTranslations();
  const locale = useLocale() as 'vi' | 'en';

  const isLive     = data.status === 'In_Play';
  const isHT       = data.status === 'Half_Time';
  const isFinished = data.status === 'Finished';

  const statusLabel: Record<string, string> = {
    Scheduled:  t('status.upcoming'),
    In_Play:    t('status.live'),
    Half_Time:  t('status.halfTime'),
    Finished:   t('status.finished'),
    Postponed:  t('status.postponed'),
  };

  const homeName = getTeamName(data.home_team.slug, locale);
  const awayName = getTeamName(data.away_team.slug, locale);
  const homeFlag = getFlag(data.home_team.slug);
  const awayFlag = getFlag(data.away_team.slug);

  const progressPct = isFinished ? 100 : isHT ? 50 : isLive
    ? Math.min(100, ((data.current_minute ?? 0) / 90) * 100)
    : 0;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
            isLive || isHT
              ? 'bg-red-600 text-white animate-pulse'
              : isFinished
              ? 'bg-slate-700 text-white dark:bg-slate-600'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {statusLabel[data.status] ?? data.status}
          {isLive && ` · ${data.current_minute}'`}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{data.stage}</span>
      </div>

      {/* Scoreboard */}
      <div className="flex items-center justify-between px-6 py-4 gap-3">
        <div className="flex flex-col items-center flex-1 gap-2">
          <span className="text-4xl sm:text-5xl leading-none">{homeFlag}</span>
          <span className="text-sm font-semibold text-center leading-tight">{homeName}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('match.home')}</span>
        </div>

        <div className="flex flex-col items-center shrink-0 gap-1">
          <div className="text-4xl sm:text-5xl font-semibold tabular-nums tracking-tight">
            {data.home_team.score}
            <span className="mx-1 text-slate-400 dark:text-slate-500">–</span>
            {data.away_team.score}
          </div>
          {(isLive || isHT) && (
            <div className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400">
              <Timer size={11} />
              <span>{isHT ? t('match.halfTime') : `${data.current_minute}'`}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center flex-1 gap-2">
          <span className="text-4xl sm:text-5xl leading-none">{awayFlag}</span>
          <span className="text-sm font-semibold text-center leading-tight">{awayName}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('match.away')}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-5 mb-1 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="bg-red-500 h-full rounded-full transition-all duration-1000"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="flex justify-between px-5 mb-4 text-[10px] text-slate-500 dark:text-slate-500">
        <span>0&apos;</span>
        <span>{isHT ? t('match.halfTime') : isLive ? t('match.firstHalf') : ''}</span>
        <span>90&apos;</span>
      </div>

      <p className="pb-3 text-center text-xs text-slate-500 dark:text-slate-400">{data.stadium}</p>

      {/* Incidents */}
      {data.incidents?.length > 0 && (
        <div className="space-y-2 border-t border-slate-200 px-5 py-3 dark:border-slate-800">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('match.incidents')}
          </p>
          {data.incidents.map((inc, i) => {
            const icon =
              inc.type === 'Goal' || inc.type === 'PenaltyGoal' ? '⚽'
              : inc.type === 'OwnGoal'    ? '⚽🔴'
              : inc.type === 'YellowCard' ? '🟨'
              : inc.type === 'RedCard'    ? '🟥'
              : '↕️';
            return (
              <div key={inc.incident_id ?? i} className="flex items-center gap-3 text-xs">
                <span className="w-7 tabular-nums text-right text-slate-500 dark:text-slate-400">
                  {inc.time_minute}&apos;
                </span>
                <span>{icon}</span>
                <span className="text-slate-700 dark:text-slate-200">{inc.player_name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
