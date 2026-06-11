'use client';

import { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { TEAMS_DATA } from '../../../lib/teams-data';
import { getFlag } from '../../../lib/flag-map';
import { useFavorites } from '../../../lib/hooks/useFavorites';
import SmartLink from '../../../components/SmartLink';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];
const CONFS = ['All','UEFA','CONMEBOL','CAF','AFC','CONCACAF','OFC'];

export default function TeamsPage() {
  const locale = useLocale() as 'vi' | 'en';
  const { isFavorite, toggleFavorite } = useFavorites();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [confFilter, setConfFilter] = useState('All');

  const filtered = useMemo(() => {
    return TEAMS_DATA.filter(t => {
      const name = locale === 'vi' ? t.nameVi : t.nameEn;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
      if (groupFilter !== 'All' && t.group !== groupFilter) return false;
      if (confFilter !== 'All' && t.confederation !== confFilter) return false;
      return true;
    });
  }, [search, groupFilter, confFilter, locale]);

  return (
    <main className="py-8">
      {/* Hero */}
      <section className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 -mx-4 px-6 py-8 mb-8 rounded-2xl">
        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-2">FIFA World Cup 2026</p>
        <h1 className="text-slate-900 dark:text-white text-2xl font-semibold mb-4">
          {locale === 'vi' ? '48 đội tham dự' : '48 participating teams'}
        </h1>
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          {[
            { v: '48', l: locale === 'vi' ? 'đội' : 'teams' },
            { v: '6',  l: locale === 'vi' ? 'châu lục' : 'confs' },
            { v: '12', l: locale === 'vi' ? 'bảng' : 'groups' },
          ].map(s => (
            <div key={s.l} className="bg-white dark:bg-white/10 border border-slate-200 dark:border-transparent rounded-xl p-3 text-center">
              <div className="text-slate-900 dark:text-white text-xl font-semibold">{s.v}</div>
              <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder={locale === 'vi' ? 'Tìm đội tuyển...' : 'Search teams...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <select
          value={groupFilter}
          onChange={e => setGroupFilter(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          <option value="All">{locale === 'vi' ? 'Tất cả bảng' : 'All groups'}</option>
          {GROUPS.map(g => <option key={g} value={g}>{locale === 'vi' ? `Bảng ${g}` : `Group ${g}`}</option>)}
        </select>
        <select
          value={confFilter}
          onChange={e => setConfFilter(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          {CONFS.map(c => <option key={c} value={c}>{c === 'All' ? (locale === 'vi' ? 'Tất cả châu lục' : 'All confs') : c}</option>)}
        </select>
      </div>

      {/* Teams grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map(team => {
          const name = locale === 'vi' ? team.nameVi : team.nameEn;
          const flag = getFlag(team.slug);
          const fav = isFavorite(team.slug);

          return (
            <div key={team.slug} className="relative border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center gap-2 bg-white dark:bg-slate-800 hover:shadow-md transition group">
              {/* Favorite star */}
              <button
                onClick={() => toggleFavorite(team.slug)}
                className="absolute top-2 right-2 text-base leading-none"
                aria-label={fav ? 'Unpin team' : 'Pin team'}
              >
                {fav ? '⭐' : '☆'}
              </button>

              <SmartLink href={`/teams/${team.slug}`} className="flex flex-col items-center gap-2 text-center w-full">
                <span className="text-4xl">{flag}</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{name}</span>
                <span className="text-[10px] text-slate-400">
                  {locale === 'vi' ? `Bảng ${team.group}` : `Group ${team.group}`} · {team.confederation}
                </span>
                <div className="w-full flex justify-between border-t border-slate-100 dark:border-slate-700 pt-2 mt-1">
                  <div className="text-center flex-1">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">#{team.fifaRank}</div>
                    <div className="text-[9px] text-slate-400">FIFA</div>
                  </div>
                  <div className="text-center flex-1 border-l border-slate-100 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{team.players.length}</div>
                    <div className="text-[9px] text-slate-400">{locale === 'vi' ? 'cầu thủ' : 'players'}</div>
                  </div>
                </div>
              </SmartLink>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-slate-400 py-12">
          {locale === 'vi' ? 'Không tìm thấy đội nào.' : 'No teams found.'}
        </div>
      )}
    </main>
  );
}
