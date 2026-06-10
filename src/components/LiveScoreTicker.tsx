'use client';

import useSWR from 'swr';
import { useTranslations, useLocale } from 'next-intl';
import { Timer, Wifi, WifiOff } from 'lucide-react';
import { getTeamName } from '../lib/team-names';
import { getFlag } from '../lib/flag-map';

const CDN_BASE = process.env.NEXT_PUBLIC_CDN_BASE ?? 'https://cdn.worldcup2026live.vn';

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('CDN miss');
    return r.json();
  });

interface Props {
  matchId: string;
  initialStaticData: Record<string, unknown>;
}

export default function LiveScoreTicker({ matchId, initialStaticData }: Props) {
  const t = useTranslations();
  const locale = useLocale() as 'vi' | 'en';

  const { data, error, isValidating } = useSWR(
    `${CDN_BASE}/live/${matchId}.json`,
    fetcher,
    { fallbackData: initialStaticData, refreshInterval: 15000, dedupingInterval: 5000 }
  );

  if (!data) {
    return (
      <div className="w-full p-8 rounded-2xl bg-slate-900 text-white text-center animate-pulse">
        {locale === 'vi' ? 'Đang tải...' : 'Loading...'}
      </div>
    );
  }

  const isLive = data.status === 'In_Play';
  const isHT = data.status === 'Half_Time';

  const statusLabel: Record<string, string> = {
    Scheduled: t('status.upcoming'),
    In_Play:   t('status.live'),
    Half_Time: t('status.halfTime'),
    Finished:  t('status.finished'),
    Postponed: t('status.postponed'),
  };

  const homeName = getTeamName(data.home_team?.slug ?? '', locale);
  const awayName = getTeamName(data.away_team?.slug ?? '', locale);
  const homeFlag = getFlag(data.home_team?.slug ?? '');
  const awayFlag = getFlag(data.away_team?.slug ?? '');

  const progressPct = isLive
    ? Math.min(100, ((data.current_minute ?? 0) / 90) * 100)
    : isHT ? 50 : data.status === 'Finished' ? 100 : 0;

  return (
    <div className="w-full rounded-2xl bg-slate-900 text-white overflow-hidden shadow-xl">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
            isLive || isHT ? 'bg-red-600 animate-pulse' : 'bg-slate-700'
          }`}
        >
          {statusLabel[data.status] ?? data.status}
          {isLive && ` · ${data.current_minute}'`}
        </span>
        <span className="text-slate-400 text-xs">{data.stage}</span>
        {isValidating
          ? <Wifi size={13} className="text-green-400 animate-pulse" />
          : error
          ? <WifiOff size={13} className="text-red-400" />
          : <Wifi size={13} className="text-slate-700" />}
      </div>

      {/* Scoreboard */}
      <div className="flex items-center justify-between px-6 py-4 gap-3">
        {/* Home */}
        <div className="flex flex-col items-center flex-1 gap-2">
          <span className="text-4xl sm:text-5xl leading-none">{homeFlag}</span>
          <span className="text-sm font-semibold text-center leading-tight">{homeName}</span>
          <span className="text-[10px] text-slate-400">{t('match.home')}</span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center shrink-0 gap-1">
          <div className="text-4xl sm:text-5xl font-semibold tabular-nums tracking-tight">
            {data.home_team?.score ?? 0}
            <span className="text-slate-500 mx-1">–</span>
            {data.away_team?.score ?? 0}
          </div>
          {(isLive || isHT) && (
            <div className="flex items-center gap-1 text-red-400 text-xs font-medium">
              <Timer size={11} />
              <span>
                {isHT ? t('match.halfTime') : `${data.current_minute}'`}
              </span>
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center flex-1 gap-2">
          <span className="text-4xl sm:text-5xl leading-none">{awayFlag}</span>
          <span className="text-sm font-semibold text-center leading-tight">{awayName}</span>
          <span className="text-[10px] text-slate-400">{t('match.away')}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-5 mb-1 bg-slate-700 rounded-full h-1 overflow-hidden">
        <div
          className="bg-red-500 h-full rounded-full transition-all duration-1000"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="flex justify-between px-5 mb-4 text-[10px] text-slate-500">
        <span>0&apos;</span>
        <span>{isHT ? t('match.halfTime') : isLive ? t('match.firstHalf') : ''}</span>
        <span>90&apos;</span>
      </div>

      {/* Stadium */}
      <p className="text-center text-xs text-slate-400 pb-3">{data.stadium}</p>

      {/* Incidents */}
      {data.incidents?.length > 0 && (
        <div className="border-t border-slate-700 px-5 py-3 space-y-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {t('match.incidents')}
          </p>
          {data.incidents.map((inc: Record<string, unknown>, i: number) => {
            const icon =
              inc.type === 'Goal' || inc.type === 'PenaltyGoal' ? '⚽'
              : inc.type === 'OwnGoal' ? '⚽🔴'
              : inc.type === 'YellowCard' ? '🟨'
              : inc.type === 'RedCard' ? '🟥'
              : '↕️';
            return (
              <div key={String(inc.incident_id ?? i)} className="flex items-center gap-3 text-xs">
                <span className="text-slate-500 tabular-nums w-7 text-right">{String(inc.time_minute)}&apos;</span>
                <span>{icon}</span>
                <span className="text-slate-200">{String(inc.player_name)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
