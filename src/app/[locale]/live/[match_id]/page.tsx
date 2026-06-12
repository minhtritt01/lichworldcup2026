import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { MOCK_MATCHES } from '../../../../lib/mock-data';
import { getTeamName } from '../../../../lib/team-names';
import { getStageLabel } from '../../../../lib/stage-labels';
import { locales } from '../../../../i18n';
import LiveScoreTicker from '../../../../components/LiveScoreTicker';
import MatchCard from '../../../../components/MatchCard';
import StadiumCard from '../../../../components/StadiumCard';
import MatchTimeline from '../../../../components/MatchTimeline';
import LineupPitch from '../../../../components/LineupPitch';
import { loadMatchDetails } from '../../../../lib/live-match-details';
import SmartLink from '../../../../components/SmartLink';
import { FREE_BROADCASTS } from '../../../../lib/broadcasts-data';

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

  const keywords = locale === 'vi'
    ? [
        `trực tiếp ${homeName} vs ${awayName}`,
        `${homeName} vs ${awayName} tỉ số`,
        `${homeName} đấu ${awayName} world cup 2026`,
        `xem ${homeName} vs ${awayName} ở đâu`,
        `${homeName} vs ${awayName} mấy giờ`,
        `kết quả ${homeName} vs ${awayName}`,
        `${homeName} world cup 2026`,
        `${awayName} world cup 2026`,
        `trực tiếp ${stageLabel} world cup 2026`,
      ]
    : [
        `${homeName} vs ${awayName} live score`,
        `${homeName} vs ${awayName} World Cup 2026`,
        `${homeName} vs ${awayName} prediction`,
        `${homeName} vs ${awayName} lineup`,
        `${homeName} vs ${awayName} kickoff time`,
        `${homeName} World Cup 2026`,
        `${awayName} World Cup 2026`,
        `${stageLabel} World Cup 2026 live`,
      ];

  return {
    metadataBase: new URL('https://lichworldcup2026.vn'),
    title: t('matchTitle', { home: homeName, away: awayName }),
    description: t('matchDesc', { home: homeName, away: awayName, stage: stageLabel, stadium: m.stadium, kickoff }),
    keywords,
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
  const details = loadMatchDetails(m, locale);

  const broadcastList = m.broadcasts?.[locale] ?? FREE_BROADCASTS[locale];
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

  // Load real score/status from scraped files
  const root = process.cwd();
  const postPath = join(root, 'content', 'scraped', `${m.match_id}-post.json`);
  const prePath  = join(root, 'content', 'scraped', `${m.match_id}-pre.json`);
  const detailsPath = join(root, 'content', 'match-details', `${m.match_id}.json`);

  let liveScore = { home: 0, away: 0 };
  let liveStatus = 'Scheduled';

  if (existsSync(postPath)) {
    const post = JSON.parse(readFileSync(postPath, 'utf-8'));
    liveScore = post.score;
    liveStatus = 'Finished';
  } else if (existsSync(prePath)) {
    const pre = JSON.parse(readFileSync(prePath, 'utf-8'));
    if (pre.status === 'live') liveStatus = 'In_Play';
  }

  let liveIncidents: unknown[] = [];
  if (existsSync(detailsPath)) {
    const details = JSON.parse(readFileSync(detailsPath, 'utf-8'));
    liveIncidents = (details.incidents ?? []).map(
      (inc: { type: string; player: string; minute: number; teamSlug: string }, i: number) => ({
        incident_id: i + 1,
        type: inc.type === 'goal' ? 'Goal' : inc.type === 'yellow' ? 'YellowCard' : inc.type === 'red' ? 'RedCard' : 'Sub',
        player_name: inc.player,
        time_minute: inc.minute,
        team_slug: inc.teamSlug,
      })
    );
  }

  const initialStaticData = {
    match_id: m.match_id,
    stage: stageLabel,
    kickoff_time: m.kickoff_utc,
    stadium: m.stadium,
    status: liveStatus,
    current_minute: liveStatus === 'Finished' ? 90 : 0,
    home_team: { slug: m.home_slug, name: m.home_team, name_vi: m.home_team_vi, score: liveScore.home },
    away_team: { slug: m.away_slug, name: m.away_team, name_vi: m.away_team_vi, score: liveScore.away },
    incidents: liveIncidents,
  };

  const probs = { home: 52, draw: 23, away: 25 };

  const relatedMatches = MOCK_MATCHES
    .filter(x => x.match_id !== m.match_id && x.stage.startsWith(m.stage.split(' - ')[0]))
    .slice(0, 4);

  return (
    <main className="py-8">
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-slate-400">
        <SmartLink href="/" className="transition hover:text-slate-600 dark:hover:text-slate-300">
          {locale === 'vi' ? 'Trang chủ' : 'Home'}
        </SmartLink>
        <span>/</span>
        <span>{stageLabel}</span>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">{homeName} vs {awayName}</span>
      </nav>

      <LiveScoreTicker initialStaticData={initialStaticData} matchId={params.match_id} />

      <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('match.preview')}: {homeName} vs {awayName}
        </h2>
        <p className="mb-4 text-sm text-slate-400 dark:text-slate-500">
          🕐 {kickoffLocale} (ICT) · 📍 {m.stadium}, {m.city}, {m.country}
        </p>

        <p className="mb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {t('preview.template', {
            home: homeName,
            away: awayName,
            stage: stageLabel,
            stadium: m.stadium,
            city: m.city,
          })}
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950/50">
            <div className="mb-1 text-xs text-slate-400">{homeName}</div>
            <div className="text-xl font-semibold text-green-600">{probs.home}%</div>
            <div className="text-[10px] text-slate-400">{t('preview.winProbLabel')}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950/50">
            <div className="mb-1 text-xs text-slate-400">{t('preview.drawLabel')}</div>
            <div className="text-xl font-semibold text-slate-600 dark:text-slate-300">{probs.draw}%</div>
            <div className="text-[10px] text-slate-400">{t('match.draw')}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950/50">
            <div className="mb-1 text-xs text-slate-400">{awayName}</div>
            <div className="text-xl font-semibold text-red-500">{probs.away}%</div>
            <div className="text-[10px] text-slate-400">{t('preview.loseProbLabel')}</div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('match.timeline')}
            </h2>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>
          <MatchTimeline
            incidents={details.incidents}
            homeSlug={m.home_slug}
            awaySlug={m.away_slug}
            homeLabel={homeName}
            awayLabel={awayName}
            emptyLabel={t('match.noIncidents')}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('match.lineups')}
            </h2>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="space-y-4">
            <LineupPitch
              title={`${homeName} - ${locale === 'vi' ? 'Dự kiến XI' : 'Projected XI'}`}
              formation={details.homeLineup.formation}
              accent={details.homeLineup.accent}
              players={details.homeLineup.players}
            />
            <LineupPitch
              title={`${awayName} - ${locale === 'vi' ? 'Dự kiến XI' : 'Projected XI'}`}
              formation={details.awayLineup.formation}
              accent={details.awayLineup.accent}
              players={details.awayLineup.players}
            />
          </div>
        </div>
      </section>

      <StadiumCard stadiumName={m.stadium} />

      {broadcastList && broadcastList.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
            {t('match.officialBroadcast')}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {broadcastList.map(channel => (
              channel.url ? (
                <a
                  key={channel.name}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-blue-500 hover:bg-blue-50/60 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-blue-400 dark:hover:bg-blue-950/30"
                >
                  {'region' in channel && channel.region && (
                    <span className="mb-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {channel.region}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-slate-800 transition group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-300">
                    {channel.name}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-[10px] font-medium text-blue-500">
                    {t('match.watchOn')}
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </span>
                </a>
              ) : (
                <div
                  key={channel.name}
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {channel.name}
                  </span>
                  <span className="mt-1 text-[10px] text-slate-400">
                    TV Channel
                  </span>
                </div>
              )
            ))}
          </div>
        </section>
      )}

      <div className="my-6 flex h-[90px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 dark:border-slate-800 dark:bg-slate-950/30">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Advertisement · 728×90
        </span>
      </div>

      {relatedMatches.length > 0 && (
        <section className="mt-2">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {locale === 'vi' ? 'Trận đấu khác cùng vòng' : 'More matches in this round'}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {relatedMatches.map(x => (
              <MatchCard key={x.match_id} match={x} status="upcoming" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
