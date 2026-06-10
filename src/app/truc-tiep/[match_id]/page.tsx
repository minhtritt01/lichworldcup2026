import { MOCK_MATCHES } from '../../../lib/mock-data';
import LiveScoreTicker from '../../../components/LiveScoreTicker';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateStaticParams() {
  return MOCK_MATCHES.map((match) => ({
    match_id: match.match_id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { match_id: string };
}): Promise<Metadata> {
  const m = MOCK_MATCHES.find(x => x.match_id === params.match_id);
  if (!m) return {};

  const kickoffVN = new Date(m.kickoff_utc).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });

  return {
    title: `Trực tiếp ${m.home_team_vi} vs ${m.away_team_vi} | Tỉ số World Cup 2026`,
    description: `Xem trực tiếp diễn biến, kết quả, tỉ số trận ${m.home_team_vi} vs ${m.away_team_vi} (${m.stage}) tại ${m.stadium}. Giờ VN: ${kickoffVN}. Cập nhật liên tục 15 giây.`,
    openGraph: {
      title: `${m.home_team_vi} vs ${m.away_team_vi} - World Cup 2026`,
      description: `Trực tiếp tỉ số ${m.stage} tại ${m.stadium}, ${m.city}`,
    },
  };
}

export default function MatchDetailPage({
  params,
}: {
  params: { match_id: string };
}) {
  const m = MOCK_MATCHES.find(x => x.match_id === params.match_id);
  if (!m) notFound();

  const kickoffVN = new Date(m!.kickoff_utc).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const initialStaticData = {
    match_id: m!.match_id,
    match_number: m!.match_number,
    stage: m!.stage,
    kickoff_time: m!.kickoff_utc,
    stadium: m!.stadium,
    status: 'Scheduled',
    current_minute: 0,
    home_team: {
      team_id: m!.home_team.substring(0, 3).toUpperCase(),
      name: m!.home_team,
      name_vi: m!.home_team_vi,
      slug: m!.home_slug,
      score: 0,
    },
    away_team: {
      team_id: m!.away_team.substring(0, 3).toUpperCase(),
      name: m!.away_team,
      name_vi: m!.away_team_vi,
      slug: m!.away_slug,
      score: 0,
    },
    incidents: [],
  };

  const otherMatches = MOCK_MATCHES.filter(x => x.match_id !== m!.match_id).slice(0, 6);

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <LiveScoreTicker
        initialStaticData={initialStaticData}
        matchId={params.match_id}
      />

      <section className="mt-8 p-8 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
        <h2 className="text-2xl font-black text-slate-900 border-b pb-3">
          Nhận định & Diễn biến: {m!.home_team_vi} vs {m!.away_team_vi}
        </h2>
        <p className="text-slate-500 text-sm font-medium">
          🕐 Giờ Việt Nam: {kickoffVN} · 📍 {m!.stadium}, {m!.city}, {m!.country}
        </p>
        <p className="text-slate-700 leading-relaxed text-justify text-base">
          Trận thi đấu đỉnh cao giữa <strong>{m!.home_team_vi}</strong> và{' '}
          <strong>{m!.away_team_vi}</strong> thuộc khuôn khổ {m!.stage} World Cup 2026
          diễn ra tại {m!.stadium}. Hệ thống tự động cập nhật tỉ số cứ mỗi 15 giây
          trực tiếp từ nguồn dữ liệu chính thức.
        </p>
        <p className="text-slate-700 leading-relaxed text-justify text-base">
          Hãy lưu lại trang này để theo dõi từng pha ghi bàn, thẻ phạt và tình huống
          quan trọng giữa {m!.home_team_vi} và {m!.away_team_vi} tại World Cup 2026.
        </p>
      </section>

      <footer className="mt-12 p-6 bg-slate-100 rounded-2xl border border-slate-200">
        <h4 className="text-sm font-black uppercase text-slate-500 mb-3 tracking-wider">
          Trận đấu khác:
        </h4>
        <div className="flex flex-wrap gap-2">
          {otherMatches.map(x => (
            <a
              key={x.match_id}
              href={`/truc-tiep/${x.match_id}`}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline bg-white px-3 py-1.5 rounded-xl border border-slate-200 transition shadow-sm"
            >
              {x.home_team_vi} vs {x.away_team_vi}
            </a>
          ))}
        </div>
      </footer>
    </main>
  );
}
