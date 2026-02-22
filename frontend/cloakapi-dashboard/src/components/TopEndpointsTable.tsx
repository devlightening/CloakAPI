export type TopEndpointRow = {
  endpoint: string;
  maskedEvents: number;
  maskedCount: number;
};

type Props = {
  rows: TopEndpointRow[];
};

export function TopEndpointsTable({ rows }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-950 dark:border-zinc-800 dark:text-zinc-50">
        Top endpoints
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            <tr>
              <th className="px-4 py-2 font-medium">Endpoint</th>
              <th className="px-4 py-2 font-medium">Masked events</th>
              <th className="px-4 py-2 font-medium">Masked count</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400" colSpan={3}>
                  No data
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.endpoint}
                  className="border-t border-zinc-100 dark:border-zinc-900"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-950 dark:text-zinc-50">
                    {r.endpoint}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {r.maskedEvents}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {r.maskedCount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
