import { toVenueConfig, type VenueConfig } from "./tables-mapper";

/**
 * Typed client for the API table configuration (`/tables/*` in `api/src/modules/tables`). Calls
 * go to `/api/*`, which `next.config.ts` rewrites to `API_URL`, so the httpOnly session cookie
 * stays first-party (same pattern as `features/auth/auth-api.ts`). Every mutation answers the
 * full updated `{ spaces, tables }`.
 */

export type { VenueConfig } from "./tables-mapper";

/** A 400 issue: `{ path: "label", code: "duplicate" }`. */
export type TablesIssue = { path: string; code: string };

export type TableConflict = { id: string; number: number; label: string };

export type TablesApiError =
  /** 400: the API rejected the input (`issues` empty when the request shape itself was refused). */
  | { kind: "invalid"; issues: readonly TablesIssue[] }
  | { kind: "conflict"; code: "space_not_removable"; reason: "space_has_tables" | "last_space"; tableCount: number }
  | { kind: "conflict"; code: "table_has_open_session" | "table_has_history" }
  | { kind: "conflict"; code: "table_overlap"; conflict: TableConflict }
  /** 404: the space or table no longer exists. */
  | { kind: "not-found" }
  /** 401: no usable session cookie. */
  | { kind: "unauthorized" }
  | { kind: "network" }
  | { kind: "unknown" };

export type TablesResult<T> = { ok: true; value: T } | { ok: false; error: TablesApiError };

/** One call to the tables API; `path` is relative to `/tables` ("" creates a table). */
export type TablesRequest = { method: "POST" | "PATCH" | "PUT" | "DELETE"; path: string; body?: unknown };

const API_BASE = "/api/tables";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function toIssues(value: unknown): TablesIssue[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (issue): issue is TablesIssue => isRecord(issue) && typeof issue.path === "string" && typeof issue.code === "string",
  );
}

function toConflict(body: Record<string, unknown>): TablesApiError {
  switch (body.error) {
    case "space_not_removable":
      if ((body.reason === "space_has_tables" || body.reason === "last_space") && typeof body.tableCount === "number") {
        return { kind: "conflict", code: "space_not_removable", reason: body.reason, tableCount: body.tableCount };
      }
      return { kind: "unknown" };
    case "table_has_open_session":
    case "table_has_history":
      return { kind: "conflict", code: body.error };
    case "table_overlap": {
      const conflict = body.conflict;
      if (isRecord(conflict) && typeof conflict.id === "string" && typeof conflict.number === "number" && typeof conflict.label === "string") {
        return { kind: "conflict", code: "table_overlap", conflict: { id: conflict.id, number: conflict.number, label: conflict.label } };
      }
      return { kind: "unknown" };
    }
    default:
      return { kind: "unknown" };
  }
}

async function toError(response: Response): Promise<TablesApiError> {
  if (response.status === 401) return { kind: "unauthorized" };
  if (response.status === 404) return { kind: "not-found" };
  if (response.status !== 400 && response.status !== 409) return { kind: "unknown" };
  const body = await readJson(response);
  if (response.status === 400) return { kind: "invalid", issues: isRecord(body) ? toIssues(body.issues) : [] };
  return isRecord(body) ? toConflict(body) : { kind: "unknown" };
}

async function request(path: string, init: RequestInit): Promise<TablesResult<VenueConfig>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, credentials: "same-origin" });
  } catch {
    return { ok: false, error: { kind: "network" } };
  }
  if (!response.ok) return { ok: false, error: await toError(response) };
  const config = toVenueConfig(await readJson(response));
  return config ? { ok: true, value: config } : { ok: false, error: { kind: "unknown" } };
}

/** `GET /tables/config`: spaces in display order and tables with their QR credentials. */
export function fetchTablesConfig(): Promise<TablesResult<VenueConfig>> {
  return request("/config", { method: "GET" });
}

/** Sends one configuration change; answers the full updated configuration. */
export function sendTablesRequest({ method, path, body }: TablesRequest): Promise<TablesResult<VenueConfig>> {
  const init: RequestInit =
    body === undefined ? { method } : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
  return request(path, init);
}
