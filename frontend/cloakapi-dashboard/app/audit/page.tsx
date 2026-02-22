"use client";

import { useEffect, useMemo, useState } from "react";
import { GUARDRAIL_BASE_URL } from "../../src/lib/config";
import { apiFetch, ApiError } from "../../src/lib/api";
import { NavBar } from "../../src/components/NavBar";
import { RequireAuth } from "../../src/components/RequireAuth";
import { AdminRequired } from "../../src/components/AdminRequired";
import { AuditTable, type AuditEventDto } from "../../src/components/AuditTable";

type AuditResponse = {
  items: AuditEventDto[];
  total: number;
  page: number;
  pageSize: number;
};

type Decision = "" | "Allow" | "Mask";
type Role = "" | "Admin" | "Analyst";

export default function AuditPage() {
  const [endpoint, setEndpoint] = useState("");
  const [role, setRole] = useState<Role>("");
  const [decision, setDecision] = useState<Decision>("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));
    if (endpoint.trim()) q.set("endpoint", endpoint.trim());
    if (role) q.set("role", role);
    if (decision) q.set("decision", decision);
    return q.toString();
  }, [page, pageSize, endpoint, role, decision]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setForbidden(false);
      setError(null);

      try {
        const res = await apiFetch<AuditResponse>(
          `${GUARDRAIL_BASE_URL}/admin/audit?${queryString}`
        );
        if (cancelled) return;
        setData(res);
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) {
          setForbidden(true);
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
  }, [queryString]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
        <NavBar />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="text-lg font-semibold">Audit</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Paginated audit event list.
          </div>

          {forbidden ? (
            <div className="mt-6">
              <AdminRequired message="Admin required. Your token does not have access to admin endpoints." />
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Endpoint contains</label>
              <input
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                value={endpoint}
                onChange={(e) => {
                  setPage(1);
                  setEndpoint(e.target.value);
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
              {data ? ` · Total ${data.total}` : ""}
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

          {!loading && !forbidden && data ? (
            <div className="mt-6">
              <AuditTable items={data.items} />
            </div>
          ) : null}
        </div>
      </div>
    </RequireAuth>
  );
}
