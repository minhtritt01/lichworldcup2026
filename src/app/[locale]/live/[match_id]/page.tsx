import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MOCK_MATCHES } from '../../../../lib/mock-data';
import { getTeamName } from '../../../../lib/team-names';
import { getStageLabel } from '../../../../lib/stage-labels';
import { locales } from '../../../../i18n';
import LiveScoreTicker from '../../../../components/LiveScoreTicker';
import MatchCard from '../../../../components/MatchCard';

export function generateStaticParams() {
  return locales.flatMap(locale =>
    MOCK_MATCHES.map(m => ({ locale, match_id: m.match_id }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; match_id: string };
}): Promise<Metadata> {
  const m = MOCK_MATCHES.find(x => x.match_id === params.match_id);
  if (!m) return {};

  const locale = params.locale as 'vi' | 'en';
  const t = await getTranslations({ locale, namespace: 'meta' });

  const homeName = getTeamName(m.home_slug, locale);
  const awayName = getTeamName(m.away_slug, locale);

  const kickoff = new Date(m.kickoff_utc).toLocaleString(
    locale === 'vi' ? 'vi-VN' : 'en-US',
    { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }
  );

  const stageLabel = getStageLabel(m.stage, locale);

  const viUrl = `https://lichworldcup2026.vn/live/${m.match_id}`;
  const enUrl = `https://lichworldcup2026.vn/en/live/${m.match_id}`;

  return {
    metadataBase: new URL('https://lichworldcup2026.vn'),
    title: t('matchTitle', { home: homeName, away: awayName }),
    description: t('matchDesc', { home: homeName, away: awayName, stage: stageLabel, stadium: m.stadium, kickoff }),
    alternates: {
      canonical: locale === 'en' ? enUrl : viUrl,
      languages: { vi: viUrl, en: enUrl },
    },
    openGraph: {
      title: `${homeName} vs ${awayName} — World Cup 2026`,
      description: `${stageLabel} · ${m.stadium}, ${m.city}`,
      images: [
        {
          url: '/opengraph-image.png',
          width: 1200,
          height: 630,
          alt: `${homeName} vs ${awayName} — World Cup 2026`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${homeName} vs ${awayName} — World Cup 2026`,
      description: `${stageLabel} · ${m.stadium}, ${m.city}`,
      images: ['/opengraph-image.png'],
    },
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: { locale: string; match_id: string };
}) {
  const m = MOCK_MATCHES.find(x => x.match_id === params.match_id);
  if (!m) notFound();

  const locale = params.locale as 'vi' | 'en';
  const t = await getTranslations({ locale });

  const defaultBroadcasts = {
    vi: [
      { name: 'VTV2', url: 'https://vtvgo.vn/xem-truc-tiep-kenh-vtv2-2.html' },
      { name: 'VTVGo', url: `https://vtvgo.vn/xem-truc-tiep-${m.home_slug}-vs-${m.away_slug}.html` },
      { name: 'FPT Play', url: `https://fptplay.vn/xem-truc-tiep/${m.home_slug}-vs-${m.away_slug}` },
    ],
    en: [
      { name: 'Fox Sports Live', url: `https://www.foxsports.com/live/${m.home_slug}-vs-${m.away_slug}` },
      { name: 'Telemundo', url: `https://www.telemundo.com/shows/fifa-world-cup/${m.home_slug}-vs-${m.away_slug}` },
      { name: 'Peacock Live', url: `https://www.peacocktv.com/watch/sports/${m.home_slug}-vs-${m.away_slug}` },
    ],
  };

  const broadcastList = m.broadcasts?.[locale] || defaultBroadcasts[locale];

  const homeName = getTeamName(m.home_slug, locale);
  const awayName = getTeamName(m.away_slug, locale);

  const kickoffLocale = new Date(m.kickoff_utc).toLocaleString(
    locale === 'vi' ? 'vi-VN' : 'en-US',
    {
      timeZone: 'Asia/Ho_Chi_Minh',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const stageLabel = getStageLabel(m.stage, locale);

  const initialStaticData = {
    match_id: m.match_id,
    match_number: m.match_number,
    stage: stageLabel,
    kickoff_time: m.kickoff_utc,
    stadium: m.stadium,
    status: 'Scheduled',
    current_minute: 0,
    home_team: {
      team_id: m.home_slug.substring(0, 3).toUpperCase(),
      name: m.home_team,
      name_vi: m.home_team_vi,
      slug: m.home_slug,
      score: 0,
    },
    away_team: {
      team_id: m.away_slug.substring(0, 3).toUpperCase(),
      name: m.away_team,
      name_vi: m.away_team_vi,
      slug: m.away_slug,
      score: 0,
    },
    incidents: [],
  };

  const probs = { home: 52, draw: 23, away: 25 };

  const relatedMatches = MOCK_MATCHES
    .filter(x => x.match_id !== m.match_id && x.stage.startsWith(m.stage.split(' - ')[0]))
    .slice(0, 4);

  return (
    <main className="py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 mb-5 flex items-center gap-1.5">
        <a href={locale === 'en' ? '/en' : '/'} className="hover:text-slate-600 transition">
          {locale === 'vi' ? 'Trang chủ' : 'Home'}
        </a>
        <span>/</span>
        <span>{stageLabel}</span>
        <span>/</span>
        <span className="text-slate-600">{homeName} vs {awayName}</span>
      </nav>

      {/* Live ticker */}
      <LiveScoreTicker
        initialStaticData={initialStaticData}
        matchId={params.match_id}
      />

      {/* Preview / Nhận định */}
      <section className="mt-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          {t('match.preview')}: {homeName} vs {awayName}
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          🕐 {kickoffLocale} (ICT) · 📍 {m.stadium}, {m.city}, {m.country}
        </p>

        <p className="text-slate-600 text-sm leading-relaxed mb-5">
          {t('preview.template', {
            home: homeName,
            away: awayName,
            stage: stageLabel,
            stadium: m.stadium,
            city: m.city,
          })}
        </p>

        {/* Prediction probabilities */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <div className="text-xs text-slate-400 mb-1">{homeName}</div>
            <div className="text-xl font-semibold text-green-600">{probs.home}%</div>
            <div className="text-[10px] text-slate-400">{t('preview.winProbLabel')}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <div className="text-xs text-slate-400 mb-1">{t('preview.drawLabel')}</div>
            <div className="text-xl font-semibold text-slate-600">{probs.draw}%</div>
            <div className="text-[10px] text-slate-400">{t('match.draw')}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <div className="text-xs text-slate-400 mb-1">{awayName}</div>
            <div className="text-xl font-semibold text-red-500">{probs.away}%</div>
            <div className="text-[10px] text-slate-400">{t('preview.loseProbLabel')}</div>
          </div>
        </div>
      </section>

      {/* Official Broadcasters */}
      {broadcastList && broadcastList.length > 0 && (
        <section className="mt-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            {t('match.officialBroadcast')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {broadcastList.map(channel => (
              channel.url ? (
                <a
                  key={channel.name}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl p-4 transition text-center group"
                >
                  <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition text-sm sm:text-base">
                    {channel.name}
                  </span>
                  <span className="text-[10px] text-blue-500 font-medium mt-1 flex items-center gap-1">
                    {t('match.watchOn')}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </span>
                </a>
              ) : (
                <div
                  key={channel.name}
                  className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-4 text-center"
                >
                  <span className="font-semibold text-slate-800 text-sm sm:text-base">
                    {channel.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    TV Channel
                  </span>
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Ad slot */}
      <div className="my-6 bg-slate-100 rounded-xl border border-dashed border-slate-300 h-[90px] flex items-center justify-center">
        <span className="text-xs text-slate-400 tracking-wide uppercase">Advertisement · 728×90</span>
      </div>

      {/* Related matches */}
      {relatedMatches.length > 0 && (
        <section className="mt-2">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
            {locale === 'vi' ? 'Trận đấu khác cùng vòng' : 'More matches in this round'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedMatches.map(x => (
              <MatchCard key={x.match_id} match={x} status="upcoming" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
