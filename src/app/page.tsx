import { MOCK_MATCHES } from '../lib/mock-data';

const STAGE_ORDER = [
  'Vòng Bảng',
  'Vòng 1/16',
  'Vòng 1/8',
  'Tứ Kết',
  'Bán Kết',
  'Tranh Hạng Ba',
  'Chung Kết',
];

function getStageGroup(stage: string): string {
  if (stage.startsWith('Vòng Bảng')) return 'Vòng Bảng';
  return STAGE_ORDER.find(s => stage.startsWith(s)) ?? stage;
}

export default function HomePage() {
  const groupedByStage = MOCK_MATCHES.reduce<Record<string, typeof MOCK_MATCHES>>(
    (acc, match) => {
      const key = getStageGroup(match.stage);
      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    },
    {}
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight sm:text-5xl">
          LỊCH THI ĐẤU WORLD CUP 2026
        </h1>
        <p className="mt-3 text-lg text-slate-500 font-medium">
          104 trận · 48 đội · 16 sân vận động · 11/06 – 19/07/2026
        </p>
      </header>

      {STAGE_ORDER.map(stageKey => {
        const matches = groupedByStage[stageKey];
        if (!matches || matches.length === 0) return null;
        return (
          <section key={stageKey} className="mb-12">
            <h2 className="text-xl font-black text-slate-700 mb-4 border-b-2 border-slate-200 pb-2">
              {stageKey} ({matches.length} trận)
            </h2>
            <div className="space-y-3">
              {matches.map(match => {
                const kickoffVN = new Date(match.kickoff_utc).toLocaleString('vi-VN', {
                  timeZone: 'Asia/Ho_Chi_Minh',
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={match.match_id}
                    className="p-5 border border-slate-200 rounded-2xl hover:shadow-lg transition bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div className="flex-1">
                      <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg uppercase tracking-wide">
                        {match.stage}
                      </span>
                      <div className="text-xl font-black text-slate-800 mt-1.5">
                        {match.home_team_vi}{' '}
                        <span className="text-slate-400 font-light text-lg mx-1">vs</span>{' '}
                        {match.away_team_vi}
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        🕐 {kickoffVN} (giờ VN) · {match.stadium}, {match.city}
                      </div>
                    </div>
                    <a
                      href={`/truc-tiep/${match.match_id}`}
                      className="w-full sm:w-auto text-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl transition shadow-md hover:shadow-red-200"
                    >
                      XEM TRỰC TIẾP
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
