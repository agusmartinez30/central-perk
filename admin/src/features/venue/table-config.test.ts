import { describe, expect, it } from "vitest";
import { SERVICE_DAY, type VenueTable } from "@/mocks/service-day";
import {
  applyTableDraft,
  createEmptyTableDraft,
  formatCapacity,
  getQuickToggle,
  getSessionStatuses,
  getTableChanges,
  nextTableId,
  nextTableNumber,
  setTableEnabled,
  toTableDraft,
  validateTableDraft,
  type TableDraft,
} from "./table-config";

const TODAY = SERVICE_DAY.date;
const tables = SERVICE_DAY.tables;
const sessions = getSessionStatuses(SERVICE_DAY);
const spaces = SERVICE_DAY.spaces;
const table = (id: string, list: readonly VenueTable[] = tables) => list.find((candidate) => candidate.id === id)!;
const context = (token = "N3wT0k3nAa") => ({ today: TODAY, staffName: "Sofía M.", createToken: () => token });

describe("session statuses", () => {
  it("derives Disponible / Ocupada / Cuenta solicitada from the service day", () => {
    expect(sessions[1]).toBe("available");
    expect(sessions[2]).toBe("occupied");
    expect(sessions[7]).toBe("bill-requested");
  });
});

describe("formatCapacity", () => {
  it("pluralizes people", () => {
    expect(formatCapacity(1)).toBe("1 persona");
    expect(formatCapacity(4)).toBe("4 personas");
  });
});

describe("table drafts", () => {
  it("starts a new table with the next free number and its label", () => {
    expect(nextTableNumber(tables)).toBe(13);
    expect(nextTableNumber([])).toBe(1);
    expect(nextTableId(tables)).toBe("tbl_13");
    expect(createEmptyTableDraft(tables, spaces)).toEqual({
      label: "Mesa 13",
      spaceId: "salon",
      capacity: "4",
      description: "",
      enabled: true,
    });
  });

  it("requires a unique label, a positive integer capacity and a short description", () => {
    const draft: TableDraft = { ...toTableDraft(table("tbl_07")), label: " mesa 05 ", capacity: "0" };
    expect(validateTableDraft(draft, tables, "tbl_07")).toEqual({
      label: "Ya existe una mesa con ese nombre.",
      capacity: "Ingresá un número entero entre 1 y 20.",
    });
    expect(validateTableDraft({ ...draft, label: "", capacity: "2.5" }, tables, "tbl_07")).toEqual({
      label: "Ingresá el nombre o número de la mesa.",
      capacity: "Ingresá un número entero entre 1 y 20.",
    });
    expect(
      validateTableDraft({ ...draft, label: "Mesa 07", capacity: "6", description: "x".repeat(61) }, tables, "tbl_07"),
    ).toEqual({ description: "Usá hasta 60 caracteres." });
    expect(validateTableDraft({ ...draft, label: "x".repeat(31), capacity: "21" }, tables, "tbl_07")).toEqual({
      label: "Usá hasta 30 caracteres.",
      capacity: "Ingresá un número entero entre 1 y 20.",
    });
    expect(validateTableDraft({ ...toTableDraft(table("tbl_07")), spaceId: "barra" }, tables, "tbl_07", spaces)).toEqual({
      spaceId: "Elegí un espacio.",
    });
    expect(validateTableDraft(toTableDraft(table("tbl_07")), tables, "tbl_07")).toEqual({});
    expect(validateTableDraft(createEmptyTableDraft(tables, spaces), tables, null)).toEqual({});
  });

  it("lists the changed fields", () => {
    const draft = { ...toTableDraft(table("tbl_07")), capacity: " 4 ", label: "Mesa 07 ", enabled: false };
    expect(getTableChanges(table("tbl_07"), draft)).toEqual(["enabled"]);
    expect(getTableChanges(table("tbl_07"), { ...draft, capacity: "6" })).toEqual(["capacity", "enabled"]);
    expect(getTableChanges(table("tbl_07"), toTableDraft(table("tbl_07")))).toEqual([]);
    expect(getTableChanges(null, createEmptyTableDraft(tables, spaces))).toEqual([
      "label",
      "spaceId",
      "capacity",
      "description",
      "enabled",
    ]);
  });

  it("saves an existing table keeping its id, number and QR, and bumps its version", () => {
    const draft = { ...toTableDraft(table("tbl_07")), label: " Ventana ", capacity: "6" };
    const result = applyTableDraft(tables, "tbl_07", draft, context());
    expect(result.id).toBe("tbl_07");
    expect(table("tbl_07", result.tables)).toMatchObject({
      id: "tbl_07",
      number: 7,
      label: "Ventana",
      capacity: 6,
      version: 19,
      qr: table("tbl_07").qr,
    });
    expect(result.tables).toHaveLength(12);
  });

  it("creates a new table with a fresh credential", () => {
    const result = applyTableDraft(tables, null, { ...createEmptyTableDraft(tables, spaces), spaceId: "patio" }, context());
    expect(result.id).toBe("tbl_13");
    expect(table("tbl_13", result.tables)).toEqual({
      id: "tbl_13",
      number: 13,
      label: "Mesa 13",
      spaceId: "patio",
      capacity: 4,
      description: "",
      enabled: true,
      version: 1,
      qr: { token: "N3wT0k3nAa", generatedOn: TODAY, generatedBy: "Sofía M." },
      revokedQrs: [],
      // Patio only uses the third row of the plan, so the first free spot is the top-left one.
      layout: { x: 38, y: 64, width: 150, height: 132, shape: "rect" },
    });
  });

  it("moves a table to a free spot of its new space", () => {
    const draft = { ...toTableDraft(table("tbl_01")), spaceId: "terraza" };
    expect(table("tbl_01", applyTableDraft(tables, "tbl_01", draft, context()).tables).layout).toEqual({
      x: 38,
      y: 64,
      width: 150,
      height: 132,
      shape: "rect",
    });
    const same = applyTableDraft(tables, "tbl_01", { ...toTableDraft(table("tbl_01")), capacity: "4" }, context());
    expect(table("tbl_01", same.tables).layout).toEqual(table("tbl_01").layout);
  });

});

describe("enable / disable", () => {
  it("blocks disabling a table with an open session from the quick action", () => {
    expect(getQuickToggle(table("tbl_07"), "bill-requested")).toEqual({
      enabled: true,
      label: "Deshabilitar mesa",
      allowed: false,
      reason: "No se puede deshabilitar mientras exista una cuenta activa.",
    });
    expect(getQuickToggle(table("tbl_01"), "available")).toEqual({
      enabled: true,
      label: "Deshabilitar mesa",
      allowed: true,
    });
  });

  it("always allows enabling a disabled table", () => {
    const disabled = { ...table("tbl_02"), enabled: false };
    expect(getQuickToggle(disabled, "occupied")).toEqual({ enabled: false, label: "Habilitar mesa", allowed: true });
  });

  it("toggles the configuration and bumps the version", () => {
    const changed = setTableEnabled(tables, "tbl_01", false);
    expect(table("tbl_01", changed)).toMatchObject({ enabled: false, version: table("tbl_01").version + 1 });
    expect(setTableEnabled(tables, "tbl_01", true)).toBe(tables);
  });
});
