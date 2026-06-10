import { MetadataRoute } from 'next';
import { MOCK_MATCHES } from '../lib/mock-data';

const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lichworldcup2026.vn').replace(/\/$/, '');

function matchPriority(matchNumber: number): number {
  if (matchNumber >= 101) return 1.0;
  if (matchNumber >= 97) return 0.98;
  if (matchNumber >= 89) return 0.95;
  if (matchNumber >= 73) return 0.9;
  return 0.8;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const viPages: MetadataRoute.Sitemap = MOCK_MATCHES.map(m => ({
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

  const enPages: MetadataRoute.Sitemap = MOCK_MATCHES.map(m => ({
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
    ...viPages,
    ...enPages,
  ];
}
