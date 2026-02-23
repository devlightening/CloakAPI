"use client";

import { useEffect, useMemo, useState } from "react";
import { GUARDRAIL_BASE_URL } from "../../../src/lib/config";
import { apiFetch, ApiError } from "../../../src/lib/api";
import { NavBar } from "../../../src/components/NavBar";
import { RequireAuth } from "../../../src/components/RequireAuth";
import { RequireAdmin } from "../../../src/components/RequireAdmin";
import { AuditTable, type AuditEventDto } from "../../../src/components/AuditTable";
import { useSession } from "../../../src/lib/useSession";

type AuditResponse = {
  items: AuditEventDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type Decision = "" | "Allow" | "Mask";
type Role = "" | "Admin" | "Analyst";

export default function AdminAuditPage() {
  const session = useSession();
  const [endpointContains, setEndpointContains] = useState("");
  const [role, setRole] = useState<Role>("");
  const [decision, setDecision] = useState<Decision>("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));
    if (endpointContains.trim()) q.set("endpointContains", endpointContains.trim());
    if (role) q.set("role", role);
    if (decision) q.set("decision", decision);
    return q.toString();
  }, [page, pageSize, endpointContains, role, decision]);

  useEffect(() => {
    let cancelled = false;

    if (!session.loaded) return;
    if (!session.token) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch<AuditResponse>(
          `${GUARDRAIL_BASE_URL}/admin/audit?${queryString}`,
          undefined,
          session.token
        );
        if (cancelled) return;
        setData(res);
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) {
          setError("Not authorized (Admin role required).");
          return;
        }
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [queryString, session.loaded, session.token]);

  const totalPages = data?.totalPages ?? 1;

  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
        <NavBar />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <RequireAdmin>
            <div className="text-lg font-semibold">Admin Audit</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Search and filter audit events.
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">Endpoint contains</label>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                  value={endpointContains}
                  onChange={(e) => {
                    setPage(1);
                    setEndpointContains(e.target.value);
                  }}
                  placeholder="/api/users/me"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Role</label>
                <select
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                  value={role}
                  onChange={(e) => {
                    setPage(1);
                    setRole(e.target.value as Role);
                  }}
                >
                  <option value="">All</option>
                  <option value="Admin">Admin</option>
                  <option value="Analyst">Analyst</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Decision</label>
                <select
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                  value={decision}
                  onChange={(e) => {
                    setPage(1);
                    setDecision(e.target.value as Decision);
                  }}
                >
                  <option value="">All</option>
                  <option value="Allow">Allow</option>
                  <option value="Mask">Mask</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {page} / {totalPages}
                {data ? ` · Total ${data.totalCount}` : ""}
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-zinc-200 bg-white px-2 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  value={pageSize}
                  onChange={(e) => {
                    setPage(1);
                    setPageSize(Number(e.target.value));
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <button
                  className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
                Loading...
              </div>
            ) : null}

            {!loading && data ? (
              <div className="mt-6">
                <AuditTable items={data.items} />
              </div>
            ) : null}
          </RequireAdmin>
        </div>
      </div>
    </RequireAuth>
  );
}
