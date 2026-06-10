'use client';

import { useState } from 'react';
import { STADIUMS_DATA } from '../lib/stadiums-data';
import { useLocale } from 'next-intl';
import { ChevronDown, ExternalLink, MapPin } from 'lucide-react';

interface Props {
  stadiumName: string;
}

export default function StadiumCard({ stadiumName }: Props) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const data = STADIUMS_DATA[stadiumName];
  if (!data) return null;

  const displayName = locale === 'vi' ? data.name_vi : data.name;
  const displayCity = locale === 'vi' ? data.city_vi : data.city;
  const displayFact = locale === 'vi' ? data.fact_vi : data.fact;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
        aria-expanded={isOpen}
      >
        <div className="min-w-0">
          <h3 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.24em]">
            {locale === 'vi' ? 'Thông tin sân vận động' : 'Venue & Stadium Information'}
          </h3>
          <h2 className="mt-1 flex items-start gap-2 text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
            <MapPin size={16} className="mt-0.5 shrink-0 text-red-500" />
            <span className="min-w-0">
              <span className="block break-words">{displayName}</span>
              <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
                {displayCity}
              </span>
            </span>
          </h2>
        </div>
        <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div className="grid gap-4 border-t border-slate-100 dark:border-slate-800 p-5 pt-4 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 dark:bg-slate-950 px-3 py-2.5">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                {locale === 'vi' ? 'Sức chứa' : 'Capacity'}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{data.capacity}</span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 dark:bg-slate-950 px-3 py-2.5">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                {locale === 'vi' ? 'Khánh thành' : 'Opened'}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{data.opened}</span>
            </div>
            <a
              href={data.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-blue-200/70 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 px-3 py-2.5 font-semibold text-blue-700 dark:text-blue-300 transition hover:bg-blue-100 dark:hover:bg-blue-950/50"
            >
              <span className="inline-flex items-center gap-2">
                <ExternalLink size={14} />
                {locale === 'vi' ? 'Xem trên Google Maps' : 'View on Google Maps'}
              </span>
              <span className="text-[10px] uppercase tracking-[0.24em] opacity-70">
                {locale === 'vi' ? 'Mở liên kết' : 'Open link'}
              </span>
            </a>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-4">
            <strong className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 mb-2">
              {locale === 'vi' ? 'Sự thật thú vị' : 'Fun Venue Fact'}
            </strong>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {displayFact}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
