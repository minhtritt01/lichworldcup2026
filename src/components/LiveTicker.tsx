'use client';

import { useTranslations, useLocale } from 'next-intl';
import { MOCK_MATCHES } from '../lib/mock-data';
import { getTeamName } from '../lib/team-names';

export default function LiveTicker() {
  const t = useTranslations('status');
  const locale = useLocale() as 'vi' | 'en';
  const now = Date.now();

  const tickerMatches = MOCK_MATCHES.filter(m => {
    const ms = new Date(m.kickoff_utc).getTime();
    const elapsed = (now - ms) / 60000;
    return elapsed >= 0 && elapsed < 120;
  }).slice(0, 5);

  const upcomingMatches = MOCK_MATCHES.filter(m => {
    const ms = new Date(m.kickoff_utc).getTime();
    return ms > now;
  }).slice(0, 4);

  const display = [...tickerMatches, ...upcomingMatches].slice(0, 6);
  if (display.length === 0) return null;

  return (
    <div className="bg-slate-800 border-b border-slate-700 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-5 py-1.5 overflow-x-auto scrollbar-none">
          {display.map(m => {
            const ms = new Date(m.kickoff_utc).getTime();
            const elapsed = Math.floor((now - ms) / 60000);
            const isLive = elapsed >= 0 && elapsed < 120;
            const homeName = getTeamName(m.home_slug, locale);
            const awayName = getTeamName(m.away_slug, locale);

            return (
              <a
                key={m.match_id}
                href={locale === 'en' ? `/en/live/${m.match_id}` : `/live/${m.match_id}`}
                className="flex items-center gap-2 whitespace-nowrap text-xs shrink-0 hover:opacity-80 transition"
              >
                {isLive ? (
                  <span className="bg-red-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                    {t('live')}
                  </span>
                ) : (
                  <span className="text-slate-500 text-[10px]">
                    {new Date(m.kickoff_utc).toLocaleTimeString(
                      locale === 'vi' ? 'vi-VN' : 'en-US',
                      { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }
                    )}
                  </span>
                )}
                <span className="text-slate-200 font-medium">{homeName}</span>
                {isLive ? (
                  <span className="text-red-400 font-semibold">0–0</span>
                ) : (
                  <span className="text-slate-500">vs</span>
                )}
                <span className="text-slate-200 font-medium">{awayName}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
