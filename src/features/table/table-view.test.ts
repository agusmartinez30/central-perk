import { describe, expect, it } from "vitest";
import { SEED_ORDERS } from "@/mocks/table";
import type { TableOrder } from "@/mocks/types";
import { getTableView, TABLE_FORCED_STATES } from "./table-view";

const cancelledOnly: TableOrder[] = [{ ...SEED_ORDERS[0], status: "cancelled" }];

describe("getTableView", () => {
  it("shows the open account while the table is open or reopened", () => {
    expect(getTableView({ tableStatus: "open", orders: SEED_ORDERS }, null)).toBe("open");
    expect(getTableView({ tableStatus: "reopened", orders: SEED_ORDERS }, null)).toBe("open");
  });

  it("shows the requested account while the bill is requested or being attended", () => {
    expect(getTableView({ tableStatus: "requested", orders: SEED_ORDERS }, null)).toBe("requested");
    expect(getTableView({ tableStatus: "attending", orders: SEED_ORDERS }, null)).toBe("requested");
  });

  it("shows the closed account even without orders", () => {
    expect(getTableView({ tableStatus: "closed", orders: [] }, null)).toBe("closed");
  });

  it("shows the empty account when an open table has no billable orders", () => {
    expect(getTableView({ tableStatus: "open", orders: [] }, null)).toBe("empty");
    expect(getTableView({ tableStatus: "open", orders: cancelledOnly }, null)).toBe("empty");
  });

  it("lets a forced state override the store", () => {
    expect(getTableView({ tableStatus: "open", orders: SEED_ORDERS }, "error")).toBe("error");
    expect(getTableView({ tableStatus: "closed", orders: SEED_ORDERS }, "empty")).toBe("empty");
  });

  it("accepts the forced states of screens 07A–D", () => {
    expect(TABLE_FORCED_STATES).toEqual(["requested", "closed", "empty", "error"]);
  });
});
