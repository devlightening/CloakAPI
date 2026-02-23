"use client";

import { useEffect, useState } from "react";
import { GUARDRAIL_BASE_URL } from "../../src/lib/config";
import { apiFetch, ApiError } from "../../src/lib/api";
import { NavBar } from "../../src/components/NavBar";
import { RequireAuth } from "../../src/components/RequireAuth";
import { useSession } from "../../src/lib/useSession";

export default function MePage() {
  const session = useSession();
  const [json, setJson] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setMessage(params.get("message"));
    } catch {
      setMessage(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!session.loaded) return;
    if (!session.token) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<unknown>(
          `${GUARDRAIL_BASE_URL}/api/users/me`,
          undefined,
          session.token
        );
        if (cancelled) return;
        setJson(JSON.stringify(data, null, 2));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          setError("Unauthorized. Please log in again.");
        } else {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session.loaded, session.token]);

  const role = session.role ?? "";

  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
        <NavBar />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="text-lg font-semibold">User Me</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            This endpoint is proxied through Guardrail. Analysts should see masked PII.
          </div>

          {message ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950 dark:text-amber-200">
              {message}
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            <div className="font-medium text-zinc-950 dark:text-zinc-50">Demo note</div>
            <div className="mt-1">
              Current role: <span className="font-mono">{role || "(unknown)"}</span>
            </div>
            <div className="mt-1">
              Admins should see raw email/phone/TCKN/IP/location. Analysts should see masked output.
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

          {!loading && json ? (
            <pre className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
{json}
            </pre>
          ) : null}
        </div>
      </div>
    </RequireAuth>
  );
}
