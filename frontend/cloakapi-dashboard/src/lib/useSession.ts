"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CLOAK_ROLE_KEY, CLOAK_TOKEN_KEY } from "./storageKeys";

export type SessionState = {
  token: string | null;
  role: string | null;
  loaded: boolean;
};

function normalizeRole(role: string | null): string | null {
  if (!role) return null;
  const trimmed = role.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower === "admin") return "Admin";
  if (lower === "analyst") return "Analyst";
  return trimmed;
}

export function useSession() {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const t = window.localStorage.getItem(CLOAK_TOKEN_KEY);
      const r = window.localStorage.getItem(CLOAK_ROLE_KEY);
      setToken(t);
      setRole(normalizeRole(r));
    } finally {
      setLoaded(true);
    }
  }, []);

  const login = useCallback((accessToken: string, selectedRole: string) => {
    const normalized = normalizeRole(selectedRole);
    window.localStorage.setItem(CLOAK_TOKEN_KEY, accessToken);
    if (normalized) window.localStorage.setItem(CLOAK_ROLE_KEY, normalized);
    else window.localStorage.removeItem(CLOAK_ROLE_KEY);

    setToken(accessToken);
    setRole(normalized);
    setLoaded(true);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(CLOAK_TOKEN_KEY);
    window.localStorage.removeItem(CLOAK_ROLE_KEY);
    setToken(null);
    setRole(null);
    setLoaded(true);
  }, []);

  const isAdmin = useMemo(() => {
    return normalizeRole(role) === "Admin";
  }, [role]);

  return { token, role: normalizeRole(role), loaded, login, logout, isAdmin };
}
