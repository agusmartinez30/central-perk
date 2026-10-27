/**
 * Typed client for the API auth endpoints. Calls go to `/api/*`, which `next.config.ts`
 * rewrites to `API_URL`, so the httpOnly `cp_session` cookie stays first-party.
 */

export const STAFF_ROLES = ["OWNER", "MANAGER", "STAFF"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/** Public staff projection returned by the API (`StaffProfile` in `api/src/modules/auth`). */
export type StaffProfile = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
};

export type SessionResponse =
  | { status: "mfa_required" }
  | { status: "authenticated"; staff: StaffProfile };

/**
 * `invalid-credentials` and `wrong-code` are the copy keys of the login and verify screens;
 * `invalid-session` means there is no usable session cookie (signed out or expired).
 */
export type AuthErrorCode =
  | "invalid-credentials"
  | "wrong-code"
  | "invalid-session"
  | "throttled"
  | "network"
  | "unknown";

export type AuthResult<T> = { ok: true; value: T } | { ok: false; error: AuthErrorCode };

export type LoginInput = { email: string; password: string; remember: boolean };

const API_BASE = "/api/auth";

const ERROR_CODES: Record<string, AuthErrorCode> = {
  invalid_credentials: "invalid-credentials",
  invalid_mfa_code: "wrong-code",
  invalid_session: "invalid-session",
};

type Endpoint = {
  path: string;
  init: RequestInit;
  /** Error for a 400 (input rejected by the API schema) on this endpoint. */
  rejected?: AuthErrorCode;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStaffProfile(value: unknown): value is StaffProfile {
  if (!isRecord(value)) return false;
  const { id, email, name, role } = value;
  return (
    typeof id === "string" &&
    typeof email === "string" &&
    typeof name === "string" &&
    STAFF_ROLES.includes(role as StaffRole)
  );
}

function parseSessionResponse(body: unknown): SessionResponse | null {
  if (!isRecord(body)) return null;
  if (body.status === "mfa_required") return { status: "mfa_required" };
  if (body.status === "authenticated" && isStaffProfile(body.staff)) {
    return { status: "authenticated", staff: body.staff };
  }
  return null;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function toError(response: Response, rejected?: AuthErrorCode): Promise<AuthErrorCode> {
  if (response.status === 429) return "throttled";
  if (response.status === 400 && rejected) return rejected;
  if (response.status === 401) {
    const body = await readJson(response);
    const code = isRecord(body) && typeof body.error === "string" ? ERROR_CODES[body.error] : undefined;
    return code ?? "invalid-session";
  }
  return "unknown";
}

async function request<T>(
  { path, init, rejected }: Endpoint,
  parse: (response: Response) => Promise<T | null>,
): Promise<AuthResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, credentials: "same-origin" });
  } catch {
    return { ok: false, error: "network" };
  }
  if (!response.ok) return { ok: false, error: await toError(response, rejected) };
  const value = await parse(response);
  return value === null ? { ok: false, error: "unknown" } : { ok: true, value };
}

function postJson(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

const parseSession = async (response: Response) => parseSessionResponse(await readJson(response));

/** `POST /auth/login`: either asks for the MFA code or signs the staff member in. */
export function login(input: LoginInput): Promise<AuthResult<SessionResponse>> {
  return request(
    { path: "/login", init: postJson(input), rejected: "invalid-credentials" },
    parseSession,
  );
}

/** `POST /auth/mfa/verify`: completes a login that is waiting for the MFA code. */
export function verifyMfa(code: string): Promise<AuthResult<SessionResponse>> {
  return request(
    { path: "/mfa/verify", init: postJson({ code }), rejected: "wrong-code" },
    parseSession,
  );
}

/** `POST /auth/logout`: revokes the session and clears its cookie (204). */
export function logout(): Promise<AuthResult<void>> {
  return request({ path: "/logout", init: { method: "POST" } }, async () => undefined);
}

/** `GET /auth/me`: the signed-in staff member, or `invalid-session` when signed out. */
export function fetchCurrentStaff(): Promise<AuthResult<StaffProfile>> {
  return request({ path: "/me", init: {} }, async (response) => {
    const body = await readJson(response);
    return isRecord(body) && isStaffProfile(body.staff) ? body.staff : null;
  });
}
