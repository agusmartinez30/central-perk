import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCurrentStaff, login, logout, verifyMfa, type StaffProfile } from "./auth-api";

const STAFF: StaffProfile = {
  id: "staff-1",
  email: "owner@cafecentral.com",
  name: "Sofía M.",
  role: "OWNER",
};

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
  });
}

function authError(status: number, error: string): Response {
  return jsonResponse(status, { statusCode: status, error, message: "irrelevant" });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("login", () => {
  it("posts the credentials same-origin through the /api proxy", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { status: "mfa_required" }));

    await login({ email: "owner@cafecentral.com", password: "secret", remember: true });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@cafecentral.com", password: "secret", remember: true }),
    });
  });

  it("returns the MFA step or the signed-in staff member", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { status: "mfa_required" }));
    expect(await login({ email: "a@b.co", password: "x", remember: false })).toEqual({
      ok: true,
      value: { status: "mfa_required" },
    });

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { status: "authenticated", staff: STAFF }));
    expect(await login({ email: "a@b.co", password: "x", remember: false })).toEqual({
      ok: true,
      value: { status: "authenticated", staff: STAFF },
    });
  });

  it("maps wrong credentials and rejected input to the invalid-credentials copy", async () => {
    fetchMock.mockResolvedValueOnce(authError(401, "invalid_credentials"));
    expect(await login({ email: "a@b.co", password: "x", remember: false })).toEqual({
      ok: false,
      error: "invalid-credentials",
    });

    fetchMock.mockResolvedValueOnce(jsonResponse(400, { statusCode: 400, message: "Validation failed" }));
    expect(await login({ email: "a@b.co", password: "x", remember: false })).toEqual({
      ok: false,
      error: "invalid-credentials",
    });
  });

  it("maps 429 to throttled, a failed request to network and anything else to unknown", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(429, { statusCode: 429, message: "Too Many Requests" }));
    expect(await login({ email: "a@b.co", password: "x", remember: false })).toEqual({
      ok: false,
      error: "throttled",
    });

    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    expect(await login({ email: "a@b.co", password: "x", remember: false })).toEqual({
      ok: false,
      error: "network",
    });

    fetchMock.mockResolvedValueOnce(jsonResponse(500, { statusCode: 500 }));
    expect(await login({ email: "a@b.co", password: "x", remember: false })).toEqual({
      ok: false,
      error: "unknown",
    });

    fetchMock.mockResolvedValueOnce(jsonResponse(200, { status: "something-else" }));
    expect(await login({ email: "a@b.co", password: "x", remember: false })).toEqual({
      ok: false,
      error: "unknown",
    });
  });
});

describe("verifyMfa", () => {
  it("posts the code and returns the signed-in staff member", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { status: "authenticated", staff: STAFF }));

    expect(await verifyMfa("123456")).toEqual({
      ok: true,
      value: { status: "authenticated", staff: STAFF },
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/mfa/verify", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "123456" }),
    });
  });

  it("maps a wrong or rejected code to wrong-code and a missing login to invalid-session", async () => {
    fetchMock.mockResolvedValueOnce(authError(401, "invalid_mfa_code"));
    expect(await verifyMfa("000000")).toEqual({ ok: false, error: "wrong-code" });

    fetchMock.mockResolvedValueOnce(jsonResponse(400, { statusCode: 400, message: "Validation failed" }));
    expect(await verifyMfa("12")).toEqual({ ok: false, error: "wrong-code" });

    fetchMock.mockResolvedValueOnce(authError(401, "invalid_session"));
    expect(await verifyMfa("123456")).toEqual({ ok: false, error: "invalid-session" });

    fetchMock.mockResolvedValueOnce(jsonResponse(429));
    expect(await verifyMfa("123456")).toEqual({ ok: false, error: "throttled" });
  });
});

describe("logout", () => {
  it("posts to the logout endpoint and accepts 204", async () => {
    fetchMock.mockResolvedValue(jsonResponse(204));

    expect(await logout()).toEqual({ ok: true, value: undefined });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  });

  it("reports a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await logout()).toEqual({ ok: false, error: "network" });
  });
});

describe("fetchCurrentStaff", () => {
  it("returns the staff member of the current session", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { staff: STAFF }));

    expect(await fetchCurrentStaff()).toEqual({ ok: true, value: STAFF });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", { credentials: "same-origin" });
  });

  it("maps any 401 to invalid-session", async () => {
    fetchMock.mockResolvedValueOnce(authError(401, "invalid_session"));
    expect(await fetchCurrentStaff()).toEqual({ ok: false, error: "invalid-session" });

    fetchMock.mockResolvedValueOnce(jsonResponse(401, { statusCode: 401, message: "Unauthorized" }));
    expect(await fetchCurrentStaff()).toEqual({ ok: false, error: "invalid-session" });
  });

  it("rejects a malformed profile", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { staff: { id: "x" } }));
    expect(await fetchCurrentStaff()).toEqual({ ok: false, error: "unknown" });
  });
});
