import type { Metadata } from 'next';
import { getAllReportSlugs, parseReportFile } from '../../../lib/report-types';
import { getFlag } from '../../../lib/flag-map';
import SmartLink from '../../../components/SmartLink';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isEn = params.locale === 'en';
  return {
    title: isEn
      ? 'World Cup 2026 Match Reports | Previews, Predictions & Analysis'
      : 'Nhận định bóng đá World Cup 2026 | Dự đoán tỷ số & Phân tích trận đấu',
    description: isEn
      ? 'World Cup 2026 previews and match reports for all 104 games — tactical analysis, predicted lineups, win odds and score predictions.'
      : 'Tổng hợp nhận định bóng đá World Cup 2026 mới nhất — phân tích chiến thuật, dự đoán tỷ số, tỷ lệ thắng và đội hình ra sân cho tất cả 104 trận đấu.',
    keywords: isEn
      ? ['World Cup 2026', 'match preview', 'score prediction', 'tactical analysis', 'predicted lineup', 'win odds', 'FIFA World Cup', 'match report', 'team form']
      : ['nhận định bóng đá', 'nhận định trận đấu', 'World Cup 2026', 'dự đoán tỷ số', 'tỷ lệ thắng', 'đội hình ra sân', 'phân tích chiến thuật', 'vòng bảng World Cup', 'FIFA World Cup 2026', 'lịch thi đấu'],
  };
}

export default async function ReportsIndexPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as 'vi' | 'en';
  const slugs = getAllReportSlugs(locale);

  const reports = slugs
    .map(slug => {
      const r = parseReportFile(slug, locale);
      return r ? { slug, ...r } : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b!.meta.publishedAt).getTime() - new Date(a!.meta.publishedAt).getTime());

  return (
    <main className="py-8">
      <section className="bg-slate-900 -mx-4 px-6 py-8 mb-8 rounded-b-2xl">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">FIFA World Cup 2026</p>
        <h1 className="text-white text-2xl font-semibold mb-2">
          {locale === 'vi' ? 'Nhận định & Phân tích trận đấu' : 'Match previews & analysis'}
        </h1>
        <p className="text-slate-400 text-sm">
          {locale === 'vi'
            ? 'Báo cáo chiến thuật tự động cho mọi trận đấu World Cup 2026'
            : 'AI-powered tactical reports for every World Cup 2026 match'}
        </p>
      </section>

      {reports.length === 0 ? (
        <div className="text-center text-slate-400 py-16">
          <p className="text-lg mb-2">📋</p>
          <p className="text-sm">
            {locale === 'vi'
              ? 'Chưa có báo cáo nào. Báo cáo sẽ xuất hiện khi giải đấu bắt đầu.'
              : 'No reports yet. Reports will appear once the tournament begins.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => {
            if (!r) return null;
            const { meta } = r;
            const homeFlag = getFlag(meta.homeSlug);
            const awayFlag = getFlag(meta.awaySlug);
            const isPre = meta.type === 'pre-match';

            return (
              <SmartLink
                key={r.slug}
                href={`/reports/${r.slug}`}
                className="block border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition bg-white dark:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isPre
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {isPre
                          ? (locale === 'vi' ? 'Nhận định' : 'Preview')
                          : (locale === 'vi' ? 'Phân tích' : 'Analysis')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(meta.publishedAt).toLocaleDateString(
                          locale === 'vi' ? 'vi-VN' : 'en-US',
                          { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight mb-1">
                      {homeFlag} {meta.homeTeam} vs {meta.awayTeam} {awayFlag}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{meta.description}</p>
                  </div>

                  {!isPre && meta.finalScore && (
                    <div className="bg-slate-900 rounded-lg px-3 py-2 text-center shrink-0">
                      <p className="text-lg font-semibold text-white tabular-nums">{meta.finalScore.replace('-', ' – ')}</p>
                      <p className="text-[9px] text-slate-400">FT</p>
                    </div>
                  )}
                </div>
              </SmartLink>
            );
          })}
        </div>
      )}
    </main>
  );
}
