interface Props {
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  homePercent: number;
}

export default function StatsBar({ label, homeValue, awayValue, homePercent }: Props) {
  const awayPercent = 100 - homePercent;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-slate-800 dark:text-slate-100">{homeValue}</span>
        <span className="text-[11px] text-slate-400">{label}</span>
        <span className="font-medium text-slate-800 dark:text-slate-100">{awayValue}</span>
      </div>
      <div className="flex gap-0.5 h-1.5">
        <div
          className="bg-blue-600 rounded-l-full transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="bg-slate-300 dark:bg-slate-600 rounded-r-full transition-all duration-500"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
}
