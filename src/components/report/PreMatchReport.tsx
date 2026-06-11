'use client';

import { useLocale } from 'next-intl';
import type { ParsedReport } from '../../lib/report-types';
import { getFlag } from '../../lib/flag-map';
import FormBadges from './FormBadges';
import XFactorCard from './XFactorCard';
import SmartLink from '../SmartLink';

interface Props {
  report: ParsedReport;
}

export default function PreMatchReport({ report }: Props) {
  const locale = useLocale() as 'vi' | 'en';
  const { meta, htmlContent, preMatchData } = report;
  const d = preMatchData;

  const homeFlag = getFlag(meta.homeSlug);
  const awayFlag = getFlag(meta.awaySlug);

  return (
    <div className="space-y-5">

      {/* Match at a glance */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {locale === 'vi' ? 'Tổng quan trận đấu' : 'Match at a glance'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-5 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className="text-center flex-1">
            <span className="text-4xl leading-none block mb-2">{homeFlag}</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{meta.homeTeam}</span>
          </div>
          <div className="text-center px-3">
            <p className="text-[10px] text-slate-400 mb-0.5">
              {locale === 'vi' ? 'Giờ VN' : 'Kickoff ICT'}
            </p>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {new Date(meta.kickoff).toLocaleTimeString(
                locale === 'vi' ? 'vi-VN' : 'en-US',
                { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }
              )}
            </p>
          </div>
          <div className="text-center flex-1">
            <span className="text-4xl leading-none block mb-2">{awayFlag}</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{meta.awayTeam}</span>
          </div>
        </div>

        <div className="text-sm divide-y divide-slate-100 dark:divide-slate-700">
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-slate-400 text-xs">🏟️ {locale === 'vi' ? 'Sân' : 'Venue'}</span>
            <span className="text-slate-700 dark:text-slate-200 text-xs">{meta.stadium}</span>
          </div>
          {meta.referee && (
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-slate-400 text-xs">🧑‍⚖️ {locale === 'vi' ? 'Trọng tài' : 'Referee'}</span>
              <span className="text-slate-700 dark:text-slate-200 text-xs">{meta.referee}</span>
            </div>
          )}
          {d?.odds && (
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-slate-400 text-xs">📊 {locale === 'vi' ? 'Tỉ lệ' : 'Odds'}</span>
              <span className="text-slate-700 dark:text-slate-200 text-xs">
                {locale === 'vi' ? 'Nhà' : 'Home'} {d.odds.home}% · {locale === 'vi' ? 'Hòa' : 'Draw'} {d.odds.draw}% · {locale === 'vi' ? 'Khách' : 'Away'} {d.odds.away}%
              </span>
            </div>
          )}
          {d?.weather && (
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-slate-400 text-xs">🌤️ {locale === 'vi' ? 'Thời tiết' : 'Weather'}</span>
              <span className="text-slate-700 dark:text-slate-200 text-xs">
                {d.weather.temp} · {d.weather.condition}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      {d?.form && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {locale === 'vi' ? 'Phong độ gần đây (5 trận)' : 'Recent form (last 5)'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormBadges form={d.form.home} teamName={meta.homeTeam} flag={homeFlag} />
            <FormBadges form={d.form.away} teamName={meta.awayTeam} flag={awayFlag} />
          </div>
        </div>
      )}

      {/* Lineups */}
      {d?.lineups && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {locale === 'vi' ? 'Đội hình dự kiến' : 'Predicted lineups'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { team: meta.homeTeam, flag: homeFlag, lineup: d.lineups.home },
              { team: meta.awayTeam, flag: awayFlag, lineup: d.lineups.away },
            ].map(side => (
              <div key={side.team} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  {side.flag} {side.team} ({side.lineup.formation})
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {side.lineup.players.map((p, i) => (
                    <span key={i}>
                      {i > 0 && ' · '}
                      <span className="text-[9px] text-slate-400">{p.position}</span>{' '}
                      <span className={p.captain ? 'font-semibold text-slate-800 dark:text-slate-100' : ''}>
                        {p.name}{p.captain ? ' (C)' : ''}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis */}
      <article
        className="prose prose-slate dark:prose-invert max-w-none prose-sm
          prose-h2:text-base prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-2
          prose-h3:text-sm prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2
          prose-p:text-sm prose-p:leading-relaxed prose-p:text-slate-600 prose-p:dark:text-slate-300
          prose-table:text-xs
          prose-th:bg-slate-50 prose-th:dark:bg-slate-800 prose-th:px-3 prose-th:py-2
          prose-td:px-3 prose-td:py-2
          prose-blockquote:border-l-red-500 prose-blockquote:bg-red-50 prose-blockquote:dark:bg-red-950/20
          prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl
          prose-strong:text-slate-800 prose-strong:dark:text-slate-100"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* X-Factor */}
      {d?.xFactor && (
        <XFactorCard name={d.xFactor.name} reason={d.xFactor.reason} />
      )}

      {/* Prediction */}
      {d?.prediction && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {locale === 'vi' ? 'Dự đoán tỉ số' : 'Score prediction'}
          </p>
          <div className="flex items-center justify-center gap-5">
            <div className="text-center">
              <span className="text-3xl block mb-1">{homeFlag}</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{meta.homeTeam}</span>
            </div>
            <span className="text-3xl font-semibold text-slate-800 dark:text-slate-100 tabular-nums tracking-wider">
              {d.prediction.home} – {d.prediction.away}
            </span>
            <div className="text-center">
              <span className="text-3xl block mb-1">{awayFlag}</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{meta.awayTeam}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 max-w-md mx-auto">{d.prediction.reasoning}</p>
        </div>
      )}

      {/* CTA */}
      <SmartLink
        href={`/live/${meta.matchId}`}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition"
      >
        ⚽ {locale === 'vi' ? 'Xem trực tiếp trận đấu' : 'Follow this match live'}
      </SmartLink>
    </div>
  );
}
