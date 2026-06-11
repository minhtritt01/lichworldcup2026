import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { MOCK_MATCHES } from '../../../lib/mock-data';
import MatchCard from '../../../components/MatchCard';
import SmartLink from '../../../components/SmartLink';

const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lichworldcup2026.vn').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isEn = params.locale === 'en';
  return {
    title: isEn
      ? 'World Cup 2026 Live Scores Today — Real-time Results'
      : 'Trực Tiếp World Cup 2026 Hôm Nay — Tỉ Số Cập Nhật Liên Tục',
    description: isEn
      ? "Today's World Cup 2026 live scores, match results and upcoming fixtures — updated every 15 seconds. Follow all 2026 FIFA World Cup matches live."
      : 'Tỉ số trực tiếp World Cup 2026 hôm nay — kết quả, diễn biến và lịch các trận sắp diễn ra. Cập nhật mỗi 15 giây.',
    keywords: isEn
      ? [
          'World Cup 2026 live score today',
          'World Cup 2026 results today',
          'FIFA World Cup 2026 live',
          'World Cup 2026 match today',
          'World Cup 2026 score update',
          'World Cup 2026 live stream today',
          '2026 FIFA World Cup today fixtures',
        ]
      : [
          'trực tiếp world cup 2026 hôm nay',
          'tỉ số world cup 2026 hôm nay',
          'xem world cup 2026 trực tiếp hôm nay',
          'world cup 2026 kết quả hôm nay',
          'trận đấu world cup 2026 hôm nay',
          'world cup 2026 giờ việt nam',
          'lịch world cup 2026 hôm nay giờ VN',
        ],
    alternates: {
      canonical: isEn ? `${BASE}/en/live` : `${BASE}/live`,
      languages: { vi: `${BASE}/live`, en: `${BASE}/en/live` },
    },
  };
}

export default async function LivePage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });
  const locale = params.locale as 'vi' | 'en';

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const todayMatches = MOCK_MATCHES.filter(m => m.kickoff_utc.startsWith(todayStr));

  const upcomingMatches = MOCK_MATCHES.filter(m => {
    const d = m.kickoff_utc.slice(0, 10);
    return d > todayStr;
  }).slice(0, 8);

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
          {locale === 'vi' ? 'Trực tiếp hôm nay' : 'Live & Today'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {locale === 'vi'
            ? `Các trận đấu ngày ${now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
            : `Matches on ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
        </p>
      </div>

      {todayMatches.length > 0 ? (
        <section className="space-y-3">
          {todayMatches.map(m => (
            <MatchCard key={m.match_id} match={m} />
          ))}
        </section>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-10 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {locale === 'vi' ? 'Không có trận đấu nào hôm nay.' : 'No matches today.'}
          </p>
        </div>
      )}

      {upcomingMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {locale === 'vi' ? 'Sắp diễn ra' : 'Coming up'}
          </h2>
          {upcomingMatches.map(m => (
            <MatchCard key={m.match_id} match={m} />
          ))}
          <SmartLink
            href="/"
            className="block text-center text-sm text-blue-600 hover:underline dark:text-blue-400 pt-2"
          >
            {locale === 'vi' ? 'Xem toàn bộ lịch thi đấu →' : 'View full schedule →'}
          </SmartLink>
        </section>
      )}
    </main>
  );
}
