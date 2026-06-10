'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '../navigation';
import { Search, Menu } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '../config';

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function switchLocale(next: Locale) {
    // Set cookie first so middleware doesn't redirect based on the old value
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(pathname, { locale: next });
  }

  return (
    <nav className="bg-slate-900 sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        <a href={locale === 'en' ? '/en' : '/'} className="flex items-center gap-2 shrink-0">
          <span className="text-white font-semibold text-sm sm:text-base">⚽ World Cup 2026</span>
          <span className="bg-red-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-wide hidden sm:inline">
            {t('live')}
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          <a href={locale === 'en' ? '/en' : '/'} className="text-slate-400 hover:text-white text-sm transition">
            {t('schedule')}
          </a>
          <a href="#" className="text-slate-400 hover:text-white text-sm transition">{t('standings')}</a>
          <a href="#" className="text-slate-400 hover:text-white text-sm transition">{t('teams')}</a>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Search — desktop only */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5">
            <Search size={13} className="text-slate-500" />
            <span className="text-slate-500 text-xs">{t('search')}</span>
          </div>

          {/* Locale toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => switchLocale('vi')}
              className={`px-2 py-1 rounded-md transition ${locale === 'vi' ? 'bg-blue-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              VI
            </button>
            <button
              onClick={() => switchLocale('en')}
              className={`px-2 py-1 rounded-md transition ${locale === 'en' ? 'bg-blue-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              EN
            </button>
          </div>

          {/* Hamburger — mobile */}
          <button
            className="md:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 py-3 flex flex-col gap-3">
          <a href={locale === 'en' ? '/en' : '/'} className="text-slate-300 text-sm">{t('schedule')}</a>
          <a href="#" className="text-slate-300 text-sm">{t('standings')}</a>
          <a href="#" className="text-slate-300 text-sm">{t('teams')}</a>
        </div>
      )}
    </nav>
  );
}
