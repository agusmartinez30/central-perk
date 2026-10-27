import { describe, expect, it } from "vitest";
import { createVenueState, venueReducer, type VenueAction } from "@/features/venue/venue-state";
import {
  createTableQrState,
  getBulkView,
  getDetailView,
  getListView,
  getMaterialView,
  getVenueCommand,
  tableQrReducer,
  type TableQrAction,
  type TableQrState,
} from "./table-qr-state";

const run = (...actions: TableQrAction[]) => actions.reduce(tableQrReducer, createTableQrState());
const tableOf = (state: TableQrState, id: string) => state.tables.find((table) => table.id === id)!;

describe("list (09A)", () => {
  it("starts on the list with the twelve tables and the 09A metrics", () => {
    const view = getListView(createTableQrState());
    expect(view.metrics).toEqual({ total: 12, enabled: 12, withoutQr: 0, disabled: 0 });
    expect(view.rows.map((row) => row.label)).toEqual([
      "Mesa 01", "Mesa 02", "Mesa 03", "Mesa 04", "Mesa 05", "Mesa 06",
      "Mesa 07", "Mesa 08", "Mesa 09", "Mesa 10", "Mesa 11", "Mesa 12",
    ]);
  });

  it("searches and filters by space and configuration", () => {
    expect(getListView(run({ type: "set-query", query: "7" })).rows.map((row) => row.id)).toEqual(["tbl_07"]);
    expect(getListView(run({ type: "set-space", space: "patio" })).rows).toHaveLength(4);
    const disabled = run({ type: "toggle-enabled", id: "tbl_01" }, { type: "set-configuration", configuration: "disabled" });
    expect(getListView(disabled).rows.map((row) => row.id)).toEqual(["tbl_01"]);
    expect(getListView(disabled).metrics.disabled).toBe(1);
  });

  it("refuses to disable a table with an open session from the quick action", () => {
    const state = run({ type: "toggle-enabled", id: "tbl_07" });
    expect(tableOf(state, "tbl_07").enabled).toBe(true);
    expect(state.notice).toBe("No se puede deshabilitar mientras exista una cuenta activa.");
    const enabledAgain = run({ type: "toggle-enabled", id: "tbl_01" }, { type: "toggle-enabled", id: "tbl_01" });
    expect(tableOf(enabledAgain, "tbl_01").enabled).toBe(true);
    expect(enabledAgain.notice).toBe("Mesa 01 habilitada.");
  });
});

describe("QR detail (09C) and regeneration (09F)", () => {
  it("opens the QR of Mesa 07 with its URL and credential history", () => {
    const state = run({ type: "open-detail", id: "tbl_07" });
    expect(state.view).toBe("detail");
    expect(getDetailView(state)).toMatchObject({
      tableId: "tbl_07",
      label: "Mesa 07",
      title: "Código QR · Mesa 07",
      meta: "Salón · 4 personas",
      identity: "Mesa 07 · Salón",
      stableId: "ID interno estable · tbl_07",
      url: "http://localhost:3000/?mesa=07&qr=4pX9kR2mL7",
      displayUrl: "localhost:3000/?mesa=07&qr=4pX9kR2mL7",
      history: [
        { status: "active", meta: "Generado hoy · Sofía M." },
        { status: "revoked", meta: "Rotado hoy · auditoría #QR-118" },
      ],
    });
    expect(state.regenerating).toBe(false);
  });

  it("asks for confirmation before rotating the token, and cancelling keeps it", () => {
    const asked = run({ type: "open-detail", id: "tbl_07" }, { type: "open-regenerate" });
    expect(asked.regenerating).toBe(true);
    const cancelled = tableQrReducer(asked, { type: "cancel-regenerate" });
    expect(cancelled.regenerating).toBe(false);
    expect(getDetailView(cancelled)?.url).toBe(getDetailView(asked)?.url);
  });

  it("closes the confirmation on confirm and announces the rotation the API made", () => {
    const state = run({ type: "open-detail", id: "tbl_07" }, { type: "open-regenerate" }, { type: "confirm-regenerate" });
    expect(state.regenerating).toBe(false);
    expect(state.notice).toBe("Código QR de Mesa 07 regenerado. El código anterior dejó de funcionar.");
  });

  it("shows the credential the API issued and the rotated ones", () => {
    const seed = createTableQrState();
    const tables = seed.tables.map((table) =>
      table.id === "tbl_07" && table.qr
        ? {
            ...table,
            qr: { token: "Q7wE3rT9yU", generatedOn: "2026-10-21", generatedBy: "Sofía M." },
            revokedQrs: [{ ...table.qr, revokedOn: "2026-10-21", auditId: "QR-119" }, ...table.revokedQrs],
          }
        : table,
    );
    const view = getDetailView(tableQrReducer({ ...seed, tables }, { type: "open-detail", id: "tbl_07" }));
    expect(view?.url).toBe("http://localhost:3000/?mesa=07&qr=Q7wE3rT9yU");
    expect(view?.history.map((row) => row.meta)).toEqual([
      "Generado hoy · Sofía M.",
      "Rotado hoy · auditoría #QR-119",
      "Rotado hoy · auditoría #QR-118",
    ]);
  });

  it("opens the regeneration straight from the list menu", () => {
    const state = run({ type: "open-regenerate", id: "tbl_03" });
    expect(state.view).toBe("detail");
    expect(state.detailId).toBe("tbl_03");
    expect(state.regenerating).toBe(true);
  });

  it("closes the drawer back to the list", () => {
    const state = run({ type: "open-detail", id: "tbl_07" }, { type: "close-detail" });
    expect(state.view).toBe("list");
    expect(state.detailId).toBeNull();
  });
});

describe("printable material (09D)", () => {
  it("shows the card of the table and the first compact A4 sheet", () => {
    const state = run({ type: "open-material", id: "tbl_07" });
    expect(state.view).toBe("material");
    const view = getMaterialView(state);
    expect(view?.card).toMatchObject({ tableId: "tbl_07", title: "MESA 07", url: "http://localhost:3000/?mesa=07&qr=4pX9kR2mL7" });
    expect(view?.sheet.map((card) => card.title)).toEqual(["MESA 01", "MESA 02", "MESA 03", "MESA 04", "MESA 05", "MESA 06"]);
  });

  it("has no card for a table that cannot be printed", () => {
    const state = run({ type: "toggle-enabled", id: "tbl_01" }, { type: "open-material", id: "tbl_01" });
    expect(getMaterialView(state)?.card).toBeNull();
    expect(getMaterialView(state)?.sheet[0].title).toBe("MESA 02");
  });
});

describe("bulk print (09E)", () => {
  it("opens over the list with every printable table selected and A6 cards", () => {
    const state = run({ type: "open-bulk" });
    expect(state.view).toBe("list");
    const view = getBulkView(state);
    expect(view).toMatchObject({ countLabel: "12 seleccionados", allSelected: true, size: "a6", canExport: true });
    expect(view?.rows[0]).toEqual({ id: "tbl_01", label: "Mesa 01 · Salón", selected: true });
    expect(view?.sheets.map((sheet) => sheet.length)).toEqual([4, 4, 4]);
    expect(view?.preview.map((card) => card.title)).toEqual(["MESA 01", "MESA 02", "MESA 03", "MESA 04"]);
  });

  it("selects a whole space and lists only its tables", () => {
    const view = getBulkView(run({ type: "open-bulk" }, { type: "bulk-set-space", space: "terraza" }));
    expect(view?.rows.map((row) => row.label)).toEqual(["Mesa 05 · Terraza", "Mesa 06 · Terraza", "Mesa 08 · Terraza"]);
    expect(view?.countLabel).toBe("3 seleccionados");
  });

  it("toggles one table and all visible tables", () => {
    const one = run({ type: "open-bulk" }, { type: "bulk-toggle", id: "tbl_02" });
    expect(getBulkView(one)?.countLabel).toBe("11 seleccionados");
    expect(getBulkView(one)?.allSelected).toBe(false);
    const none = tableQrReducer(tableQrReducer(one, { type: "bulk-toggle-all" }), { type: "bulk-toggle-all" });
    expect(getBulkView(none)).toMatchObject({ countLabel: "0 seleccionados", canExport: false, sheets: [] });
    expect(getBulkView(tableQrReducer(none, { type: "bulk-toggle", id: "tbl_09" }))?.countLabel).toBe("1 seleccionado");
  });

  it("lays out six compact cards per sheet", () => {
    const view = getBulkView(run({ type: "open-bulk" }, { type: "bulk-set-size", size: "compact" }));
    expect(view?.sheets.map((sheet) => sheet.length)).toEqual([6, 6]);
    expect(view?.preview).toHaveLength(6);
  });

  it("only offers enabled tables with an active QR", () => {
    const view = getBulkView(run({ type: "toggle-enabled", id: "tbl_01" }, { type: "open-bulk" }));
    expect(view?.rows.map((row) => row.id)).not.toContain("tbl_01");
    expect(view?.countLabel).toBe("11 seleccionados");
  });

  it("closes the modal", () => {
    expect(run({ type: "open-bulk" }, { type: "close-bulk" }).bulk).toBeNull();
  });
});

describe("shared venue (Gestión de mesas)", () => {
  it("lists a space and a table created in Gestión de mesas, with its QR and no session", () => {
    const local = [
      { type: "save-space", editingId: null, name: "Barra" },
      {
        type: "save-table",
        editingId: null,
        draft: { label: "Mesa 13", spaceId: "barra", capacity: "2", description: "", enabled: true },
      },
    ].reduce((state, action) => venueReducer(state, action as VenueAction), createVenueState());
    // The API issues the credential of a new table.
    const qr = { token: "N3wT0k3nAa", generatedOn: "2026-10-21", generatedBy: "Sofía M." };
    const venue = { ...local, tables: local.tables.map((table) => (table.id === "tbl_13" ? { ...table, qr } : table)) };
    const view = getListView(createTableQrState(venue));
    expect(view.rows.at(-1)).toMatchObject({
      label: "Mesa 13",
      spaceName: "Barra",
      session: { label: "Disponible" },
      qr: { status: "active" },
    });
    expect(getDetailView(tableQrReducer(createTableQrState(venue), { type: "open-detail", id: "tbl_13" }))?.url).toBe(
      "http://localhost:3000/?mesa=13&qr=N3wT0k3nAa",
    );
  });
});

describe("venue commands", () => {
  it("sends allowed quick toggles and confirmed rotations to the venue store", () => {
    const state = createTableQrState();
    expect(getVenueCommand(state, { type: "toggle-enabled", id: "tbl_01" })).toEqual({ type: "set-table-enabled", id: "tbl_01", enabled: false });
    expect(getVenueCommand(state, { type: "toggle-enabled", id: "tbl_07" })).toBeNull();
    const asked = run({ type: "open-detail", id: "tbl_07" }, { type: "open-regenerate" });
    expect(getVenueCommand(asked, { type: "confirm-regenerate" })).toEqual({ type: "regenerate-qr", id: "tbl_07" });
    expect(getVenueCommand(state, { type: "confirm-regenerate" })).toBeNull();
    expect(getVenueCommand(state, { type: "open-detail", id: "tbl_07" })).toBeNull();
  });
});
