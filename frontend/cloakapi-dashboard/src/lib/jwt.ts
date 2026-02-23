export type JwtClaims = {
  sub?: string;
  role?: string;
  Role?: string;
  roles?: unknown;
  [key: string]: unknown;
};

export function parseJwt(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

export function extractRoleFromClaims(claims: JwtClaims | null): string | null {
  if (!claims) return null;

  const direct = claims.role ?? claims.Role;
  if (typeof direct === "string" && direct.trim()) return direct;

  const schemaRole = claims[
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
  ];
  if (typeof schemaRole === "string" && schemaRole.trim()) return schemaRole;

  const roles = claims.roles;
  if (Array.isArray(roles) && roles.length > 0) {
    const first = roles[0];
    if (typeof first === "string" && first.trim()) return first;
  }

  return null;
}
