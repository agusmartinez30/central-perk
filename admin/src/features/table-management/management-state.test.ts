import { describe, expect, it } from "vitest";
import { SERVICE_DAY } from "@/mocks/service-day";
import { createVenueState, venueReducer, type VenueState } from "@/features/venue/venue-state";
import {
  createManagementState,
  getConfirmView,
  getDeepLinkActions,
  initManagementState,
  getPlanView,
  getSpaceFormView,
  getSpaceTabs,
  getTableFormView,
  reduceManagement,
  type ManagementAction,
  type ManagementState,
} from "./management-state";

const credential = { token: "N3wT0k3nAa", today: SERVICE_DAY.date, staffName: "Sofía M." };

type World = { ui: ManagementState; venue: VenueState };

/** Runs UI actions, applying each emitted venue action like the screen does with the store. */
function run(...actions: ManagementAction[]): World {
  let venue = createVenueState();
  let ui = createManagementState(venue);
  for (const action of actions) {
    const result = reduceManagement(ui, action, venue);
    if (result.venue) venue = venueReducer(venue, result.venue);
    ui = result.ui;
  }
  return { ui, venue };
}

const tableOf = (world: World, id: string) => world.venue.tables.find((table) => table.id === id);

describe("initial state", () => {
  it("opens the first space with its form in the side panel", () => {
    const { ui, venue } = run();
    expect(ui.spaceId).toBe("salon");
    expect(getSpaceFormView(ui, venue)).toMatchObject({ title: "Espacio", id: "salon", name: "Salón", error: null });
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
  it("selects a table into the form, switching to its space", () => {
    const world = run({ type: "select-table", id: "tbl_09" });
    expect(world.ui.spaceId).toBe("patio");
    expect(getTableFormView(world.ui, world.venue)).toMatchObject({
      title: "Editar mesa",
      idLabel: "ID estable · tbl_09 · versión 2",
      activeSession: false,
      canRemove: true,
      errors: {},
    });
    expect(getPlanView(world.ui, world.venue).tables.find((table) => table.id === "tbl_09")?.selected).toBe(true);
  });

  it("shows errors only after a blocked save", () => {
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
      { type: "save-table", credential },
    );
    expect(getTableFormView(saved.ui, saved.venue)?.errors).toEqual({
      label: "Ya existe una mesa con ese nombre.",
      capacity: "Ingresá un número entero entre 1 y 20.",
    });
    expect(saved.ui.notice).toEqual({ tone: "error", text: "Revisá los datos marcados." });
    expect(tableOf(saved, "tbl_07")?.label).toBe("Mesa 07");
  });

  it("saves an edit with its shape", () => {
    const world = run(
      { type: "select-table", id: "tbl_07" },
      { type: "set-table-field", field: "capacity", value: "6" },
      { type: "set-table-shape", shape: "round" },
      { type: "save-table", credential },
    );
    expect(tableOf(world, "tbl_07")).toMatchObject({ capacity: 6, layout: { shape: "round" }, version: 20 });
    expect(world.ui.notice).toEqual({ tone: "info", text: "Mesa 07 guardada." });
    expect(getTableFormView(world.ui, world.venue)?.idLabel).toBe("ID estable · tbl_07 · versión 20");
  });

  it("reports when nothing changed", () => {
    const world = run({ type: "select-table", id: "tbl_02" }, { type: "save-table", credential });
    expect(world.ui.notice).toEqual({ tone: "info", text: "Sin cambios en Mesa 02." });
    expect(world.venue).toEqual(createVenueState());
  });

  it("creates a table in the active space and selects it", () => {
    const opened = run({ type: "select-space", id: "terraza" }, { type: "new-table" });
    expect(getTableFormView(opened.ui, opened.venue)).toMatchObject({
      title: "Nueva mesa",
      idLabel: "ID estable · tbl_13 · se asigna al guardar",
      canRemove: false,
    });
    const world = run({ type: "select-space", id: "terraza" }, { type: "new-table" }, { type: "save-table", credential });
    expect(tableOf(world, "tbl_13")).toMatchObject({ label: "Mesa 13", spaceId: "terraza", qr: { token: "N3wT0k3nAa" } });
    expect(world.ui.notice?.text).toBe("Mesa 13 creada.");
    expect(getTableFormView(world.ui, world.venue)?.title).toBe("Editar mesa");
  });

  it("follows a table moved to another space", () => {
    const world = run(
      { type: "select-table", id: "tbl_01" },
      { type: "set-table-field", field: "spaceId", value: "patio" },
      { type: "save-table", credential },
    );
    expect(world.ui.spaceId).toBe("patio");
    expect(tableOf(world, "tbl_01")?.spaceId).toBe("patio");
  });

  it("cancels back to the space form without touching the venue", () => {
    const world = run(
      { type: "select-table", id: "tbl_07" },
      { type: "set-table-field", field: "label", value: "Ventana" },
      { type: "cancel" },
    );
    expect(world.ui.panel.kind).toBe("space");
    expect(tableOf(world, "tbl_07")?.label).toBe("Mesa 07");
  });

  it("dims disabled tables on the plan", () => {
    const world = run(
      { type: "select-table", id: "tbl_01" },
      { type: "set-table-field", field: "enabled", value: false },
      { type: "save-table", credential },
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
  it("creates a space, styles it and opens its plan", () => {
    const world = run(
      { type: "new-space" },
      { type: "set-space-field", field: "name", value: "Barra" },
      { type: "set-space-field", field: "icon", value: "store" },
      { type: "save-space" },
    );
    expect(world.venue.spaces.at(-1)).toEqual({ id: "barra", name: "Barra", icon: "store", tone: "neutral" });
    expect(world.ui.spaceId).toBe("barra");
    expect(world.ui.notice?.text).toBe("Espacio Barra creado.");
    expect(getPlanView(world.ui, world.venue).tables).toEqual([]);
  });

  it("keeps the form open with an error for a duplicate name", () => {
    const world = run({ type: "new-space" }, { type: "set-space-field", field: "name", value: "terraza" }, { type: "save-space" });
    expect(getSpaceFormView(world.ui, world.venue)).toMatchObject({ title: "Nuevo espacio", error: "Ese espacio ya existe." });
    expect(world.venue.spaces).toHaveLength(3);
  });

  it("renames the active space and reorders the spaces", () => {
    const world = run(
      { type: "set-space-field", field: "name", value: "Salón principal" },
      { type: "save-space" },
      { type: "move-space", id: "salon", direction: 1 },
    );
    expect(world.venue.spaces.map((space) => space.name)).toEqual(["Terraza", "Salón principal", "Patio"]);
  });
});

describe("deleting", () => {
  it("deletes a table that never had a session after confirming", () => {
    const created = [{ type: "new-table" }, { type: "save-table", credential }] as ManagementAction[];
    const asked = run(...created, { type: "request-delete" });
    expect(getConfirmView(asked.ui, asked.venue)).toEqual({
      title: "¿Eliminar Mesa 13?",
      description: "Se eliminan la mesa y su código QR. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar mesa",
      cancelLabel: "Cancelar",
      tone: "danger",
    });
    const world = run(...created, { type: "request-delete" }, { type: "confirm-delete" });
    expect(tableOf(world, "tbl_13")).toBeUndefined();
    expect(world.ui.notice?.text).toBe("Mesa 13 eliminada.");
    expect(world.ui.confirm).toBeNull();
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
  });

  it("only explains when a table with an open session cannot be removed", () => {
    const asked = run({ type: "select-table", id: "tbl_07" }, { type: "request-delete" });
    expect(getConfirmView(asked.ui, asked.venue)).toMatchObject({ confirmLabel: null, cancelLabel: "Entendido" });
    const world = run({ type: "select-table", id: "tbl_07" }, { type: "request-delete" }, { type: "cancel-delete" });
    expect(world.ui.confirm).toBeNull();
    expect(tableOf(world, "tbl_07")?.enabled).toBe(true);
  });

  it("deletes an empty space and blocks one with tables", () => {
    const blocked = run({ type: "select-space", id: "patio" }, { type: "request-delete" });
    expect(getConfirmView(blocked.ui, blocked.venue)).toMatchObject({
      title: "Patio no se puede eliminar",
      description: "Patio tiene 4 mesas. Mové o eliminá sus mesas antes de eliminar el espacio.",
      confirmLabel: null,
    });
    const world = run(
      { type: "new-space" },
      { type: "set-space-field", field: "name", value: "Barra" },
      { type: "save-space" },
      { type: "request-delete" },
      { type: "confirm-delete" },
    );
    expect(world.venue.spaces.map((space) => space.id)).toEqual(["salon", "terraza", "patio"]);
    expect(world.ui.spaceId).toBe("salon");
    expect(world.ui.notice?.text).toBe("Espacio Barra eliminado.");
  });
});

describe("deep links and forced variants", () => {
  it("maps ?table= and ?space= to the first selection", () => {
    expect(getDeepLinkActions({ table: "tbl_07", space: null })).toEqual([{ type: "select-table", id: "tbl_07" }]);
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
    expect(ui.panel.kind).toBe("table");
    expect(ui.notice).toBeNull();
    expect(venue.tables.find((table) => table.id === "tbl_09")?.layout).toMatchObject({ x: 38, y: 408 });
  });
});
