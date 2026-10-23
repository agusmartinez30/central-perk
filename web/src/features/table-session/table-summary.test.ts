import { describe, expect, it } from "vitest";
import { SEED_ORDERS } from "@/mocks/table";
import type { TableOrder } from "@/mocks/types";
import { formatOrderCount, formatUnitCount, getTableSummary } from "./table-summary";

const cancelled: TableOrder = { ...SEED_ORDERS[0], id: "order-1050", number: "1050", status: "cancelled" };

describe("getTableSummary", () => {
  it("computes total, orders and units from the seed orders", () => {
    expect(getTableSummary(SEED_ORDERS)).toEqual({ total: 13_000, orderCount: 1, itemCount: 3 });
  });

  it("leaves cancelled orders out of every figure", () => {
    expect(getTableSummary([...SEED_ORDERS, cancelled])).toEqual({
      total: 13_000,
      orderCount: 1,
      itemCount: 3,
    });
  });

  it("returns zeros for a table without orders", () => {
    expect(getTableSummary([])).toEqual({ total: 0, orderCount: 0, itemCount: 0 });
  });
});

describe("count labels", () => {
  it("pluralizes orders and units", () => {
    expect(formatOrderCount(0)).toBe("0 pedidos");
    expect(formatOrderCount(1)).toBe("1 pedido");
    expect(formatOrderCount(2)).toBe("2 pedidos");
    expect(formatUnitCount(1)).toBe("1 unidad");
    expect(formatUnitCount(4)).toBe("4 unidades");
  });
});
