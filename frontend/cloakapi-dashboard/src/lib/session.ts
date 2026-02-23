import { CLOAK_ROLE_KEY, CLOAK_TOKEN_KEY } from "./storageKeys";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLOAK_TOKEN_KEY);
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLOAK_ROLE_KEY);
}

export function setSession(token: string, role?: string | null) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLOAK_TOKEN_KEY, token);
  if (role && role.trim()) window.localStorage.setItem(CLOAK_ROLE_KEY, role);
  else window.localStorage.removeItem(CLOAK_ROLE_KEY);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CLOAK_TOKEN_KEY);
  window.localStorage.removeItem(CLOAK_ROLE_KEY);
}
