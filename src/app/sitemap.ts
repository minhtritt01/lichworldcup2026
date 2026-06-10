import { MetadataRoute } from "next";
import { MOCK_MATCHES } from "../lib/mock-data";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://lichworldcup2026.vn";

export default function sitemap(): MetadataRoute.Sitemap {
  const matchPages: MetadataRoute.Sitemap = MOCK_MATCHES.map((match) => ({
    url: `${BASE_URL}/truc-tiep/${match.match_id}`,
    lastModified: new Date(match.kickoff_utc),
    changeFrequency: "hourly" as const,
    priority:
      match.match_number >= 97
        ? 1.0
        : match.match_number >= 89
          ? 0.95
          : match.match_number >= 73
            ? 0.9
            : 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    ...matchPages,
  ];
}
