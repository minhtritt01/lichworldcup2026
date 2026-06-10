"use client";

import { useTranslations, useLocale } from "next-intl";
import { MOCK_MATCHES } from "../lib/mock-data";
import { getTeamName } from "../lib/team-names";
import { Link } from "../navigation";

export default function LiveTicker() {
  const t = useTranslations("status");
  const locale = useLocale() as "vi" | "en";
  const now = Date.now();

  const tickerMatches = MOCK_MATCHES.filter((m) => {
    const ms = new Date(m.kickoff_utc).getTime();
    const elapsed = (now - ms) / 60000;
    return elapsed >= 0 && elapsed < 120;
  }).slice(0, 5);

  const upcomingMatches = MOCK_MATCHES.filter((m) => {
    const ms = new Date(m.kickoff_utc).getTime();
    return ms > now;
  }).slice(0, 4);

  const display = [...tickerMatches, ...upcomingMatches].slice(0, 6);
  if (display.length === 0) return null;

  return (
    <div className="border-b border-slate-200 bg-slate-50 overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-5 py-1.5 overflow-x-auto scrollbar-none">
          {display.map((m) => {
            const ms = new Date(m.kickoff_utc).getTime();
            const elapsed = Math.floor((now - ms) / 60000);
            const isLive = elapsed >= 0 && elapsed < 120;
            const homeName = getTeamName(m.home_slug, locale);
            const awayName = getTeamName(m.away_slug, locale);

            return (
              <Link
                key={m.match_id}
                href={`/live/${m.match_id}`}
                className="flex items-center gap-2 whitespace-nowrap text-xs shrink-0 transition hover:opacity-80"
              >
                {isLive ? (
                  <span className="bg-red-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                    {t("live")}
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                    {new Date(m.kickoff_utc).toLocaleTimeString(
                      locale === "vi" ? "vi-VN" : "en-US",
                      {
                        timeZone: "Asia/Ho_Chi_Minh",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                )}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {homeName}
                </span>
                {isLive ? (
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    0–0
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">vs</span>
                )}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {awayName}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
