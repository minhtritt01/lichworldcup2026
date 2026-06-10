import { useTranslations, useLocale } from 'next-intl';
import { type MockMatch } from '../lib/mock-data';
import { getTeamName } from '../lib/team-names';
import { getFlag } from '../lib/flag-map';

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

  const href = locale === 'en' ? `/en/live/${match.match_id}` : `/live/${match.match_id}`;

  const isLive = status === 'live';
  const isFinished = status === 'finished';

  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-shadow ${
        isLive
          ? 'border-red-500 shadow-sm'
          : isFinished
          ? 'border-slate-200 bg-slate-50 opacity-80'
          : 'border-slate-200 bg-white hover:shadow-md'
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
            <span className="bg-red-50 text-red-600 text-[10px] font-semibold px-2 py-0.5 rounded-sm">
              {t('status.live')} {currentMinute}&apos;
            </span>
          ) : isFinished ? (
            <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-sm border border-slate-200">
              {t('status.finished')}
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-sm">
              {t('match.kickoff')}: {kickoffVN}
            </span>
          )}
          <span className="text-slate-400 text-[11px] truncate hidden sm:block">
            {match.stadium}, {match.city}
          </span>
        </div>

        {/* Teams + score */}
        <div className="flex items-center justify-between gap-3">
          {/* Home */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl sm:text-3xl leading-none">{homeFlag}</span>
            <span className="font-semibold text-sm sm:text-base text-slate-800 truncate">
              {homeName}
            </span>
          </div>

          {/* Score / VS */}
          <div className="shrink-0 text-center">
            {isLive || isFinished ? (
              <span className="text-xl sm:text-2xl font-semibold tabular-nums text-slate-900">
                {score?.home ?? 0} – {score?.away ?? 0}
              </span>
            ) : (
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-md font-medium">
                VS
              </span>
            )}
          </div>

          {/* Away */}
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="font-semibold text-sm sm:text-base text-slate-800 truncate text-right">
              {awayName}
            </span>
            <span className="text-2xl sm:text-3xl leading-none">{awayFlag}</span>
          </div>
        </div>

        {/* Last event + CTA */}
        {(lastEvent || !isFinished) && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
            <span className={`text-[11px] truncate max-w-[60%] ${isLive ? 'text-red-500' : 'text-slate-400'}`}>
              {lastEvent ?? `📍 ${match.city}`}
            </span>
            <a
              href={href}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                isLive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : isFinished
                  ? 'border border-slate-300 text-slate-500 hover:bg-slate-50'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isLive
                ? t('match.watchLive')
                : isFinished
                ? t('match.summary')
                : t('match.details')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
