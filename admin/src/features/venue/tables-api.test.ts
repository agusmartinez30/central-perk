import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTablesConfig, sendTablesRequest } from "./tables-api";
import { API_CONFIG } from "./tables-api.fixture";

function respond(status: number, body?: unknown) {
  const fetchMock = vi.fn(
    async () =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchTablesConfig", () => {
  it("loads the configuration through the same-origin proxy and maps it to the admin types", async () => {
    const fetchMock = respond(200, API_CONFIG);
    const result = await fetchTablesConfig();
    expect(fetchMock).toHaveBeenCalledWith("/api/tables/config", expect.objectContaining({ method: "GET", credentials: "same-origin" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.spaces).toEqual(API_CONFIG.spaces);
    expect(result.value.tables[0]).toEqual({
      id: "tbl_07",
      number: 7,
      label: "Mesa 07",
      spaceId: "salon",
      capacity: 4,
      description: "Ventana",
      enabled: true,
      version: 18,
      layout: { x: 222, y: 64, width: 150, height: 132, shape: "rect" },
      qr: { token: "4pX9kR2mL7", generatedOn: "2026-10-21", generatedBy: "Sofía M." },
      revokedQrs: [{ token: "Old07abcde", generatedOn: "2026-09-02", generatedBy: "Sofía M.", revokedOn: "2026-10-21", auditId: "QR-118" }],
    });
    expect(result.value.tables[1]).toMatchObject({ id: "tbl_08", qr: null, revokedQrs: [], layout: { shape: "round" } });
  });

  it("treats a malformed body as an unknown error", async () => {
    respond(200, { spaces: [{ id: "salon" }], tables: [] });
    expect(await fetchTablesConfig()).toEqual({ ok: false, error: { kind: "unknown" } });
  });

  it("reports a missing session and an unreachable API", async () => {
    respond(401, { statusCode: 401, error: "invalid_session" });
    expect(await fetchTablesConfig()).toEqual({ ok: false, error: { kind: "unauthorized" } });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    expect(await fetchTablesConfig()).toEqual({ ok: false, error: { kind: "network" } });
  });
});

describe("sendTablesRequest", () => {
  it("sends the JSON body and answers the full updated configuration", async () => {
    const fetchMock = respond(201, API_CONFIG);
    const result = await sendTablesRequest({ method: "POST", path: "/spaces", body: { name: "Barra" } });
    expect(fetchMock).toHaveBeenCalledWith("/api/tables/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Barra" }),
      credentials: "same-origin",
    });
    expect(result.ok && result.value.tables).toHaveLength(2);
  });

  it("maps 400 issues", async () => {
    respond(400, { statusCode: 400, error: "invalid_table", issues: [{ path: "label", code: "duplicate" }, { nope: 1 }] });
    expect(await sendTablesRequest({ method: "PATCH", path: "/tbl_07", body: {} })).toEqual({
      ok: false,
      error: { kind: "invalid", issues: [{ path: "label", code: "duplicate" }] },
    });
    respond(400, { statusCode: 400, message: "Validation failed" });
    expect(await sendTablesRequest({ method: "PUT", path: "/tbl_07/size", body: {} })).toEqual({
      ok: false,
      error: { kind: "invalid", issues: [] },
    });
  });

  it("maps 409 conflicts with their details", async () => {
    respond(409, { statusCode: 409, error: "space_not_removable", reason: "space_has_tables", tableCount: 2 });
    expect(await sendTablesRequest({ method: "DELETE", path: "/spaces/salon" })).toEqual({
      ok: false,
      error: { kind: "conflict", code: "space_not_removable", reason: "space_has_tables", tableCount: 2 },
    });
    respond(409, { statusCode: 409, error: "table_has_history" });
    expect(await sendTablesRequest({ method: "DELETE", path: "/tbl_07" })).toEqual({
      ok: false,
      error: { kind: "conflict", code: "table_has_history" },
    });
    respond(409, { statusCode: 409, error: "table_has_open_session" });
    expect(await sendTablesRequest({ method: "POST", path: "/tbl_07/disable" })).toEqual({
      ok: false,
      error: { kind: "conflict", code: "table_has_open_session" },
    });
    respond(409, { statusCode: 409, error: "table_overlap", conflict: { id: "tbl_08", number: 8, label: "Mesa 08" } });
    expect(await sendTablesRequest({ method: "PUT", path: "/tbl_07/position", body: { x: 0, y: 0 } })).toEqual({
      ok: false,
      error: { kind: "conflict", code: "table_overlap", conflict: { id: "tbl_08", number: 8, label: "Mesa 08" } },
    });
    respond(409, { statusCode: 409, error: "something_else" });
    expect(await sendTablesRequest({ method: "DELETE", path: "/tbl_07" })).toEqual({ ok: false, error: { kind: "unknown" } });
  });

  it("maps 404 and server errors", async () => {
    respond(404, { statusCode: 404, error: "table_not_found" });
    expect(await sendTablesRequest({ method: "DELETE", path: "/tbl_99" })).toEqual({ ok: false, error: { kind: "not-found" } });
    respond(500, { statusCode: 500 });
    expect(await sendTablesRequest({ method: "DELETE", path: "/tbl_07" })).toEqual({ ok: false, error: { kind: "unknown" } });
  });
});
