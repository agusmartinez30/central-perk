import type { TableOrder } from "@/mocks/types";
import type { TableStatus } from "@/features/table-session";

/** Variants of screen 07: open account plus 07A–D. */
export type TableView = "open" | "requested" | "closed" | "empty" | "error";

/** Variants that `?state=` can force on `/table`. */
export const TABLE_FORCED_STATES = ["requested", "closed", "empty", "error"] as const;
export type TableForcedState = (typeof TABLE_FORCED_STATES)[number];

type TableViewInput = {
  tableStatus: TableStatus;
  orders: readonly TableOrder[];
};

/** Picks the screen 07 variant from the table session; a forced state always wins. */
export function getTableView(
  { tableStatus, orders }: TableViewInput,
  forced: TableForcedState | null,
): TableView {
  if (forced) return forced;
  if (tableStatus === "closed") return "closed";
  if (tableStatus === "requested" || tableStatus === "attending") return "requested";
  const hasBillableOrders = orders.some((order) => order.status !== "cancelled");
  return hasBillableOrders ? "open" : "empty";
}
