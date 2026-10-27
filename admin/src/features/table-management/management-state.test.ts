import { describe, expect, it } from "vitest";
import { createVenueState, venueReducer, type VenueState } from "@/features/venue/venue-state";
import {
  createManagementState,
  getConfirmView,
  getDeepLinkActions,
  failManagement,
  initManagementState,
  getPlanView,
  getSpaceFormView,
  getSpaceTabs,
  getTableFormView,
  reduceManagement,
  settleManagement,
  type ManagementAction,
  type ManagementState,
} from "./management-state";

type World = { ui: ManagementState; venue: VenueState };

/**
 * Runs UI actions, applying each emitted venue action like the screen does with the store and
 * settling the UI as if the API agreed with the prediction.
 */
function run(...actions: ManagementAction[]): World {
  let venue = createVenueState();
  let ui = createManagementState(venue);
  for (const action of actions) {
    const result = reduceManagement(ui, action, venue);
    if (result.venue) {
      const before = venue;
      venue = venueReducer(venue, result.venue);
      ui = settleManagement(result.ui, before, venue);
    } else {
      ui = result.ui;
    }
  }
  return { ui, venue };
}

const tableOf = (world: World, id: string) => world.venue.tables.find((table) => table.id === id);
const hasSelection = (world: World) => getPlanView(world.ui, world.venue).tables.some((table) => table.selected);

describe("initial state", () => {
  it("opens the first space's plan with no form open", () => {
    const world = run();
    const { ui, venue } = world;
    expect(ui.spaceId).toBe("salon");
    expect(ui.modal).toBeNull();
    expect(getSpaceFormView(ui, venue)).toBeNull();
    expect(getTableFormView(ui, venue)).toBeNull();
    expect(hasSelection(world)).toBe(false);
    expect(getSpaceTabs(venue).map((tab) => [tab.name, tab.count])).toEqual([
      ["Salón", 5],
      ["Terraza", 3],
      ["Patio", 4],
    ]);
  });

  it("draws the active space's tables with label, capacity, shape and enabled state", () => {
    const { ui, venue } = run({ type: "select-space", id: "patio" });
    const plan = getPlanView(ui, venue);
    expect(plan.spaceName).toBe("Patio");
    expect(plan.tables.map((table) => table.label)).toEqual(["Mesa 09", "Mesa 10", "Mesa 11", "Mesa 12"]);
    expect(plan.tables[0]).toMatchObject({ capacityLabel: "4 personas", shape: "round", enabled: true, selected: false });
    expect(plan.tables[0].chairs).toHaveLength(4);
  });

  it("draws every table at its stored size, with its chairs spread along it", () => {
    const { ui, venue } = run({ type: "select-space", id: "terraza" });
    const long = getPlanView(ui, venue).tables.find((table) => table.label === "Mesa 08")!;
    expect(long).toMatchObject({ capacity: 6, width: 184, height: 132 });
    for (const chair of long.chairs) expect(chair.x + chair.width).toBeLessThanOrEqual(184);
  });
});

describe("tables", () => {
  it("opens a clicked table in the modal, switching to its space", () => {
    const world = run({ type: "select-table", id: "tbl_09" });
    expect(world.ui.spaceId).toBe("patio");
    expect(world.ui.modal?.kind).toBe("table");
    expect(getTableFormView(world.ui, world.venue)).toMatchObject({
      title: "Editar mesa",
      idLabel: "ID estable · tbl_09 · versión 2",
      activeSession: false,
      canRemove: true,
      saving: false,
      errors: {},
    });
    expect(getPlanView(world.ui, world.venue).tables.find((table) => table.id === "tbl_09")?.selected).toBe(true);
  });

  it("shows errors only after a blocked save, keeping the modal open", () => {
    const typed = run(
      { type: "select-table", id: "tbl_07" },
      { type: "set-table-field", field: "label", value: "Mesa 05" },
      { type: "set-table-field", field: "capacity", value: "0" },
    );
    expect(getTableFormView(typed.ui, typed.venue)?.errors).toEqual({});
    const saved = run(
      { type: "select-table", id: "tbl_07" },
      { type: "set-table-field", field: "label", value: "Mesa 05" },
      { type: "set-table-field", field: "capacity", value: "0" },
      { type: "save-table" },
    );
    expect(getTableFormView(saved.ui, saved.venue)?.errors).toEqual({
      label: "Ya existe una mesa con ese nombre.",
      capacity: "Ingresá un número entero entre 1 y 20.",
    });
    expect(saved.ui.notice).toEqual({ tone: "error", text: "Revisá los datos marcados." });
    expect(saved.ui.modal?.kind).toBe("table");
    expect(tableOf(saved, "tbl_07")?.label).toBe("Mesa 07");
  });

  it("saves an edit with its shape and closes the modal", () => {
    const world = run(
      { type: "select-table", id: "tbl_07" },
      { type: "set-table-field", field: "capacity", value: "6" },
      { type: "set-table-shape", shape: "round" },
      { type: "save-table" },
    );
    expect(tableOf(world, "tbl_07")).toMatchObject({ capacity: 6, layout: { shape: "round" }, version: 20 });
    expect(world.ui.notice).toEqual({ tone: "info", text: "Mesa 07 guardada." });
    expect(world.ui.modal).toBeNull();
    expect(hasSelection(world)).toBe(false);
  });

  it("keeps the modal open, marked as saving, until the API answers", () => {
    const opened = run({ type: "select-table", id: "tbl_07" }, { type: "set-table-field", field: "capacity", value: "6" });
    const pending = reduceManagement(opened.ui, { type: "save-table" }, opened.venue);
    expect(pending.venue?.type).toBe("save-table");
    expect(pending.ui.modal?.kind).toBe("table");
    expect(getTableFormView(pending.ui, opened.venue)?.saving).toBe(true);
    // A second save while the first is pending sends nothing.
    expect(reduceManagement(pending.ui, { type: "save-table" }, opened.venue).venue).toBeUndefined();
  });

  it("reports when nothing changed and closes the modal", () => {
    const world = run({ type: "select-table", id: "tbl_02" }, { type: "save-table" });
    expect(world.ui.notice).toEqual({ tone: "info", text: "Sin cambios en Mesa 02." });
    expect(world.ui.modal).toBeNull();
    expect(world.venue).toEqual(createVenueState());
  });

  it("creates a table in the active space and closes the modal", () => {
    const opened = run({ type: "select-space", id: "terraza" }, { type: "new-table" });
    expect(getTableFormView(opened.ui, opened.venue)).toMatchObject({
      title: "Nueva mesa",
      idLabel: "ID estable · tbl_13 · se asigna al guardar",
      canRemove: false,
    });
    const world = run({ type: "select-space", id: "terraza" }, { type: "new-table" }, { type: "save-table" });
    expect(tableOf(world, "tbl_13")).toMatchObject({ label: "Mesa 13", spaceId: "terraza", qr: null });
    expect(world.ui.notice?.text).toBe("Mesa 13 creada.");
    expect(world.ui.modal).toBeNull();
  });

  it("follows a table moved to another space", () => {
    const world = run(
      { type: "select-table", id: "tbl_01" },
      { type: "set-table-field", field: "spaceId", value: "patio" },
      { type: "save-table" },
    );
    expect(world.ui.spaceId).toBe("patio");
    expect(tableOf(world, "tbl_01")?.spaceId).toBe("patio");
  });

  it("cancel closes the modal without touching the venue", () => {
    const world = run(
      { type: "select-table", id: "tbl_07" },
      { type: "set-table-field", field: "label", value: "Ventana" },
      { type: "cancel" },
    );
    expect(world.ui.modal).toBeNull();
    expect(world.ui.spaceId).toBe("salon");
    expect(hasSelection(world)).toBe(false);
    expect(tableOf(world, "tbl_07")?.label).toBe("Mesa 07");
  });

  it("dims disabled tables on the plan", () => {
    const world = run(
      { type: "select-table", id: "tbl_01" },
      { type: "set-table-field", field: "enabled", value: false },
      { type: "save-table" },
    );
    expect(getPlanView(world.ui, world.venue).tables[0]).toMatchObject({ id: "tbl_01", enabled: false });
  });
});

describe("moving tables", () => {
  it("moves a table to the snapped drop point", () => {
    const world = run({ type: "move-table", id: "tbl_01", x: 37, y: 380 });
    expect(tableOf(world, "tbl_01")?.layout).toMatchObject({ x: 40, y: 384 });
    expect(world.ui.notice).toEqual({ tone: "info", text: "Mesa 01 movida." });
  });

  it("refuses an overlapping drop and explains why", () => {
    const world = run({ type: "move-table", id: "tbl_01", x: 230, y: 70 });
    expect(tableOf(world, "tbl_01")?.layout).toMatchObject({ x: 38, y: 64 });
    expect(world.ui.notice).toEqual({ tone: "error", text: "Mesa 01 no entra ahí: se superpone con Mesa 02." });
  });
});

describe("resizing tables", () => {
  it("saves the dragged size and announces it", () => {
    const world = run({ type: "resize-table", id: "tbl_01", x: 38, y: 64, width: 184, height: 160 });
    expect(tableOf(world, "tbl_01")?.layout).toMatchObject({ x: 38, y: 64, width: 184, height: 160 });
    expect(world.ui.notice).toEqual({ tone: "info", text: "Mesa 01: tamaño actualizado." });
  });

  it("refuses a size over another table and explains why", () => {
    const world = run({ type: "resize-table", id: "tbl_01", x: 38, y: 64, width: 240, height: 132 });
    expect(tableOf(world, "tbl_01")?.layout).toMatchObject({ width: 150, height: 132 });
    expect(world.ui.notice).toEqual({ tone: "error", text: "Mesa 01 no entra con ese tamaño: se superpone con Mesa 02." });
  });

  it("ignores unknown tables", () => {
    const world = run({ type: "resize-table", id: "nope", x: 0, y: 0, width: 150, height: 132 });
    expect(world.ui.notice).toBeNull();
  });
});

describe("spaces", () => {
  it("switches the plan without opening a form", () => {
    const world = run({ type: "select-space", id: "terraza" });
    expect(world.ui.spaceId).toBe("terraza");
    expect(world.ui.modal).toBeNull();
  });

  it("opens a space in the modal to edit it", () => {
    const world = run({ type: "edit-space", id: "patio" });
    expect(world.ui.spaceId).toBe("patio");
    expect(getSpaceFormView(world.ui, world.venue)).toMatchObject({ title: "Espacio", id: "patio", name: "Patio", error: null, saving: false });
    expect(run({ type: "edit-space", id: "nope" }).ui.modal).toBeNull();
  });

  it("creates a space, styles it and opens its plan", () => {
    const opened = run({ type: "new-space" });
    expect(getSpaceFormView(opened.ui, opened.venue)).toMatchObject({ title: "Nuevo espacio", id: null, name: "" });
    const world = run(
      { type: "new-space" },
      { type: "set-space-field", field: "name", value: "Barra" },
      { type: "set-space-field", field: "icon", value: "store" },
      { type: "save-space" },
    );
    expect(world.venue.spaces.at(-1)).toEqual({ id: "barra", name: "Barra", icon: "store", tone: "neutral" });
    expect(world.ui.spaceId).toBe("barra");
    expect(world.ui.notice?.text).toBe("Espacio Barra creado.");
    expect(world.ui.modal).toBeNull();
    expect(getPlanView(world.ui, world.venue).tables).toEqual([]);
  });

  it("keeps the form open with an error for a duplicate name", () => {
    const world = run({ type: "new-space" }, { type: "set-space-field", field: "name", value: "terraza" }, { type: "save-space" });
    expect(getSpaceFormView(world.ui, world.venue)).toMatchObject({ title: "Nuevo espacio", error: "Ese espacio ya existe." });
    expect(world.venue.spaces).toHaveLength(3);
  });

  it("renames a space and reorders the spaces", () => {
    const world = run(
      { type: "edit-space", id: "salon" },
      { type: "set-space-field", field: "name", value: "Salón principal" },
      { type: "save-space" },
      { type: "move-space", id: "salon", direction: 1 },
    );
    expect(world.venue.spaces.map((space) => space.name)).toEqual(["Terraza", "Salón principal", "Patio"]);
    expect(world.ui.modal).toBeNull();
  });
});

describe("deleting", () => {
  it("deletes a table that never had a session after confirming, closing the modal", () => {
    const created = [{ type: "new-table" }, { type: "save-table" }, { type: "select-table", id: "tbl_13" }] as ManagementAction[];
    const asked = run(...created, { type: "request-delete" });
    expect(getConfirmView(asked.ui, asked.venue)).toEqual({
      title: "¿Eliminar Mesa 13?",
      description: "Se eliminan la mesa y su código QR. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar mesa",
      cancelLabel: "Cancelar",
      tone: "danger",
    });
    expect(asked.ui.modal?.kind).toBe("table");
    const world = run(...created, { type: "request-delete" }, { type: "confirm-delete" });
    expect(tableOf(world, "tbl_13")).toBeUndefined();
    expect(world.ui.notice?.text).toBe("Mesa 13 eliminada.");
    expect(world.ui.confirm).toBeNull();
    expect(world.ui.modal).toBeNull();
  });

  it("offers to disable a table with history instead", () => {
    const asked = run({ type: "select-table", id: "tbl_01" }, { type: "request-delete" });
    expect(getConfirmView(asked.ui, asked.venue)).toMatchObject({
      title: "Mesa 01 no se puede eliminar",
      confirmLabel: "Deshabilitar mesa",
      cancelLabel: "Cancelar",
    });
    const world = run({ type: "select-table", id: "tbl_01" }, { type: "request-delete" }, { type: "confirm-delete" });
    expect(tableOf(world, "tbl_01")).toMatchObject({ enabled: false });
    expect(world.ui.notice?.text).toBe("Mesa 01 deshabilitada.");
    expect(world.ui.modal).toBeNull();
  });

  it("only explains when a table with an open session cannot be removed", () => {
    const asked = run({ type: "select-table", id: "tbl_07" }, { type: "request-delete" });
    expect(getConfirmView(asked.ui, asked.venue)).toMatchObject({ confirmLabel: null, cancelLabel: "Entendido" });
    const world = run({ type: "select-table", id: "tbl_07" }, { type: "request-delete" }, { type: "cancel-delete" });
    expect(world.ui.confirm).toBeNull();
    expect(world.ui.modal?.kind).toBe("table");
    expect(tableOf(world, "tbl_07")?.enabled).toBe(true);
  });

  it("deletes an empty space and blocks one with tables", () => {
    const blocked = run({ type: "edit-space", id: "patio" }, { type: "request-delete" });
    expect(getConfirmView(blocked.ui, blocked.venue)).toMatchObject({
      title: "Patio no se puede eliminar",
      description: "Patio tiene 4 mesas. Mové o eliminá sus mesas antes de eliminar el espacio.",
      confirmLabel: null,
    });
    const world = run(
      { type: "new-space" },
      { type: "set-space-field", field: "name", value: "Barra" },
      { type: "save-space" },
      { type: "edit-space", id: "barra" },
      { type: "request-delete" },
      { type: "confirm-delete" },
    );
    expect(world.venue.spaces.map((space) => space.id)).toEqual(["salon", "terraza", "patio"]);
    expect(world.ui.spaceId).toBe("salon");
    expect(world.ui.notice?.text).toBe("Espacio Barra eliminado.");
    expect(world.ui.modal).toBeNull();
  });
});

describe("deep links and forced variants", () => {
  it("maps ?table= and ?space= to the modal they open", () => {
    expect(getDeepLinkActions({ table: "tbl_07", space: null })).toEqual([{ type: "select-table", id: "tbl_07" }]);
    expect(getDeepLinkActions({ table: null, space: "terraza" })).toEqual([{ type: "edit-space", id: "terraza" }]);
    // With a table too, the space only picks the plan the table modal opens over.
    expect(getDeepLinkActions({ table: "new", space: "terraza" })).toEqual([{ type: "select-space", id: "terraza" }, { type: "new-table" }]);
    expect(getDeepLinkActions({ table: null, space: "new" })).toEqual([{ type: "new-space" }]);
    expect(getDeepLinkActions({ table: null, space: null })).toEqual([]);
  });

  it("replays UI actions without ever touching the venue", () => {
    const venue = createVenueState();
    const ui = initManagementState(venue, [
      { type: "select-table", id: "tbl_09" },
      { type: "move-table", id: "tbl_09", x: 0, y: 0 },
    ]);
    expect(ui.spaceId).toBe("patio");
    expect(ui.modal?.kind).toBe("table");
    expect(ui.notice).toBeNull();
    expect(venue.tables.find((table) => table.id === "tbl_09")?.layout).toMatchObject({ x: 38, y: 408 });
  });

  it("opens the matching modal from a deep link", () => {
    const venue = createVenueState();
    const space = initManagementState(venue, getDeepLinkActions({ table: null, space: "terraza" }));
    expect(getSpaceFormView(space, venue)).toMatchObject({ id: "terraza" });
    const created = initManagementState(venue, getDeepLinkActions({ table: "new", space: "terraza" }));
    expect(created.spaceId).toBe("terraza");
    expect(getTableFormView(created, venue)?.title).toBe("Nueva mesa");
  });
});

describe("settling with the API", () => {
  it("closes the modal once the API created the table, whatever number it got", () => {
    const before = run({ type: "select-space", id: "terraza" }, { type: "new-table" });
    const result = reduceManagement(before.ui, { type: "save-table" }, before.venue);
    expect(result.venue?.type).toBe("save-table");
    // The API never reuses numbers: Mesa 13 was deleted earlier, so the new table is tbl_14.
    const created = { ...venueReducer(before.venue, result.venue!).tables.at(-1)!, id: "tbl_14", number: 14 };
    const after = { ...before.venue, tables: [...before.venue.tables, created] };
    const settled = settleManagement(result.ui, before.venue, after);
    expect(settled.modal).toBeNull();
    expect(settled.saving).toBe(false);
    expect(settled.spaceId).toBe("terraza");
  });

  it("opens the space the API created", () => {
    const before = run({ type: "new-space" }, { type: "set-space-field", field: "name", value: "Barra" });
    const result = reduceManagement(before.ui, { type: "save-space" }, before.venue);
    const after = { ...before.venue, spaces: [...before.venue.spaces, { id: "barra-2", name: "Barra", icon: "map-pin" as const, tone: "neutral" as const }] };
    const settled = settleManagement(result.ui, before.venue, after);
    expect(settled.spaceId).toBe("barra-2");
    expect(settled.modal).toBeNull();
  });

  it("only closes the modal when the API agrees with the prediction", () => {
    const before = run({ type: "select-table", id: "tbl_07" }, { type: "set-table-field", field: "capacity", value: "6" });
    const result = reduceManagement(before.ui, { type: "save-table" }, before.venue);
    const after = venueReducer(before.venue, result.venue!);
    expect(settleManagement(result.ui, before.venue, after)).toEqual({ ...result.ui, modal: null, saving: false });
  });

  it("leaves an open form alone when an unrelated change settles", () => {
    const opened = run({ type: "select-table", id: "tbl_07" });
    const venue = venueReducer(opened.venue, { type: "move-space", id: "salon", direction: 1 });
    expect(settleManagement(opened.ui, opened.venue, venue)).toEqual(opened.ui);
  });

  it("restores the previous UI with the API's reason when it refuses, keeping the modal open", () => {
    const opened = run({ type: "select-table", id: "tbl_07" }, { type: "set-table-field", field: "label", value: "Mesa 99" });
    const action = reduceManagement(opened.ui, { type: "save-table" }, opened.venue).venue!;
    const failed = failManagement(opened.ui, action, { kind: "invalid", issues: [{ path: "label", code: "duplicate" }] }, opened.venue);
    expect(failed.notice).toEqual({ tone: "error", text: "Revisá los datos marcados." });
    expect(getTableFormView(failed, opened.venue)?.errors).toEqual({ label: "Ya existe una mesa con ese nombre." });
    expect(failed.modal).toMatchObject({ kind: "table", form: { draft: { label: "Mesa 99" } } });
    expect(failed.saving).toBe(false);
    // Typing again clears the server's verdict.
    const typed = reduceManagement(failed, { type: "set-table-field", field: "label", value: "Mesa 98" }, opened.venue).ui;
    expect(getTableFormView(typed, opened.venue)?.errors).toEqual({});
  });

  it("shows the space name issue the API reports", () => {
    const opened = run({ type: "new-space" }, { type: "set-space-field", field: "name", value: "Barra" });
    const action = reduceManagement(opened.ui, { type: "save-space" }, opened.venue).venue!;
    const failed = failManagement(opened.ui, action, { kind: "invalid", issues: [{ path: "name", code: "duplicate" }] }, opened.venue);
    expect(getSpaceFormView(failed, opened.venue)?.error).toBe("Ese espacio ya existe.");
    expect(failed.notice).toEqual({ tone: "error", text: "Revisá el nombre del espacio." });
  });

  it("closes the delete dialog, keeps the modal and explains a conflict", () => {
    const asked = run({ type: "new-table" }, { type: "save-table" }, { type: "select-table", id: "tbl_13" }, { type: "request-delete" });
    const action = reduceManagement(asked.ui, { type: "confirm-delete" }, asked.venue).venue!;
    const failed = failManagement(asked.ui, action, { kind: "conflict", code: "table_has_history" }, asked.venue);
    expect(failed.confirm).toBeNull();
    expect(failed.modal?.kind).toBe("table");
    expect(failed.notice).toEqual({
      tone: "error",
      text: "Mesa 13 tiene sesiones registradas: su historial se conserva, por eso no se puede eliminar.",
    });
  });
});
