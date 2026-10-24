import { describe, expect, it } from "vitest";
import { SERVICE_DAY } from "@/mocks/service-day";
import {
  PRINT_SIZES,
  getPrintableTables,
  getPrintSize,
  getSelectedTables,
  paginate,
  selectSpace,
  toggleAll,
  toggleSelection,
} from "./print-selection";

const tables = SERVICE_DAY.tables;

describe("getPrintableTables", () => {
  it("only includes enabled tables with an active credential, by number", () => {
    const changed = tables.map((table) =>
      table.number === 1 ? { ...table, enabled: false } : table.number === 2 ? { ...table, qr: null } : table,
    );
    expect(getPrintableTables([...changed].reverse()).map((table) => table.number)).toEqual([
      3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });
});

describe("selection", () => {
  const printable = getPrintableTables(tables);

  it("selects a whole spaceId", () => {
    expect(selectSpace(printable, "terraza")).toEqual(["tbl_05", "tbl_06", "tbl_08"]);
    expect(selectSpace(printable, "all")).toHaveLength(12);
  });

  it("toggles one table", () => {
    expect(toggleSelection(["tbl_01"], "tbl_02")).toEqual(["tbl_01", "tbl_02"]);
    expect(toggleSelection(["tbl_01", "tbl_02"], "tbl_01")).toEqual(["tbl_02"]);
  });

  it("selects every visible table, or clears them when all are selected", () => {
    const visible = printable.filter((table) => table.spaceId === "patio");
    expect(toggleAll(visible, ["tbl_01"])).toEqual(["tbl_01", "tbl_09", "tbl_10", "tbl_11", "tbl_12"]);
    expect(toggleAll(visible, ["tbl_01", "tbl_09", "tbl_10", "tbl_11", "tbl_12"])).toEqual(["tbl_01"]);
    expect(toggleAll([], ["tbl_01"])).toEqual(["tbl_01"]);
  });

  it("prints the selected eligible tables in number order", () => {
    expect(getSelectedTables(printable, ["tbl_09", "tbl_02", "tbl_99"]).map((table) => table.id)).toEqual([
      "tbl_02",
      "tbl_09",
    ]);
  });
});

describe("print sheets", () => {
  it("fits four A6 cards or six compact cards on an A4 sheet", () => {
    expect(PRINT_SIZES.map((size) => [size.id, size.label, size.perSheet])).toEqual([
      ["a6", "A6", 4],
      ["compact", "Compacta", 6],
    ]);
    expect(getPrintSize("compact").perSheet).toBe(6);
  });

  it("splits the cards into sheets", () => {
    expect(paginate([1, 2, 3, 4, 5], 4)).toEqual([[1, 2, 3, 4], [5]]);
    expect(paginate([], 4)).toEqual([]);
  });
});
