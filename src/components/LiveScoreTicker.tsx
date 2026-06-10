'use client';

import useSWR from 'swr';
import { Timer, Wifi, WifiOff } from 'lucide-react';

const CDN_BASE = process.env.NEXT_PUBLIC_CDN_BASE ?? 'https://cdn.lichworldcup2026.vn';

const staticCdnFetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('CDN Cache Miss');
    return res.json();
  });

interface Props {
  matchId: string;
  initialStaticData: Record<string, unknown>;
}

export default function LiveScoreTicker({ matchId, initialStaticData }: Props) {
  const { data, error, isValidating } = useSWR(
    `${CDN_BASE}/live/${matchId}.json`,
    staticCdnFetcher,
    {
      fallbackData: initialStaticData,
      refreshInterval: 15000,
      dedupingInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  if (!data) {
    return (
      <div className="w-full p-8 rounded-2xl bg-slate-900 text-white animate-pulse text-center">
        Đang tải dữ liệu trận đấu...
      </div>
    );
  }

  const isLive = data.status === 'In_Play' || data.status === 'Half_Time';

  const statusLabel: Record<string, string> = {
    Scheduled: 'Sắp diễn ra',
    In_Play: 'ĐANG DIỄN RA',
    Half_Time: 'NGHỈ GIỮA HIỆP',
    Finished: 'KẾT THÚC',
    Postponed: 'HOÃN',
  };

  return (
    <div className="w-full p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white shadow-2xl border border-slate-700">
      {/* Status bar */}
      <div className="flex justify-between items-center mb-4">
        <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full ${isLive ? 'bg-red-600 animate-pulse' : 'bg-slate-600'}`}>
          {statusLabel[data.status] ?? data.status}
        </span>
        <span className="text-xs text-slate-400">{data.stage}</span>
        {isValidating
          ? <Wifi size={14} className="text-green-400 animate-pulse" />
          : error
            ? <WifiOff size={14} className="text-red-400" />
            : <Wifi size={14} className="text-slate-600" />
        }
      </div>

      {/* Scoreboard */}
      <div className="flex justify-between items-center max-w-xl mx-auto">
        <div className="w-2/5 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-2 flex items-center justify-center font-black text-xl border-2 border-slate-500">
            {data.home_team?.team_id?.substring(0, 3) ?? 'HM'}
          </div>
          <p className="font-bold text-sm leading-tight">{data.home_team?.name_vi ?? data.home_team?.name}</p>
        </div>

        <div className="w-1/5 text-center">
          <div className="text-4xl font-black tabular-nums">
            {data.home_team?.score ?? 0} - {data.away_team?.score ?? 0}
          </div>
          {isLive && (
            <div className="flex items-center justify-center gap-1 mt-1 text-red-400 text-xs font-semibold">
              <Timer size={12} />
              <span>{data.current_minute}&apos;</span>
            </div>
          )}
        </div>

        <div className="w-2/5 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-2 flex items-center justify-center font-black text-xl border-2 border-slate-500">
            {data.away_team?.team_id?.substring(0, 3) ?? 'AW'}
          </div>
          <p className="font-bold text-sm leading-tight">{data.away_team?.name_vi ?? data.away_team?.name}</p>
        </div>
      </div>

      {/* Stadium */}
      <p className="text-center text-xs text-slate-400 mt-4">{data.stadium}</p>

      {/* Incidents */}
      {data.incidents && data.incidents.length > 0 && (
        <div className="mt-4 border-t border-slate-700 pt-4 space-y-1">
          {data.incidents.map((inc: Record<string, unknown>, i: number) => (
            <div key={String(inc.incident_id ?? i)} className="text-xs text-slate-300 flex gap-2">
              <span className="text-slate-500 tabular-nums w-8">{String(inc.time_minute)}&apos;</span>
              <span>{String(inc.player_name)}</span>
              <span className="text-slate-500">{String(inc.type)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
