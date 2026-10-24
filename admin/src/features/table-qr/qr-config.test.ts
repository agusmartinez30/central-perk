import { describe, expect, it } from "vitest";
import { SERVICE_DAY, type VenueTable } from "@/mocks/service-day";
import { getSessionStatuses, setTableEnabled } from "@/features/venue/table-config";
import {
  filterTableRows,
  formatCredentialDate,
  getCredentialHistory,
  getTableMetrics,
  getTableRows,
  nextAuditId,
  regenerateTableQr,
} from "./qr-config";

const TODAY = SERVICE_DAY.date;
const tables = SERVICE_DAY.tables;
const sessions = getSessionStatuses(SERVICE_DAY);
const spaces = SERVICE_DAY.spaces;
const table = (id: string, list: readonly VenueTable[] = tables) => list.find((candidate) => candidate.id === id)!;
const context = (token = "N3wT0k3nAa") => ({ today: TODAY, staffName: "Sofía M.", createToken: () => token });

describe("getTableRows", () => {
  it("lists every table by number with space, capacity, configuration, session and QR status", () => {
    const rows = getTableRows(tables, sessions, spaces);
    expect(rows).toHaveLength(12);
    expect(rows[6]).toMatchObject({
      id: "tbl_07",
      label: "Mesa 07",
      spaceName: "Salón",
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
    const rows = getTableRows(changed, sessions, spaces);
    expect(rows[0].configuration.label).toBe("Deshabilitada");
    expect(rows[0].qr).toEqual({ status: "paused", label: "QR pausado" });
    expect(rows[1].qr).toEqual({ status: "missing", label: "Sin QR" });
  });

  it("treats a table without session data as available", () => {
    expect(getTableRows([{ ...table("tbl_01"), id: "tbl_13", number: 13 }], sessions, spaces)[0].session.status).toBe(
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
  const rows = getTableRows(tables, sessions, spaces);
  const ids = (query: string) =>
    filterTableRows(rows, { query, spaceId: "all", configuration: "all" }).map((row) => row.id);

  it("finds a table by label or unpadded number", () => {
    expect(ids("mesa 7")).toEqual(["tbl_07"]);
    expect(ids("12")).toEqual(["tbl_12"]);
    expect(ids("  MESA 1")).toEqual(["tbl_01", "tbl_10", "tbl_11", "tbl_12"]);
  });

  it("filters by space and configuration", () => {
    expect(
      filterTableRows(rows, { query: "", spaceId: "terraza", configuration: "all" }).map((row) => row.number),
    ).toEqual([5, 6, 8]);
    expect(filterTableRows(rows, { query: "", spaceId: "all", configuration: "disabled" })).toEqual([]);
    expect(filterTableRows(rows, { query: "", spaceId: "all", configuration: "enabled" })).toHaveLength(12);
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
