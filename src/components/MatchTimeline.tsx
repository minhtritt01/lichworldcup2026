'use client';

import { AlertTriangle, ArrowLeftRight, Clock3, Square, Trophy } from 'lucide-react';
import type { MatchIncident } from '../lib/live-match-details';

interface Props {
  incidents: MatchIncident[];
  homeSlug: string;
  awaySlug: string;
  homeLabel: string;
  awayLabel: string;
  emptyLabel: string;
}

function getIncidentMeta(type: MatchIncident['type']) {
  switch (type) {
    case 'goal':
      return {
        label: 'Goal',
        icon: Trophy,
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/70',
      };
    case 'yellow':
      return {
        label: 'Yellow card',
        icon: Square,
        tone: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/70',
      };
    case 'red':
      return {
        label: 'Red card',
        icon: AlertTriangle,
        tone: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/70',
      };
    case 'sub':
    default:
      return {
        label: 'Substitution',
        icon: ArrowLeftRight,
        tone: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/70',
      };
  }
}

export default function MatchTimeline({ incidents, homeSlug, awaySlug, homeLabel, awayLabel, emptyLabel }: Props) {
  const sorted = [...incidents].sort((a, b) => a.minute - b.minute);

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-5 text-sm text-slate-500 dark:text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map(incident => {
        const meta = getIncidentMeta(incident.type);
        const Icon = meta.icon;
        const isHome = incident.teamSlug === homeSlug;
        const teamLabel = isHome ? homeLabel : incident.teamSlug === awaySlug ? awayLabel : incident.teamSlug;

        return (
          <div
            key={`${incident.minute}-${incident.player}-${incident.type}`}
            className="grid gap-3 md:grid-cols-[1fr_3.5rem_1fr] md:items-center"
          >
            <div className={`order-2 md:order-1 ${isHome ? 'md:justify-self-end md:text-right' : 'md:justify-self-start'} md:max-w-[22rem]`}>
              {isHome && (
                <article className={`rounded-2xl border px-4 py-3 ${meta.tone}`}>
                  <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.24em] opacity-75">
                    <Icon size={11} />
                    <span>{meta.label}</span>
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                    {incident.player}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed opacity-80">
                    {incident.detail}
                  </p>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] opacity-70">
                    {teamLabel}
                  </p>
                </article>
              )}
            </div>

            <div className="order-1 flex items-center gap-2 md:order-2 md:flex-col md:gap-1">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300 shadow-sm">
                <Clock3 size={15} />
              </span>
              <span className="rounded-full bg-slate-900 dark:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-white dark:text-slate-900 tabular-nums">
                {incident.minute}&apos;
              </span>
            </div>

            <div className={`order-3 ${!isHome ? 'md:justify-self-start' : 'md:justify-self-end'} md:max-w-[22rem]`}>
              {!isHome && (
                <article className={`rounded-2xl border px-4 py-3 ${meta.tone}`}>
                  <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.24em] opacity-75">
                    <Icon size={11} />
                    <span>{meta.label}</span>
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                    {incident.player}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed opacity-80">
                    {incident.detail}
                  </p>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] opacity-70">
                    {teamLabel}
                  </p>
                </article>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
