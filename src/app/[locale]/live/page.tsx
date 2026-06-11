import { getTranslations } from 'next-intl/server';
import { MOCK_MATCHES } from '../../../lib/mock-data';
import MatchCard from '../../../components/MatchCard';
import SmartLink from '../../../components/SmartLink';

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
