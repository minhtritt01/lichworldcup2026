'use client';

import { useLocale } from 'next-intl';
import type { ParsedReport } from '../../lib/report-types';
import { getFlag } from '../../lib/flag-map';
import StatsBar from './StatsBar';
import MotmCard from './MotmCard';
import GroupStandingsCard from './GroupStandingsCard';
import SmartLink from '../SmartLink';

interface Props {
  report: ParsedReport;
}

export default function PostMatchReport({ report }: Props) {
  const locale = useLocale() as 'vi' | 'en';
  const { meta, htmlContent, postMatchData: d } = report;

  const homeFlag = getFlag(meta.homeSlug);
  const awayFlag = getFlag(meta.awaySlug);

  return (
    <div className="space-y-5">

      {/* Score hero */}
      <div className="bg-slate-900 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-center flex-1">
            <span className="text-4xl sm:text-5xl block mb-2">{homeFlag}</span>
            <span className="text-sm font-semibold text-white">{meta.homeTeam}</span>
          </div>
          <div className="text-center px-3">
            <p className="text-3xl sm:text-4xl font-semibold text-white tabular-nums tracking-wider">
              {d?.score?.home ?? '?'} – {d?.score?.away ?? '?'}
            </p>
            {d?.penalties && (
              <p className="text-[11px] font-medium text-amber-400 mt-1 tabular-nums">
                {locale === 'vi'
                  ? `Luân lưu ${d.penalties.home}–${d.penalties.away}`
                  : `${d.penalties.home}–${d.penalties.away} on penalties`}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              {d?.penalties
                ? locale === 'vi' ? 'Sau loạt luân lưu' : 'After penalties'
                : locale === 'vi' ? 'Kết thúc' : 'Full time'}
            </p>
          </div>
          <div className="text-center flex-1">
            <span className="text-4xl sm:text-5xl block mb-2">{awayFlag}</span>
            <span className="text-sm font-semibold text-white">{meta.awayTeam}</span>
          </div>
        </div>
      </div>

      {/* Goals timeline */}
      {d?.goals && d.goals.length > 0 && (
        <div className="space-y-1.5">
          {d.goals.map((g, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <span className="text-xs text-slate-400 tabular-nums w-7 text-right shrink-0">{g.minute}</span>
              <span className="text-base leading-none">
                {g.isOwnGoal ? '⚽🔴' : g.isPenalty ? '⚽(P)' : '⚽'}
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-100">{g.player}</span>
              <span className="text-xs text-slate-400 truncate">{g.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {d?.stats && d.stats.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {locale === 'vi' ? '📊 Thống kê trận đấu' : '📊 Match statistics'}
            </p>
          </div>
          <div className="px-4 py-3 space-y-3">
            {d.stats.map((s, i) => (
              <StatsBar
                key={i}
                label={locale === 'vi' ? s.labelVi : s.label}
                homeValue={s.home}
                awayValue={s.away}
                homePercent={s.homePercent ?? 50}
              />
            ))}
          </div>
        </div>
      )}

      {/* Analysis */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          {locale === 'vi' ? '⚔️ Phân tích chiến thuật' : '⚔️ Tactical analysis'}
        </p>
        <article
          className="prose prose-slate dark:prose-invert max-w-none prose-sm
            prose-p:text-sm prose-p:leading-relaxed prose-p:text-slate-600 prose-p:dark:text-slate-300
            prose-strong:text-slate-800 prose-strong:dark:text-slate-100
            prose-blockquote:border-l-amber-500 prose-blockquote:bg-amber-50 prose-blockquote:dark:bg-amber-950/20
            prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {/* Turning point */}
      {d?.turningPoint && (
        <div className="border-l-[3px] border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-r-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
            ⚡ {locale === 'vi' ? 'Bước ngoặt trận đấu' : 'The turning point'}
          </p>
          <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>{d.turningPoint.minute}</strong> — {d.turningPoint.description}
          </p>
        </div>
      )}

      {/* MOTM */}
      {d?.motm && (
        <MotmCard
          name={d.motm.name}
          rating={d.motm.rating}
          metrics={d.motm.metrics}
          reason={d.motm.reason}
        />
      )}

      {/* Group standings */}
      {d?.standings && d.standings.length > 0 && (
        <GroupStandingsCard
          groupName={meta.stage}
          rows={d.standings}
        />
      )}

      {/* Next matches */}
      {d?.nextMatches && d.nextMatches.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {locale === 'vi' ? 'Trận tiếp theo' : "What's next"}
          </p>
          <div className="space-y-2">
            {d.nextMatches.map((nm, i) => (
              <SmartLink
                key={i}
                href={`/live/${nm.matchId}`}
                className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <span className="text-xs text-slate-400 shrink-0 w-14">{nm.date}</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-100">
                  {nm.homeFlag} {nm.homeTeam} vs {nm.awayTeam} {nm.awayFlag}
                </span>
                <span className="text-xs font-semibold text-red-500">{locale === 'vi' ? 'Xem →' : 'View →'}</span>
              </SmartLink>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <SmartLink
        href={`/live/${meta.matchId}`}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition"
      >
        ⚽ {locale === 'vi' ? 'Xem trang trận đấu' : 'View match page'}
      </SmartLink>
    </div>
  );
}
