import { describe, expect, it } from "vitest";
import { SERVICE_DAY, type VenueTable } from "@/mocks/service-day";
import {
  applyTableDraft,
  createEmptyTableDraft,
  filterTableRows,
  formatCapacity,
  formatCredentialDate,
  getCredentialHistory,
  getQuickToggle,
  getSessionStatuses,
  getTableChanges,
  getTableMetrics,
  getTableRows,
  nextAuditId,
  nextTableNumber,
  regenerateTableQr,
  setTableEnabled,
  toTableDraft,
  validateTableDraft,
  type TableDraft,
} from "./table-config";

const TODAY = SERVICE_DAY.date;
const tables = SERVICE_DAY.tables;
const sessions = getSessionStatuses(SERVICE_DAY);
const table = (id: string, list: readonly VenueTable[] = tables) => list.find((candidate) => candidate.id === id)!;
const context = (token = "N3wT0k3nAa") => ({ today: TODAY, staffName: "Sofía M.", createToken: () => token });

describe("session statuses", () => {
  it("derives Disponible / Ocupada / Cuenta solicitada from the service day", () => {
    expect(sessions[1]).toBe("available");
    expect(sessions[2]).toBe("occupied");
    expect(sessions[7]).toBe("bill-requested");
  });
});

describe("getTableRows", () => {
  it("lists every table by number with sector, capacity, configuration, session and QR status", () => {
    const rows = getTableRows(tables, sessions);
    expect(rows).toHaveLength(12);
    expect(rows[6]).toMatchObject({
      id: "tbl_07",
      label: "Mesa 07",
      sectorLabel: "Interior",
      capacityLabel: "4 personas",
      configuration: { enabled: true, label: "Habilitada" },
      session: { status: "bill-requested", label: "Cuenta solicitada" },
      qr: { status: "active", label: "QR activo" },
    });
  });

  it("pauses the QR of a disabled table and flags tables without credential", () => {
    const changed = [
      { ...table("tbl_01"), enabled: false },
      { ...table("tbl_02"), qr: null },
    ];
    const rows = getTableRows(changed, sessions);
    expect(rows[0].configuration.label).toBe("Deshabilitada");
    expect(rows[0].qr).toEqual({ status: "paused", label: "QR pausado" });
    expect(rows[1].qr).toEqual({ status: "missing", label: "Sin QR" });
  });

  it("treats a table without session data as available", () => {
    expect(getTableRows([{ ...table("tbl_01"), id: "tbl_13", number: 13 }], sessions)[0].session.status).toBe(
      "available",
    );
  });
});

describe("getTableMetrics", () => {
  it("counts total, enabled, without QR and disabled tables", () => {
    expect(getTableMetrics(tables)).toEqual({ total: 12, enabled: 12, withoutQr: 0, disabled: 0 });
    const changed = setTableEnabled(tables, "tbl_01", false);
    expect(getTableMetrics(changed)).toEqual({ total: 12, enabled: 11, withoutQr: 0, disabled: 1 });
  });
});

describe("filterTableRows", () => {
  const rows = getTableRows(tables, sessions);
  const ids = (query: string) =>
    filterTableRows(rows, { query, sector: "all", configuration: "all" }).map((row) => row.id);

  it("finds a table by label or unpadded number", () => {
    expect(ids("mesa 7")).toEqual(["tbl_07"]);
    expect(ids("12")).toEqual(["tbl_12"]);
    expect(ids("  MESA 1")).toEqual(["tbl_01", "tbl_10", "tbl_11", "tbl_12"]);
  });

  it("filters by sector and configuration", () => {
    expect(
      filterTableRows(rows, { query: "", sector: "terraza", configuration: "all" }).map((row) => row.number),
    ).toEqual([5, 6, 8]);
    expect(filterTableRows(rows, { query: "", sector: "all", configuration: "disabled" })).toEqual([]);
    expect(filterTableRows(rows, { query: "", sector: "all", configuration: "enabled" })).toHaveLength(12);
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
    expect(createEmptyTableDraft(tables)).toEqual({
      label: "Mesa 13",
      sector: "interior",
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
    expect(validateTableDraft(toTableDraft(table("tbl_07")), tables, "tbl_07")).toEqual({});
    expect(validateTableDraft(createEmptyTableDraft(tables), tables, null)).toEqual({});
  });

  it("lists the changed fields", () => {
    const draft = { ...toTableDraft(table("tbl_07")), capacity: " 4 ", label: "Mesa 07 ", enabled: false };
    expect(getTableChanges(table("tbl_07"), draft)).toEqual(["enabled"]);
    expect(getTableChanges(table("tbl_07"), { ...draft, capacity: "6" })).toEqual(["capacity", "enabled"]);
    expect(getTableChanges(table("tbl_07"), toTableDraft(table("tbl_07")))).toEqual([]);
    expect(getTableChanges(null, createEmptyTableDraft(tables))).toEqual([
      "label",
      "sector",
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
    const result = applyTableDraft(tables, null, { ...createEmptyTableDraft(tables), sector: "patio" }, context());
    expect(result.id).toBe("tbl_13");
    expect(table("tbl_13", result.tables)).toEqual({
      id: "tbl_13",
      number: 13,
      label: "Mesa 13",
      sector: "patio",
      capacity: 4,
      description: "",
      enabled: true,
      version: 1,
      qr: { token: "N3wT0k3nAa", generatedOn: TODAY, generatedBy: "Sofía M." },
      revokedQrs: [],
    });
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

describe("regenerateTableQr", () => {
  it("revokes the active token with an audit entry and issues a new one", () => {
    const changed = regenerateTableQr(tables, "tbl_07", context("Q7wE3rT9yU"));
    const updated = table("tbl_07", changed);
    expect(updated.qr).toEqual({ token: "Q7wE3rT9yU", generatedOn: TODAY, generatedBy: "Sofía M." });
    expect(updated.revokedQrs[0]).toEqual({ ...table("tbl_07").qr, revokedOn: TODAY, auditId: "QR-119" });
    expect(updated.revokedQrs).toHaveLength(2);
    expect(updated.version).toBe(19);
    expect(nextAuditId(tables)).toBe("QR-119");
    expect(nextAuditId(changed)).toBe("QR-120");
  });

  it("issues a first credential to a table without QR", () => {
    const withoutQr = tables.map((candidate) => (candidate.id === "tbl_01" ? { ...candidate, qr: null } : candidate));
    const updated = table("tbl_01", regenerateTableQr(withoutQr, "tbl_01", context()));
    expect(updated.qr?.token).toBe("N3wT0k3nAa");
    expect(updated.revokedQrs).toEqual(table("tbl_01").revokedQrs);
  });
});

describe("credential history", () => {
  it("lists the active credential then the revoked ones", () => {
    expect(getCredentialHistory(table("tbl_07"), TODAY)).toEqual([
      { key: "4pX9kR2mL7", status: "active", label: "Activo", meta: "Generado hoy · Sofía M." },
      {
        key: table("tbl_07").revokedQrs[0].token,
        status: "revoked",
        label: "Revocado",
        meta: "Rotado hoy · auditoría #QR-118",
      },
    ]);
  });

  it("formats past dates as day and short month", () => {
    expect(formatCredentialDate("2026-06-12", TODAY)).toBe("12 jun");
    expect(formatCredentialDate("2026-03-02", TODAY)).toBe("2 mar");
    expect(formatCredentialDate(TODAY, TODAY)).toBe("hoy");
  });
});
