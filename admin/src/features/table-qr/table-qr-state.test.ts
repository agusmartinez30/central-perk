import { describe, expect, it } from "vitest";
import {
  createTableQrState,
  getDetailView,
  getEditorView,
  getListView,
  getMaterialView,
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

  it("searches and filters by sector and configuration", () => {
    expect(getListView(run({ type: "set-query", query: "7" })).rows.map((row) => row.id)).toEqual(["tbl_07"]);
    expect(getListView(run({ type: "set-sector", sector: "patio" })).rows).toHaveLength(4);
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

describe("editor (09B)", () => {
  it("opens Mesa 07 with its stable id, version and the active-session warning", () => {
    const state = run({ type: "open-edit", id: "tbl_07" });
    expect(state.view).toBe("editor");
    expect(getEditorView(state)).toMatchObject({
      title: "Editar mesa",
      idLabel: "ID estable · tbl_07 · versión 18",
      activeSession: true,
      errors: {},
    });
    expect(state.editor?.draft).toEqual({
      label: "Mesa 07",
      sector: "interior",
      capacity: "4",
      description: "Cerca de la ventana",
      enabled: true,
    });
  });

  it("hides the active-session warning for a free table", () => {
    expect(getEditorView(run({ type: "open-edit", id: "tbl_01" }))?.activeSession).toBe(false);
  });

  it("shows errors only after a blocked save and keeps the editor open", () => {
    const typed = run(
      { type: "open-edit", id: "tbl_07" },
      { type: "editor-set-field", field: "label", value: "Mesa 05" },
      { type: "editor-set-field", field: "capacity", value: "0" },
    );
    expect(getEditorView(typed)?.errors).toEqual({});
    const saved = tableQrReducer(typed, { type: "editor-save", token: "N3wT0k3nAa" });
    expect(saved.view).toBe("editor");
    expect(getEditorView(saved)?.errors).toEqual({
      label: "Ya existe una mesa con ese nombre.",
      capacity: "Ingresá un número entero entre 1 y 20.",
    });
    expect(tableOf(saved, "tbl_07").label).toBe("Mesa 07");
  });

  it("saves a valid edit, bumps the version and goes back to the list", () => {
    const state = run(
      { type: "open-edit", id: "tbl_07" },
      { type: "editor-set-field", field: "capacity", value: "6" },
      { type: "editor-set-field", field: "enabled", value: false },
      { type: "editor-save", token: "N3wT0k3nAa" },
    );
    expect(state.view).toBe("list");
    expect(tableOf(state, "tbl_07")).toMatchObject({ capacity: 6, enabled: false, version: 19 });
    expect(tableOf(state, "tbl_07").qr?.token).toBe("4pX9kR2mL7");
    expect(state.notice).toBe("Mesa 07 guardada.");
  });

  it("closes without changes when nothing was edited", () => {
    const state = run({ type: "open-edit", id: "tbl_02" }, { type: "editor-save", token: "N3wT0k3nAa" });
    expect(state.view).toBe("list");
    expect(tableOf(state, "tbl_02").version).toBe(tableOf(createTableQrState(), "tbl_02").version);
    expect(state.notice).toBe("Sin cambios en Mesa 02.");
  });

  it("creates a new table with the next number and a fresh QR", () => {
    const opened = run({ type: "open-new" });
    expect(getEditorView(opened)).toMatchObject({
      title: "Nueva mesa",
      idLabel: "ID estable · tbl_13 · se asigna al guardar",
      activeSession: false,
    });
    const state = tableQrReducer(
      tableQrReducer(opened, { type: "editor-set-field", field: "sector", value: "terraza" }),
      { type: "editor-save", token: "N3wT0k3nAa" },
    );
    expect(tableOf(state, "tbl_13")).toMatchObject({ label: "Mesa 13", sector: "terraza", qr: { token: "N3wT0k3nAa" } });
    expect(getListView(state).metrics.total).toBe(13);
    expect(getListView(state).rows.at(-1)?.session.label).toBe("Disponible");
  });

  it("cancels without touching the tables", () => {
    const state = run(
      { type: "open-edit", id: "tbl_07" },
      { type: "editor-set-field", field: "label", value: "Ventana" },
      { type: "close-editor" },
    );
    expect(state.view).toBe("list");
    expect(state.editor).toBeNull();
    expect(tableOf(state, "tbl_07").label).toBe("Mesa 07");
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
      meta: "Interior · 4 personas",
      identity: "Mesa 07 · Interior",
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

  it("rotates the token on confirm: the URL changes and the old token is revoked", () => {
    const state = run(
      { type: "open-detail", id: "tbl_07" },
      { type: "open-regenerate" },
      { type: "confirm-regenerate", token: "Q7wE3rT9yU" },
    );
    const view = getDetailView(state);
    expect(state.regenerating).toBe(false);
    expect(view?.url).toBe("http://localhost:3000/?mesa=07&qr=Q7wE3rT9yU");
    expect(view?.history.map((row) => row.meta)).toEqual([
      "Generado hoy · Sofía M.",
      "Rotado hoy · auditoría #QR-119",
      "Rotado hoy · auditoría #QR-118",
    ]);
    expect(state.notice).toBe("Código QR de Mesa 07 regenerado. El código anterior dejó de funcionar.");
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
