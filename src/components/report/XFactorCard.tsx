'use client';

import { useLocale } from 'next-intl';

interface Props {
  name: string;
  reason: string;
}

export default function XFactorCard({ name, reason }: Props) {
  const locale = useLocale();

  return (
    <div className="border-l-[3px] border-red-500 bg-red-50 dark:bg-red-950/20 rounded-r-xl px-4 py-3 my-4">
      <p className="text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">
        {locale === 'vi' ? '⭐ Cầu thủ X-Factor' : '⭐ X-Factor player'}
      </p>
      <p className="text-sm text-red-900 dark:text-red-200 leading-relaxed">
        <strong>{name}</strong> — {reason}
      </p>
    </div>
  );
}
