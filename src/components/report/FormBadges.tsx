interface Props {
  form: string[];
  teamName: string;
  flag: string;
}

const COLORS: Record<string, string> = {
  W: 'bg-green-600',
  D: 'bg-yellow-500',
  L: 'bg-red-600',
};

export default function FormBadges({ form, teamName, flag }: Props) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-800 dark:text-slate-100 mb-1.5">
        {flag} {teamName}
      </p>
      <div className="flex gap-1">
        {form.map((r, i) => (
          <span
            key={i}
            className={`w-6 h-6 rounded text-[10px] font-semibold text-white flex items-center justify-center ${COLORS[r] ?? 'bg-slate-400'}`}
          >
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}
