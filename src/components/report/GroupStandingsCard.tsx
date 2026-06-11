'use client';

import type { StandingRow } from '../../lib/report-types';
import SmartLink from '../SmartLink';
import { useLocale } from 'next-intl';

interface Props {
  groupName: string;
  rows: StandingRow[];
}

export default function GroupStandingsCard({ groupName, rows }: Props) {
  const locale = useLocale();

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden my-4">
      <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {locale === 'vi' ? `Bảng xếp hạng ${groupName}` : `${groupName} standings`}
        </p>
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-800/50">
            <th className="w-7 px-2 py-1.5 text-left text-[10px] font-semibold text-slate-400">#</th>
            <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-slate-400">
              {locale === 'vi' ? 'Đội' : 'Team'}
            </th>
            <th className="w-7 px-1 py-1.5 text-center text-[10px] font-semibold text-slate-400">P</th>
            <th className="w-7 px-1 py-1.5 text-center text-[10px] font-semibold text-slate-400">W</th>
            <th className="w-7 px-1 py-1.5 text-center text-[10px] font-semibold text-slate-400">D</th>
            <th className="w-7 px-1 py-1.5 text-center text-[10px] font-semibold text-slate-400">L</th>
            <th className="w-8 px-1 py-1.5 text-center text-[10px] font-semibold text-slate-400">GD</th>
            <th className="w-8 px-2 py-1.5 text-right text-[10px] font-semibold text-slate-400">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr
              key={r.slug}
              className={`border-t border-slate-100 dark:border-slate-700 ${
                r.highlight ? 'bg-green-50/50 dark:bg-green-950/10' : ''
              }`}
            >
              <td className="px-2 py-2 font-medium text-slate-500">{r.pos}</td>
              <td className="px-2 py-2">
                <SmartLink href={`/teams/${r.slug}`} className="flex items-center gap-1.5 hover:underline">
                  <span>{r.flag}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{r.team}</span>
                </SmartLink>
              </td>
              <td className="px-1 py-2 text-center text-slate-500">{r.played}</td>
              <td className="px-1 py-2 text-center text-slate-500">{r.won}</td>
              <td className="px-1 py-2 text-center text-slate-500">{r.drawn}</td>
              <td className="px-1 py-2 text-center text-slate-500">{r.lost}</td>
              <td className={`px-1 py-2 text-center font-medium ${
                r.gd > 0 ? 'text-green-600' : r.gd < 0 ? 'text-red-500' : 'text-slate-400'
              }`}>
                {r.gd > 0 ? `+${r.gd}` : r.gd}
              </td>
              <td className="px-2 py-2 text-right font-semibold text-slate-800 dark:text-slate-100">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
