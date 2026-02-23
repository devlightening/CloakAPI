export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  token?: string | null
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(input, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    throw new ApiError(401, "Unauthorized");
  }

  if (res.status === 403) {
    throw new ApiError(403, "Forbidden");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
}
