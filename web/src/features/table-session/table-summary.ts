import { getOrderTotal } from "@/mocks/table";
import type { Ars, TableOrder } from "@/mocks/types";

export type TableSummary = {
  /** Shared account total. */
  total: Ars;
  /** Orders that count towards the bill. */
  orderCount: number;
  /** Units across those orders (sum of quantities). */
  itemCount: number;
};

/**
 * Figures shown on the table and bill screens, always computed from the order lines;
 * cancelled orders are left out of every figure, as the account excludes them.
 */
export function getTableSummary(orders: readonly TableOrder[]): TableSummary {
  return orders
    .filter((order) => order.status !== "cancelled")
    .reduce<TableSummary>(
      (summary, order) => ({
        total: summary.total + getOrderTotal(order),
        orderCount: summary.orderCount + 1,
        itemCount: summary.itemCount + order.lines.reduce((sum, line) => sum + line.quantity, 0),
      }),
      { total: 0, orderCount: 0, itemCount: 0 },
    );
}

export function formatOrderCount(count: number): string {
  return `${count} ${count === 1 ? "pedido" : "pedidos"}`;
}

export function formatUnitCount(count: number): string {
  return `${count} ${count === 1 ? "unidad" : "unidades"}`;
}
