"use client";

import { useEffect, useState } from "react";
import { GUARDRAIL_BASE_URL } from "../../src/lib/config";
import { apiFetch, ApiError } from "../../src/lib/api";
import { NavBar } from "../../src/components/NavBar";
import { RequireAuth } from "../../src/components/RequireAuth";
import { AdminRequired } from "../../src/components/AdminRequired";
import { StatsCard } from "../../src/components/StatsCard";
import {
  TopEndpointsTable,
  type TopEndpointRow,
} from "../../src/components/TopEndpointsTable";

type Summary = {
  totalEvents: number;
  maskedEvents: number;
  allowEvents: number;
  uniqueEndpoints: number;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topEndpoints, setTopEndpoints] = useState<TopEndpointRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setForbidden(false);

      try {
        const s = await apiFetch<Summary>(
          `${GUARDRAIL_BASE_URL}/admin/stats/summary`
        );
        const top = await apiFetch<TopEndpointRow[]>(
          `${GUARDRAIL_BASE_URL}/admin/stats/top-endpoints?by=maskedEvents&take=10`
        );

        if (cancelled) return;
        setSummary(s);
        setTopEndpoints(top);
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
  }, []);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
        <NavBar />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="text-lg font-semibold">Dashboard</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Admin-only overview of masking/audit activity.
          </div>

          {forbidden ? (
            <div className="mt-6">
              <AdminRequired message="Admin required. Your token does not have access to admin endpoints." />
            </div>
          ) : null}

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

          {!loading && !forbidden && summary ? (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total events" value={summary.totalEvents} />
                <StatsCard title="Masked events" value={summary.maskedEvents} />
                <StatsCard title="Allow events" value={summary.allowEvents} />
                <StatsCard
                  title="Unique endpoints"
                  value={summary.uniqueEndpoints}
                />
              </div>

              <div className="mt-6">
                <TopEndpointsTable rows={topEndpoints} />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </RequireAuth>
  );
}
