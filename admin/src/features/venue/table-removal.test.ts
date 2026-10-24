import { describe, expect, it } from "vitest";
import { SERVICE_DAY, type VenueTable } from "@/mocks/service-day";
import { deleteTable, getTableNumbersWithHistory, getTableRemoval } from "./table-removal";

const tables = SERVICE_DAY.tables;
const table = (id: string) => tables.find((candidate) => candidate.id === id)!;
const created: VenueTable = { ...table("tbl_01"), id: "tbl_13", number: 13, label: "Mesa 13" };

describe("getTableNumbersWithHistory", () => {
  it("lists every table that ever had a session in the service day", () => {
    expect(getTableNumbersWithHistory(SERVICE_DAY)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe("getTableRemoval", () => {
  it("deletes a table that never had a session", () => {
    expect(getTableRemoval(created, { hadSession: false, session: "available" })).toEqual({ kind: "delete" });
  });

  it("offers to disable a table with session history instead", () => {
    expect(getTableRemoval(table("tbl_01"), { hadSession: true, session: "available" })).toEqual({
      kind: "disable",
      reason: "Mesa 01 tiene sesiones registradas: su historial se conserva, por eso no se puede eliminar. Podés deshabilitarla para que no admita nuevas sesiones.",
    });
  });

  it("blocks both while a session is open or when the table is already disabled", () => {
    expect(getTableRemoval(table("tbl_07"), { hadSession: true, session: "bill-requested" })).toEqual({
      kind: "blocked",
      reason: "Mesa 07 tiene una cuenta activa: no se puede eliminar ni deshabilitar hasta que se cierre.",
    });
    expect(getTableRemoval({ ...table("tbl_01"), enabled: false }, { hadSession: true, session: "available" })).toEqual({
      kind: "blocked",
      reason: "Mesa 01 tiene sesiones registradas: su historial se conserva, por eso no se puede eliminar. Ya está deshabilitada.",
    });
  });
});

describe("deleteTable", () => {
  it("removes the table and its QR credential", () => {
    expect(deleteTable([...tables, created], "tbl_13")).toEqual(tables);
    expect(deleteTable(tables, "nope")).toBe(tables);
  });
});
