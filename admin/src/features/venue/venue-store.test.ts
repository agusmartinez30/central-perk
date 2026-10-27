import { describe, expect, it, vi } from "vitest";
import type { VenueTable } from "@/mocks/service-day";
import type { TablesRequest, TablesResult, VenueConfig } from "./tables-api";
import { createVenueStore } from "./venue-store";
import { createVenueState } from "./venue-state";

const seed = createVenueState();
const CONFIG: VenueConfig = { spaces: [...seed.spaces], tables: [...seed.tables] };
const ok = (value: VenueConfig): TablesResult<VenueConfig> => ({ ok: true, value });

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup(load = vi.fn(async () => ok(CONFIG))) {
  const send = vi.fn<(request: TablesRequest) => Promise<TablesResult<VenueConfig>>>(async () => ok(CONFIG));
  const onUnauthorized = vi.fn();
  const store = createVenueStore({ load, send }, { onUnauthorized });
  return { store, load, send, onUnauthorized };
}

async function ready(store: ReturnType<typeof createVenueStore>) {
  store.subscribe(() => {});
  await vi.waitFor(() => expect(store.getLoad()).toEqual({ status: "ready" }));
}

const tableOf = (tables: readonly VenueTable[], id: string) => tables.find((table) => table.id === id)!;

describe("createVenueStore", () => {
  it("is loading and empty (also on the server) until the first subscriber loads the API configuration", async () => {
    const { store, load } = setup();
    expect(store.getLoad()).toEqual({ status: "loading" });
    expect(store.getServerLoad()).toEqual({ status: "loading" });
    expect(store.getVenue().tables).toEqual([]);
    expect(store.getServerVenue().tables).toEqual([]);
    expect(load).not.toHaveBeenCalled();

    const listener = vi.fn();
    store.subscribe(listener);
    store.subscribe(() => {});
    await vi.waitFor(() => expect(store.getLoad()).toEqual({ status: "ready" }));
    expect(load).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getVenue().tables).toEqual(CONFIG.tables);
    // Live service facts still come from the service day.
    expect(store.getVenue().sessions).toEqual(seed.sessions);
    expect(store.getVenue().history).toEqual(seed.history);
  });

  it("shows an error when the configuration cannot be loaded, and retries on demand", async () => {
    const load = vi.fn(async (): Promise<TablesResult<VenueConfig>> => ({ ok: false, error: { kind: "network" } }));
    const { store } = setup(load);
    store.subscribe(() => {});
    await vi.waitFor(() =>
      expect(store.getLoad()).toEqual({ status: "error", message: "No pudimos conectarnos con el servidor. Probá de nuevo en unos segundos." }),
    );
    load.mockResolvedValueOnce(ok(CONFIG));
    await store.reload();
    expect(store.getLoad()).toEqual({ status: "ready" });
  });

  it("signs out on 401 and loads again for the next subscriber", async () => {
    const load = vi.fn(async (): Promise<TablesResult<VenueConfig>> => ({ ok: false, error: { kind: "unauthorized" } }));
    const { store, onUnauthorized } = setup(load);
    store.subscribe(() => {});
    await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
    expect(store.getLoad()).toEqual({ status: "loading" });
    load.mockResolvedValueOnce(ok(CONFIG));
    store.subscribe(() => {});
    await vi.waitFor(() => expect(store.getLoad()).toEqual({ status: "ready" }));
  });

  it("replaces spaces and tables with the configuration the API answers", async () => {
    const { store, send } = setup();
    await ready(store);
    const server: VenueConfig = { ...CONFIG, spaces: [...CONFIG.spaces, { id: "barra", name: "Barra", icon: "map-pin", tone: "neutral" }] };
    send.mockResolvedValueOnce(ok(server));
    const before = store.getVenue();

    const outcome = await store.commit({ type: "save-space", editingId: null, name: "Barra" });
    expect(send).toHaveBeenCalledWith({ method: "POST", path: "/spaces", body: { name: "Barra" } });
    expect(outcome).toEqual({ ok: true, before, venue: store.getVenue() });
    expect(store.getVenue().spaces).toEqual(server.spaces);
  });

  it("does not change anything until the API answers, and keeps the state when it refuses", async () => {
    const { store, send } = setup();
    await ready(store);
    const answer = deferred<TablesResult<VenueConfig>>();
    send.mockReturnValueOnce(answer.promise);
    const before = store.getVenue();
    const pending = store.commit({ type: "delete-table", id: "tbl_01" });
    expect(store.getVenue()).toBe(before);
    answer.resolve({ ok: false, error: { kind: "conflict", code: "table_has_history" } });
    expect(await pending).toEqual({ ok: false, error: { kind: "conflict", code: "table_has_history" } });
    expect(store.getVenue()).toBe(before);
  });

  it("moves a table locally on drop, then keeps the server's layout or reverts on error", async () => {
    const { store, send } = setup();
    await ready(store);
    const answer = deferred<TablesResult<VenueConfig>>();
    send.mockReturnValueOnce(answer.promise);
    const pending = store.commit({ type: "move-table", id: "tbl_01", x: 37, y: 380 });
    expect(tableOf(store.getVenue().tables, "tbl_01").layout).toMatchObject({ x: 40, y: 384 });
    answer.resolve({ ok: false, error: { kind: "network" } });
    await pending;
    expect(tableOf(store.getVenue().tables, "tbl_01").layout).toEqual(tableOf(CONFIG.tables, "tbl_01").layout);

    const moved = CONFIG.tables.map((table) => (table.id === "tbl_01" ? { ...table, layout: { ...table.layout, x: 40, y: 384 }, version: 9 } : table));
    send.mockResolvedValueOnce(ok({ ...CONFIG, tables: moved }));
    await store.commit({ type: "move-table", id: "tbl_01", x: 37, y: 380 });
    expect(tableOf(store.getVenue().tables, "tbl_01")).toMatchObject({ version: 9, layout: { x: 40, y: 384 } });
  });

  it("sends several requests in order and keeps what the API already saved when a later one fails", async () => {
    const { store, send } = setup();
    await ready(store);
    const mesa07 = tableOf(CONFIG.tables, "tbl_07");
    const edited = CONFIG.tables.map((table) => (table.id === "tbl_07" ? { ...table, capacity: 6, version: 19 } : table));
    send.mockResolvedValueOnce(ok({ ...CONFIG, tables: edited }));
    send.mockResolvedValueOnce({ ok: false, error: { kind: "network" } });
    const draft = { label: mesa07.label, spaceId: mesa07.spaceId, capacity: "6", description: mesa07.description, enabled: true };

    const outcome = await store.commit({ type: "save-table", editingId: "tbl_07", draft, shape: "round" });
    expect(send.mock.calls.map(([request]) => request.path)).toEqual(["/tbl_07", "/tbl_07/shape"]);
    expect(outcome).toEqual({ ok: false, error: { kind: "network" } });
    expect(tableOf(store.getVenue().tables, "tbl_07")).toMatchObject({ capacity: 6, version: 19 });
  });

  it("signs out when a change answers 401", async () => {
    const { store, send, onUnauthorized } = setup();
    await ready(store);
    send.mockResolvedValueOnce({ ok: false, error: { kind: "unauthorized" } });
    await store.commit({ type: "regenerate-qr", id: "tbl_07" });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
