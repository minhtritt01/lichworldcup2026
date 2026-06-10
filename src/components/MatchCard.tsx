'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Star, StarOff } from 'lucide-react';
import { type MockMatch } from '../lib/mock-data';
import { getTeamName } from '../lib/team-names';
import { getFlag } from '../lib/flag-map';
import { useFavorites } from '../lib/hooks/useFavorites';
import SmartLink from './SmartLink';

interface Props {
  match: MockMatch;
  status?: 'live' | 'upcoming' | 'finished';
  score?: { home: number; away: number };
  currentMinute?: number;
  lastEvent?: string;
}

export default function MatchCard({
  match,
  status = 'upcoming',
  score,
  currentMinute,
  lastEvent,
}: Props) {
  const t = useTranslations();
  const locale = useLocale() as 'vi' | 'en';
  const { toggleFavorite, isFavorite } = useFavorites();

  const isHomeFav = isFavorite(match.home_slug);
  const isAwayFav = isFavorite(match.away_slug);

  const homeName = getTeamName(match.home_slug, locale);
  const awayName = getTeamName(match.away_slug, locale);
  const homeFlag = getFlag(match.home_slug);
  const awayFlag = getFlag(match.away_slug);

  const kickoffVN = new Date(match.kickoff_utc).toLocaleString(
    locale === 'vi' ? 'vi-VN' : 'en-US',
    {
      timeZone: 'Asia/Ho_Chi_Minh',
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const href = `/live/${match.match_id}`;

  const isLive = status === 'live';
  const isFinished = status === 'finished';

  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-all duration-200 ${
        isLive
          ? 'border-red-500 dark:border-red-500 shadow-sm'
          : isFinished
          ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-85'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md dark:hover:shadow-slate-950/30'
      }`}
    >
      {/* Live accent bar */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500" />
      )}

      <div className="p-3 sm:p-4">
        {/* Status + venue row */}
        <div className="flex items-center gap-2 mb-3">
          {isLive ? (
            <span className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-semibold px-2 py-0.5 rounded-sm">
              {t('status.live')} {currentMinute}&apos;
            </span>
          ) : isFinished ? (
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-sm border border-slate-200 dark:border-slate-700">
              {t('status.finished')}
            </span>
          ) : (
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-sm">
              {t('match.kickoff')}: {kickoffVN}
            </span>
          )}
          <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate hidden sm:block">
            {match.stadium}, {match.city}
          </span>
        </div>

        {/* Teams + score */}
        <div className="flex items-center justify-between gap-3">
          {/* Home */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(match.home_slug);
              }}
              className="shrink-0 focus:outline-none p-0.5 text-slate-300 dark:text-slate-700 hover:text-yellow-400 dark:hover:text-yellow-500 transition-colors"
              title={isHomeFav ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={isHomeFav}
              aria-label={isHomeFav ? 'Remove home team from favorites' : 'Add home team to favorites'}
            >
              {isHomeFav ? <Star size={14} className="fill-current text-yellow-400" /> : <StarOff size={14} />}
            </button>
            <span className="text-2xl sm:text-3xl leading-none">{homeFlag}</span>
            <span className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate">
              {homeName}
            </span>
          </div>

          {/* Score / VS */}
          <div className="shrink-0 text-center">
            {isLive || isFinished ? (
              <span className="text-xl sm:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                {score?.home ?? 0} – {score?.away ?? 0}
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md font-medium">
                VS
              </span>
            )}
          </div>

          {/* Away */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <span className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate text-right">
              {awayName}
            </span>
            <span className="text-2xl sm:text-3xl leading-none">{awayFlag}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(match.away_slug);
              }}
              className="shrink-0 focus:outline-none p-0.5 text-slate-300 dark:text-slate-700 hover:text-yellow-400 dark:hover:text-yellow-500 transition-colors"
              title={isAwayFav ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={isAwayFav}
              aria-label={isAwayFav ? 'Remove away team from favorites' : 'Add away team to favorites'}
            >
              {isAwayFav ? <Star size={14} className="fill-current text-yellow-400" /> : <StarOff size={14} />}
            </button>
          </div>
        </div>

        {/* Last event + CTA */}
        {(lastEvent || !isFinished) && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <span className={`text-[11px] truncate max-w-[60%] ${isLive ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {lastEvent ?? `📍 ${match.city}`}
            </span>
            <SmartLink
              href={href}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                isLive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : isFinished
                  ? 'border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {isLive
                ? t('match.watchLive')
                : isFinished
                ? t('match.summary')
                : t('match.details')}
            </SmartLink>
          </div>
        )}
      </div>
    </div>
  );
}
