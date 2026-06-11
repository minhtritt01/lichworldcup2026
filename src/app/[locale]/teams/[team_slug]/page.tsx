import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TEAMS_DATA } from '../../../../lib/teams-data';
import { getFlag } from '../../../../lib/flag-map';
import { MOCK_MATCHES } from '../../../../lib/mock-data';
import { locales } from '../../../../i18n';
import SquadTable from '../../../../components/SquadTable';
import SmartLink from '../../../../components/SmartLink';

export function generateStaticParams() {
  return locales.flatMap(locale =>
    TEAMS_DATA.map(t => ({ locale, team_slug: t.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; team_slug: string };
}): Promise<Metadata> {
  const team = TEAMS_DATA.find(t => t.slug === params.team_slug);
  if (!team) return {};
  const isEn = params.locale === 'en';
  const name = isEn ? team.nameEn : team.nameVi;
  return {
    title: isEn
      ? `${name} — FIFA World Cup 2026 Squad & Schedule`
      : `${name} — Đội hình & Lịch thi đấu World Cup 2026`,
    description: isEn
      ? `Full ${name} squad list (${team.players.length} players), coach ${team.coach}, FIFA rank #${team.fifaRank} — Group ${team.group} at the 2026 FIFA World Cup.`
      : `Danh sách cầu thủ ${name} (${team.players.length} người), HLV ${team.coach}, FIFA hạng #${team.fifaRank} — Bảng ${team.group} tại World Cup 2026.`,
    alternates: {
      languages: {
        vi: `https://worldcup2026live.vn/teams/${team.slug}`,
        en: `https://worldcup2026live.vn/en/teams/${team.slug}`,
      },
    },
  };
}

export default async function TeamDetailPage({
  params,
}: {
  params: { locale: string; team_slug: string };
}) {
  const team = TEAMS_DATA.find(t => t.slug === params.team_slug);
  if (!team) notFound();

  const locale = params.locale as 'vi' | 'en';
  const name = locale === 'vi' ? team.nameVi : team.nameEn;
  const flag = getFlag(team.slug);

  const teamMatches = MOCK_MATCHES.filter(
    m => m.home_slug === team.slug || m.away_slug === team.slug
  );

  const captain = team.players.find(p => p.captain);
  const avgAge = Math.round(team.players.reduce((s, p) => s + p.age, 0) / team.players.length);
  const totalCaps = team.players.reduce((s, p) => s + p.caps, 0);

  return (
    <main className="py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 mb-5 flex items-center gap-1.5">
        <SmartLink href="/" className="hover:text-slate-600 dark:hover:text-slate-300 transition">
          {locale === 'vi' ? 'Trang chủ' : 'Home'}
        </SmartLink>
        <span>/</span>
        <SmartLink href="/teams" className="hover:text-slate-600 dark:hover:text-slate-300 transition">
          {locale === 'vi' ? 'Đội tuyển' : 'Teams'}
        </SmartLink>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-200">{name}</span>
      </nav>

      {/* Team hero */}
      <section className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 -mx-4 px-6 py-8 mb-6 rounded-2xl">
        <div className="flex items-center gap-5 mb-5">
          <span className="text-6xl">{flag}</span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-slate-900 dark:text-white text-2xl font-semibold">{name}</h1>
              <span className="bg-slate-200 dark:bg-white/15 text-slate-600 dark:text-slate-200 text-xs px-2 py-0.5 rounded-md">
                {locale === 'vi' ? `Bảng ${team.group}` : `Group ${team.group}`}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{team.confederation}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {locale === 'vi' ? `HLV: ${team.coach}` : `Coach: ${team.coach}`}
              {team.coachNationality && ` (${team.coachNationality})`}
            </p>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: `#${team.fifaRank}`, l: 'FIFA' },
            { v: String(team.wcTitles), l: locale === 'vi' ? 'Vô địch WC' : 'WC titles' },
            { v: String(team.players.length), l: locale === 'vi' ? 'Cầu thủ' : 'Players' },
            { v: String(avgAge), l: locale === 'vi' ? 'Tuổi TB' : 'Avg age' },
          ].map(s => (
            <div key={s.l} className="bg-white dark:bg-white/10 border border-slate-200 dark:border-transparent rounded-xl p-3 text-center">
              <div className="text-slate-900 dark:text-white text-lg font-semibold">{s.v}</div>
              <div className="text-slate-500 dark:text-slate-400 text-[9px] uppercase tracking-wide">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Additional info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-sm">
        {captain && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              {locale === 'vi' ? 'Đội trưởng' : 'Captain'}
            </p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{captain.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{captain.club}</p>
          </div>
        )}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            {locale === 'vi' ? 'Tổng số caps' : 'Total caps'}
          </p>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{totalCaps.toLocaleString()}</p>
        </div>
      </div>

      {/* Squad + Schedule */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        {/* Squad */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
            {locale === 'vi' ? `Đội hình (${team.players.length} cầu thủ)` : `Squad (${team.players.length} players)`}
          </h2>
          <SquadTable team={team} />
        </div>

        {/* Schedule */}
        <div className="p-5">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
            {locale === 'vi' ? 'Lịch thi đấu tại World Cup 2026' : 'World Cup 2026 schedule'}
          </h2>
          {teamMatches.length === 0 ? (
            <p className="text-slate-400 text-sm">
              {locale === 'vi' ? 'Chưa có lịch.' : 'No matches scheduled.'}
            </p>
          ) : (
            <div className="space-y-2">
              {teamMatches.map(m => {
                const kickoffVN = new Date(m.kickoff_utc).toLocaleString(
                  locale === 'vi' ? 'vi-VN' : 'en-US',
                  { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }
                );
                const isHome = m.home_slug === team.slug;
                const opponent = isHome ? m.away_team_vi : m.home_team_vi;
                return (
                  <SmartLink
                    key={m.match_id}
                    href={`/live/${m.match_id}`}
                    className="flex items-center justify-between border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                  >
                    <div>
                      <p className="text-xs text-slate-400">{kickoffVN} · {m.stage}</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5">
                        {isHome
                          ? `${name} vs ${opponent}`
                          : `${opponent} vs ${name}`}
                      </p>
                    </div>
                    <span className="text-red-500 text-xs font-semibold">
                      {locale === 'vi' ? 'Xem →' : 'View →'}
                    </span>
                  </SmartLink>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
