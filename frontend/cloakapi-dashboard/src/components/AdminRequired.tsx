type Props = {
  message?: string;
};

export function AdminRequired({ message }: Props) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950 dark:text-amber-200">
      {message ?? "Admin role required."}
    </div>
  );
}
