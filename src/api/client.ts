import type { CreateLinkInput, LinkDTO, LoginDTO, MeDTO, QrMatrixDTO, StatsDTO } from "@shared/schemas";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, opts: { method?: string; body?: unknown; key?: string | null } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.key) headers.authorization = `Bearer ${opts.key}`;
  let res: Response;
  try {
    res = await fetch(path, { method: opts.method ?? "GET", headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  } catch { throw new ApiError(0, "NO DIALTONE — api unreachable"); }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? res.statusText);
  return data as T;
}

export const api = {
  login: (body: { handle: string; password: string }) => request<LoginDTO>("/api/auth/login", { method: "POST", body }),
  me: (key: string) => request<MeDTO>("/api/auth/me", { key }),
  create: (body: CreateLinkInput, key?: string | null) => request<LinkDTO>("/api/links", { method: "POST", body, key }),
  list: (key: string, sort: "date" | "clicks") => request<LinkDTO[]>(`/api/links?sort=${sort}`, { key }),
  get: (key: string, code: string) => request<LinkDTO>(`/api/links/${code}`, { key }),
  remove: (key: string, code: string) => request<void>(`/api/links/${code}`, { method: "DELETE", key }),
  stats: (key: string, code: string, range: string) => request<StatsDTO>(`/api/links/${code}/stats?range=${range}`, { key }),
  qrMatrix: (code: string) => request<QrMatrixDTO>(`/api/links/${code}/qr?format=matrix`),
};

export const errMsg = (e: unknown) =>
  e instanceof ApiError ? (e.status ? `ERR ${e.status}: ${e.message}` : e.message)
  : e instanceof Error ? `ERR: ${e.message}` : "ERR: unknown failure";