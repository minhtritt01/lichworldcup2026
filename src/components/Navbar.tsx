'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '../navigation';
import { Search, Menu, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import type { Locale } from '../config';
import { useTheme } from './ThemeProvider';
import SmartLink from './SmartLink';

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  function switchLocale(next: Locale) {
    // Set cookie first so middleware doesn't redirect based on the old value
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(pathname, { locale: next });
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        <SmartLink href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 overflow-hidden shadow-inner shrink-0 dark:border-slate-700 dark:bg-slate-800">
            <Image
              src="/logo.png"
              alt="World Cup 2026 Logo"
              width={28}
              height={28}
              className="object-cover scale-110"
            />
          </div>
          <span className="font-semibold text-xs sm:text-sm md:text-base tracking-tight">World Cup 2026</span>
          <span className="bg-red-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-wide hidden sm:inline">
            {t('live')}
          </span>
        </SmartLink>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          <SmartLink href="/" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm transition">
            {t('schedule')}
          </SmartLink>
          <a href="#" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm transition">{t('standings')}</a>
          <a href="#" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm transition">{t('teams')}</a>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Search — desktop only */}
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
            <Search size={13} className="text-slate-500 dark:text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 text-xs">{t('search')}</span>
          </div>

          {/* Locale toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800">
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

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/80"
            aria-label="Toggle theme"
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark'
              ? <Sun size={15} className="text-amber-400" />
              : <Moon size={15} className="text-indigo-300" />}
          </button>

          {/* Hamburger — mobile */}
          <button
            className="md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-3 dark:border-slate-700 dark:bg-slate-800">
          <SmartLink href="/" className="text-slate-600 text-sm dark:text-slate-300">{t('schedule')}</SmartLink>
          <a href="#" className="text-slate-600 text-sm dark:text-slate-300">{t('standings')}</a>
          <a href="#" className="text-slate-600 text-sm dark:text-slate-300">{t('teams')}</a>
        </div>
      )}
    </nav>
  );
}
