import { MetadataRoute } from 'next';
import { MOCK_MATCHES } from '../../lib/mock-data';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worldcup2026live.vn';

export default function sitemap({
  params,
}: {
  params: { locale: string };
}): MetadataRoute.Sitemap {
  const isEn = params.locale === 'en';
  const prefix = isEn ? `${BASE}/en` : BASE;

  const matchPages: MetadataRoute.Sitemap = MOCK_MATCHES.map(m => ({
    url: `${prefix}/live/${m.match_id}`,
    lastModified: new Date(m.kickoff_utc),
    changeFrequency: 'hourly' as const,
    priority:
      m.match_number >= 101 ? 1.0
      : m.match_number >= 97  ? 0.98
      : m.match_number >= 89  ? 0.95
      : m.match_number >= 73  ? 0.9
      : 0.8,
  }));

  return [
    {
      url: prefix,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    ...matchPages,
  ];
}
