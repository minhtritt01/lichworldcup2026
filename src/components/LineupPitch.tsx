'use client';

import type { CSSProperties } from 'react';
import type { PlayerPosition } from '../lib/live-match-details';

interface Props {
  title: string;
  formation: string;
  accent: string;
  players: PlayerPosition[];
}

export default function LineupPitch({ title, formation, accent, players }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">Formation {formation}</p>
        </div>
        <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-white/75">
          2D Pitch
        </span>
      </div>

      <div className="relative aspect-[5/6] sm:aspect-[16/12] bg-[linear-gradient(180deg,#0d7a3a_0%,#0b6632_100%)]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/60" />
          <div className="absolute left-4 right-4 top-4 bottom-4 rounded-3xl border border-white/55" />
          <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-white/50" />
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60" />
          <div className="absolute left-1/2 top-4 h-20 w-44 -translate-x-1/2 border border-white/55" />
          <div className="absolute left-1/2 bottom-4 h-20 w-44 -translate-x-1/2 border border-white/55" />
          <div className="absolute left-1/2 top-4 h-8 w-24 -translate-x-1/2 border border-white/45" />
          <div className="absolute left-1/2 bottom-4 h-8 w-24 -translate-x-1/2 border border-white/45" />
        </div>

        {players.map(player => (
          <div
            key={`${player.teamSlug}-${player.role}-${player.number}`}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
            style={{ left: `${player.x}%`, top: `${player.y}%` } as CSSProperties}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-sm font-bold shadow-lg"
              style={{ backgroundColor: accent }}
            >
              {player.number}
            </span>
            <span className="mt-1 max-w-20 text-[10px] font-medium leading-tight text-white/90">
              {player.role}
            </span>
            <span className="hidden sm:block max-w-24 text-[10px] leading-tight text-white/70">
              {player.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
