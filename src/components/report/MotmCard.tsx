'use client';

import { useLocale } from 'next-intl';

interface Props {
  name: string;
  rating: number;
  metrics: string[];
  reason: string;
}

export default function MotmCard({ name, rating, metrics, reason }: Props) {
  const locale = useLocale();

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex gap-3.5 items-start my-4">
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
        <span className="text-amber-600 text-xl">⭐</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
          {locale === 'vi' ? 'Cầu thủ xuất sắc nhất' : 'Player of the match'}
        </p>
        <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{name}</p>
        <p className="text-xs text-slate-400 mb-2">{reason}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-semibold">
            {rating}/10
          </span>
          {metrics.map((m, i) => (
            <span
              key={i}
              className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
