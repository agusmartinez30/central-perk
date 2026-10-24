import { describe, expect, it } from "vitest";
import {
  createTableQrState,
  getEditorView,
  getListView,
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
