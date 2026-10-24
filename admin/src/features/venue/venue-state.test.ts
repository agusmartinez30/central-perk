import { describe, expect, it } from "vitest";
import { SERVICE_DAY } from "@/mocks/service-day";
import { createEmptyTableDraft, toTableDraft } from "./table-config";
import { createVenueState, venueReducer, type VenueAction, type VenueState } from "./venue-state";

const credential = { token: "N3wT0k3nAa", today: SERVICE_DAY.date, staffName: "Sofía M." };
const run = (...actions: VenueAction[]) => actions.reduce(venueReducer, createVenueState());
const tableOf = (state: VenueState, id: string) => state.tables.find((table) => table.id === id);
const seed = createVenueState();

describe("createVenueState", () => {
  it("seeds spaces and tables from the service day with its live sessions and history", () => {
    expect(seed.spaces).toBe(SERVICE_DAY.spaces);
    expect(seed.tables).toBe(SERVICE_DAY.tables);
    expect(seed.sessions[7]).toBe("bill-requested");
    expect(seed.sessions[1]).toBe("available");
    expect(seed.history).toHaveLength(12);
  });
});

describe("spaces", () => {
  it("creates, renames, restyles, reorders and deletes an empty space", () => {
    const created = run({ type: "save-space", editingId: null, name: "Barra" });
    expect(created.spaces.at(-1)).toEqual({ id: "barra", name: "Barra", icon: "map-pin", tone: "neutral" });
    const renamed = venueReducer(created, { type: "save-space", editingId: "barra", name: "Barra alta", icon: "store", tone: "brand" });
    expect(renamed.spaces.at(-1)).toEqual({ id: "barra", name: "Barra alta", icon: "store", tone: "brand" });
    const moved = venueReducer(renamed, { type: "move-space", id: "barra", direction: -1 });
    expect(moved.spaces.map((space) => space.id)).toEqual(["salon", "terraza", "barra", "patio"]);
    expect(venueReducer(moved, { type: "delete-space", id: "barra" }).spaces).toEqual(SERVICE_DAY.spaces);
  });

  it("ignores an invalid name and a space that still has tables", () => {
    expect(run({ type: "save-space", editingId: null, name: " salon " })).toEqual(seed);
    expect(run({ type: "delete-space", id: "patio" })).toEqual(seed);
  });
});

describe("tables", () => {
  it("creates a table with a QR credential in the chosen space and shape", () => {
    const state = run(
      { type: "save-space", editingId: null, name: "Barra" },
      {
        type: "save-table",
        editingId: null,
        draft: { ...createEmptyTableDraft(SERVICE_DAY.tables, SERVICE_DAY.spaces), spaceId: "barra" },
        shape: "round",
        credential,
      },
    );
    expect(tableOf(state, "tbl_13")).toMatchObject({
      label: "Mesa 13",
      spaceId: "barra",
      enabled: true,
      qr: { token: "N3wT0k3nAa", generatedOn: SERVICE_DAY.date, generatedBy: "Sofía M." },
      layout: { x: 38, y: 64, width: 150, height: 132, shape: "round" },
    });
  });

  it("updates an existing table and ignores an invalid draft", () => {
    const draft = { ...toTableDraft(tableOf(seed, "tbl_07")!), capacity: "6" };
    const state = run({ type: "save-table", editingId: "tbl_07", draft, credential });
    expect(tableOf(state, "tbl_07")).toMatchObject({ capacity: 6, version: 19, qr: { token: "4pX9kR2mL7" } });
    expect(run({ type: "save-table", editingId: "tbl_07", draft: { ...draft, label: "Mesa 05" }, credential })).toEqual(seed);
  });

  it("enables and disables, but never disables a table with an open session", () => {
    const disabled = run({ type: "set-table-enabled", id: "tbl_01", enabled: false });
    expect(tableOf(disabled, "tbl_01")?.enabled).toBe(false);
    expect(tableOf(venueReducer(disabled, { type: "set-table-enabled", id: "tbl_01", enabled: true }), "tbl_01")?.enabled).toBe(true);
    expect(run({ type: "set-table-enabled", id: "tbl_07", enabled: false })).toEqual(seed);
  });

  it("deletes only tables that never had a session", () => {
    const created = run({
      type: "save-table",
      editingId: null,
      draft: createEmptyTableDraft(SERVICE_DAY.tables, SERVICE_DAY.spaces),
      credential,
    });
    expect(venueReducer(created, { type: "delete-table", id: "tbl_13" }).tables).toEqual(SERVICE_DAY.tables);
    expect(run({ type: "delete-table", id: "tbl_01" })).toEqual(seed);
  });

  it("moves a table on its plan and changes its shape", () => {
    const moved = run({ type: "move-table", id: "tbl_01", x: 37, y: 380 });
    expect(tableOf(moved, "tbl_01")?.layout).toEqual({ x: 40, y: 384, width: 150, height: 132, shape: "rect" });
    expect(run({ type: "move-table", id: "tbl_01", x: 222, y: 64 })).toEqual(seed);
    expect(tableOf(run({ type: "set-table-shape", id: "tbl_01", shape: "round" }), "tbl_01")?.layout.shape).toBe("round");
  });

  it("resizes a table on its plan and refuses a size over another table", () => {
    const resized = run({ type: "resize-table", id: "tbl_01", x: 38, y: 64, width: 184, height: 160 });
    expect(tableOf(resized, "tbl_01")).toMatchObject({ layout: { x: 38, y: 64, width: 184, height: 160, shape: "rect" }, version: 5 });
    expect(run({ type: "resize-table", id: "tbl_01", x: 38, y: 64, width: 240, height: 132 })).toEqual(seed);
  });

  it("rotates a table's QR credential", () => {
    const state = run({ type: "regenerate-qr", id: "tbl_07", ...credential });
    expect(tableOf(state, "tbl_07")?.qr?.token).toBe("N3wT0k3nAa");
    expect(tableOf(state, "tbl_07")?.revokedQrs[0]).toMatchObject({ token: "4pX9kR2mL7", auditId: "QR-119" });
  });
});
