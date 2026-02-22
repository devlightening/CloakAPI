export type AuditEventDto = {
  id: string;
  timestampUtc: string;
  subjectUserId: string;
  role: string;
  method: string;
  endpoint: string;
  decision: string;
  maskedCount: number;
  piiTypesFound: string[];
  maskedFields: string[];
  statusCode: number;
};

type Props = {
  items: AuditEventDto[];
};

export function AuditTable({ items }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-950 dark:border-zinc-800 dark:text-zinc-50">
        Audit events
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            <tr>
              <th className="px-4 py-2 font-medium">Time (UTC)</th>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Method</th>
              <th className="px-4 py-2 font-medium">Endpoint</th>
              <th className="px-4 py-2 font-medium">Decision</th>
              <th className="px-4 py-2 font-medium">Masked</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400" colSpan={8}>
                  No results
                </td>
              </tr>
            ) : (
              items.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-zinc-100 dark:border-zinc-900"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                    {new Date(e.timestampUtc).toISOString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {e.subjectUserId}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {e.role}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {e.method}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-950 dark:text-zinc-50">
                    {e.endpoint}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {e.decision}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {e.maskedCount}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {e.statusCode}
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
