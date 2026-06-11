import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { locales } from '../../../../i18n';

const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldcup2026live.vn').replace(/\/$/, '');
import { parseReportFile, getAllReportSlugs } from '../../../../lib/report-types';
import SmartLink from '../../../../components/SmartLink';
import PreMatchReport from '../../../../components/report/PreMatchReport';
import PostMatchReport from '../../../../components/report/PostMatchReport';

export function generateStaticParams() {
  return locales.flatMap(locale =>
    getAllReportSlugs(locale).map(slug => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const report = parseReportFile(params.slug, params.locale);
  if (!report) return {};

  const { meta } = report;
  const viUrl = `${BASE}/reports/${params.slug}`;
  const enUrl = `${BASE}/en/reports/${params.slug}`;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: params.locale === 'en' ? enUrl : viUrl,
      languages: { vi: viUrl, en: enUrl },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'article',
      publishedTime: meta.publishedAt,
    },
  };
}

export default function ReportPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const report = parseReportFile(params.slug, params.locale);
  if (!report) notFound();

  const { meta } = report;
  const locale = params.locale as 'vi' | 'en';

  return (
    <main className="py-8 max-w-3xl mx-auto">
      <nav className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
        <SmartLink href="/" className="hover:text-slate-600 dark:hover:text-slate-300 transition">
          {locale === 'vi' ? 'Trang chủ' : 'Home'}
        </SmartLink>
        <span>/</span>
        <SmartLink href={`/live/${meta.matchId}`} className="hover:text-slate-600 dark:hover:text-slate-300 transition">
          {meta.homeTeam} vs {meta.awayTeam}
        </SmartLink>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-200">
          {meta.type === 'pre-match'
            ? (locale === 'vi' ? 'Nhận định' : 'Preview')
            : (locale === 'vi' ? 'Phân tích' : 'Analysis')}
        </span>
      </nav>

      <div className="mb-4">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          meta.type === 'pre-match'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        }`}>
          {meta.type === 'pre-match'
            ? (locale === 'vi' ? '📋 Nhận định trước trận' : '📋 Pre-match preview')
            : (locale === 'vi' ? '📊 Phân tích sau trận' : '📊 Post-match analysis')}
        </span>
      </div>

      <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-2">
        {meta.title}
      </h1>
      <p className="text-xs text-slate-400 mb-6">
        {locale === 'vi' ? 'Cập nhật:' : 'Updated:'}{' '}
        {new Date(meta.publishedAt).toLocaleString(
          locale === 'vi' ? 'vi-VN' : 'en-US',
          { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'long', timeStyle: 'short' }
        )}
      </p>

      {meta.type === 'pre-match' ? (
        <PreMatchReport report={report} />
      ) : (
        <PostMatchReport report={report} />
      )}

      <p className="text-[11px] text-slate-400 mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
        {locale === 'vi'
          ? 'Nội dung được tạo tự động từ dữ liệu FotMob, phân tích bởi AI.'
          : 'Content auto-generated from FotMob data, analyzed by AI.'}
      </p>
    </main>
  );
}
