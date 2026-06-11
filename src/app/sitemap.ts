import { MetadataRoute } from 'next';
import { MOCK_MATCHES } from '../lib/mock-data';
import { TEAMS_DATA } from '../lib/teams-data';

const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldcup2026live.vn').replace(/\/$/, '');

function matchPriority(matchNumber: number): number {
  if (matchNumber >= 101) return 1.0;
  if (matchNumber >= 97) return 0.98;
  if (matchNumber >= 89) return 0.95;
  if (matchNumber >= 73) return 0.9;
  return 0.8;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const viMatchPages: MetadataRoute.Sitemap = MOCK_MATCHES.map(m => ({
    url: `${BASE}/live/${m.match_id}`,
    lastModified: new Date(m.kickoff_utc),
    changeFrequency: 'hourly' as const,
    priority: matchPriority(m.match_number),
    alternates: {
      languages: {
        vi: `${BASE}/live/${m.match_id}`,
        en: `${BASE}/en/live/${m.match_id}`,
      },
    },
  }));

  const enMatchPages: MetadataRoute.Sitemap = MOCK_MATCHES.map(m => ({
    url: `${BASE}/en/live/${m.match_id}`,
    lastModified: new Date(m.kickoff_utc),
    changeFrequency: 'hourly' as const,
    priority: matchPriority(m.match_number),
    alternates: {
      languages: {
        vi: `${BASE}/live/${m.match_id}`,
        en: `${BASE}/en/live/${m.match_id}`,
      },
    },
  }));

  const viTeamPages: MetadataRoute.Sitemap = TEAMS_DATA.map(t => ({
    url: `${BASE}/teams/${t.slug}`,
    lastModified: new Date('2026-06-02'),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    alternates: {
      languages: {
        vi: `${BASE}/teams/${t.slug}`,
        en: `${BASE}/en/teams/${t.slug}`,
      },
    },
  }));

  const enTeamPages: MetadataRoute.Sitemap = TEAMS_DATA.map(t => ({
    url: `${BASE}/en/teams/${t.slug}`,
    lastModified: new Date('2026-06-02'),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    alternates: {
      languages: {
        vi: `${BASE}/teams/${t.slug}`,
        en: `${BASE}/en/teams/${t.slug}`,
      },
    },
  }));

  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
      alternates: { languages: { vi: BASE, en: `${BASE}/en` } },
    },
    {
      url: `${BASE}/en`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
      alternates: { languages: { vi: BASE, en: `${BASE}/en` } },
    },
    {
      url: `${BASE}/teams`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages: { vi: `${BASE}/teams`, en: `${BASE}/en/teams` } },
    },
    {
      url: `${BASE}/en/teams`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages: { vi: `${BASE}/teams`, en: `${BASE}/en/teams` } },
    },
    ...viMatchPages,
    ...enMatchPages,
    ...viTeamPages,
    ...enTeamPages,
  ];
}
