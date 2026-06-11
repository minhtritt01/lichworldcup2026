'use client';

import { useLocale } from 'next-intl';
import type { Player, TeamData } from '../lib/teams-data';

interface Props { team: TeamData; }

const POS_ORDER: Player['pos'][] = ['GK', 'DF', 'MF', 'FW'];
const POS_LABEL: Record<Player['pos'], { vi: string; en: string }> = {
  GK: { vi: 'Thủ môn', en: 'Goalkeepers' },
  DF: { vi: 'Hậu vệ', en: 'Defenders' },
  MF: { vi: 'Tiền vệ', en: 'Midfielders' },
  FW: { vi: 'Tiền đạo', en: 'Forwards' },
};

export default function SquadTable({ team }: Props) {
  const locale = useLocale() as 'vi' | 'en';

  return (
    <div className="space-y-6">
      {POS_ORDER.map(pos => {
        const players = team.players.filter(p => p.pos === pos);
        if (!players.length) return null;
        const label = POS_LABEL[pos][locale];

        return (
          <div key={pos}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800">
                    <th className="w-10 px-3 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase">#</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase">
                      {locale === 'vi' ? 'Cầu thủ' : 'Player'}
                    </th>
                    <th className="w-16 px-3 py-2 text-center text-[10px] font-semibold text-slate-400 uppercase">
                      {locale === 'vi' ? 'Tuổi' : 'Age'}
                    </th>
                    <th className="w-16 px-3 py-2 text-center text-[10px] font-semibold text-slate-400 uppercase">Caps</th>
                    <th className="w-12 px-3 py-2 text-center text-[10px] font-semibold text-slate-400 uppercase">
                      {locale === 'vi' ? 'Bàn' : 'Gls'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, i) => (
                    <tr
                      key={p.no}
                      className={`border-t border-slate-100 dark:border-slate-700 ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/40' : ''}`}
                    >
                      <td className="px-3 py-2.5 text-slate-400 text-xs font-medium">{p.no || '—'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{p.name}</span>
                          {p.captain && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">C</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.club}</p>
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-500 text-xs">{p.age}</td>
                      <td className="px-3 py-2.5 text-center text-slate-500 text-xs">{p.caps}</td>
                      <td className="px-3 py-2.5 text-center text-slate-500 text-xs">{p.goals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
