type Props = {
  title: string;
  value: number | string;
};

export function StatsCard({ title, value }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}
