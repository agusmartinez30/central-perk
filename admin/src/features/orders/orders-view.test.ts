import { describe, expect, it } from "vitest";
import type { ManagedOrder } from "@/mocks/types";
import { ORDERS_BOARD, OVERVIEW_SNAPSHOT, TABLES_BOARD } from "@/mocks/service-day";
import {
  CANCELLATION_REASONS,
  advanceOrder,
  canCancelOrder,
  cancelOrder,
  countOrdersByColumn,
  filterOrders,
  formatOrderMeta,
  getBillRequestedTables,
  getCardNotice,
  formatOrderTotal,
  getHistoryLabel,
  getHistoryTone,
  getNextStatus,
  getOrderMetrics,
  getOrderTableOptions,
  getOrderTotal,
  getPrimaryAction,
  getStatusBadge,
  groupOrdersByColumn,
} from "./orders-view";

const order = (overrides: Partial<ManagedOrder> & Pick<ManagedOrder, "id">): ManagedOrder => ({
  tableNumber: 1,
  customer: "Ana",
  receivedAt: "12:00",
  items: [{ id: "item-1", quantity: 1, name: "Café", unitPrice: 3000 }],
  status: "received",
  history: [
    { kind: "confirmed", at: "12:00" },
    { kind: "received", at: "12:00" },
  ],
  ...overrides,
});

const received = order({ id: 1, tableNumber: 3 });
const preparing = order({ id: 2, tableNumber: 8, status: "preparing" });
const delivered = order({ id: 3, tableNumber: 6, status: "delivered" });
const cancelled = order({ id: 4, tableNumber: 2, status: "cancelled", cancellationReason: "order-error" });
const ALL = [received, preparing, delivered, cancelled];

/** Full cross-screen agreement lives in `src/mocks/service-day/service-day.test.ts`. */
describe("ORDERS_BOARD of the service day", () => {
  it("keeps the 03 board: 2 received, 2 preparing, 1 delivered, oldest first", () => {
    expect(ORDERS_BOARD.orders.map((o) => o.id)).toEqual([1047, 1048, 1050, 1051, 1052]);
    expect(countOrdersByColumn(ORDERS_BOARD.orders)).toEqual({ received: 2, preparing: 2, delivered: 1 });
  });

  it("adds up item lines to the card totals of the export", () => {
    const totals = Object.fromEntries(ORDERS_BOARD.orders.map((o) => [o.id, getOrderTotal(o)]));
    expect(totals).toEqual({ 1051: 13000, 1052: 18000, 1050: 11700, 1048: 6900, 1047: 8900 });
  });

  it("only uses tables that are seated in the 02 board", () => {
    for (const o of ORDERS_BOARD.orders) {
      const table = TABLES_BOARD.tables.find((t) => t.number === o.tableNumber);
      expect(table, `Mesa ${o.tableNumber}`).toBeDefined();
      expect(table?.status).not.toBe("available");
    }
  });

  it("keeps the customers and tables of the 10A attention orders", () => {
    for (const attention of OVERVIEW_SNAPSHOT.orders) {
      const match = ORDERS_BOARD.orders.find((o) => o.id === attention.id);
      expect(match?.customer).toBe(attention.customer);
      expect(match?.tableNumber).toBe(Number(attention.table));
      expect(match?.status).toBe(attention.status);
    }
  });
});

describe("getOrderMetrics", () => {
  it("counts the three kitchen stages and ignores cancelled orders", () => {
    expect(getOrderMetrics(ALL)).toEqual([
      { id: "received", label: "Recibidos", value: 1, tone: "brand" },
      { id: "preparing", label: "En preparación", value: 1, tone: "warning" },
      { id: "delivered", label: "Entregados", value: 1, tone: "success" },
    ]);
  });
});

describe("groupOrdersByColumn", () => {
  it("keeps each column in board order and drops cancelled orders", () => {
    const groups = groupOrdersByColumn([preparing, received, cancelled, delivered]);
    expect(groups.map((g) => [g.id, g.title, g.orders.map((o) => o.id)])).toEqual([
      ["received", "Recibidos", [1]],
      ["preparing", "En preparación", [2]],
      ["delivered", "Entregados", [3]],
    ]);
  });

  it("can hide the delivered column", () => {
    const groups = groupOrdersByColumn(ALL, { showDelivered: false });
    expect(groups.map((g) => g.id)).toEqual(["received", "preparing"]);
  });
});

describe("filterOrders", () => {
  it("filters by table", () => {
    expect(filterOrders(ALL, { table: 8, query: "" }).map((o) => o.id)).toEqual([2]);
  });

  it("searches by order number, with or without #", () => {
    const orders = ORDERS_BOARD.orders;
    expect(filterOrders(orders, { table: "all", query: "1051" }).map((o) => o.id)).toEqual([1051]);
    expect(filterOrders(orders, { table: "all", query: " #105 " }).map((o) => o.id)).toEqual([1050, 1051, 1052]);
  });

  it("searches by table number", () => {
    const orders = ORDERS_BOARD.orders;
    expect(filterOrders(orders, { table: "all", query: "Mesa 3" }).map((o) => o.id)).toEqual([1051]);
    expect(filterOrders(orders, { table: "all", query: "mesa 07" }).map((o) => o.id)).toEqual([1048]);
  });

  it("returns nothing for an unknown number", () => {
    expect(filterOrders(ALL, { table: "all", query: "9999" })).toEqual([]);
  });
});

describe("getOrderTableOptions", () => {
  it("lists every table with active orders, sorted, after 'Todas las mesas'", () => {
    expect(getOrderTableOptions(ALL)).toEqual([
      { value: "all", label: "Todas las mesas" },
      { value: 3, label: "Mesa 03" },
      { value: 6, label: "Mesa 06" },
      { value: 8, label: "Mesa 08" },
    ]);
  });
});

describe("status transitions", () => {
  it("moves forward one kitchen stage at a time", () => {
    expect(getNextStatus("received")).toBe("preparing");
    expect(getNextStatus("preparing")).toBe("delivered");
    expect(getNextStatus("delivered")).toBeNull();
    expect(getNextStatus("cancelled")).toBeNull();
  });

  it("labels the primary action of each stage", () => {
    expect(getPrimaryAction(received)).toEqual({ label: "Comenzar preparación", tone: "brand" });
    expect(getPrimaryAction(preparing)).toEqual({ label: "Marcar entregado", tone: "warning" });
    expect(getPrimaryAction(delivered)).toBeNull();
  });

  it("advances and records the change in the history", () => {
    const next = advanceOrder(received, "12:50");
    expect(next.status).toBe("preparing");
    expect(next.history.at(-1)).toEqual({ kind: "preparing", at: "12:50" });
    expect(received.status).toBe("received");
  });

  it("leaves finished orders untouched", () => {
    expect(advanceOrder(delivered, "12:50")).toBe(delivered);
    expect(advanceOrder(cancelled, "12:50")).toBe(cancelled);
  });

  it("only cancels orders the kitchen has not delivered", () => {
    expect(canCancelOrder(received)).toBe(true);
    expect(canCancelOrder(preparing)).toBe(true);
    expect(canCancelOrder(delivered)).toBe(false);
    expect(canCancelOrder(cancelled)).toBe(false);
  });

  it("cancels with a reason and a history entry", () => {
    const next = cancelOrder(preparing, "product-unavailable", "12:51");
    expect(next.status).toBe("cancelled");
    expect(next.cancellationReason).toBe("product-unavailable");
    expect(next.history.at(-1)).toEqual({ kind: "cancelled", at: "12:51" });
    expect(cancelOrder(delivered, "order-error", "12:51")).toBe(delivered);
  });

  it("offers the three cancellation reasons of the dialog", () => {
    expect(CANCELLATION_REASONS.map((r) => r.label)).toEqual([
      "Producto no disponible",
      "Solicitado por el cliente",
      "Error en el pedido",
    ]);
  });
});

describe("copy helpers", () => {
  it("formats the card meta line and total", () => {
    const first = ORDERS_BOARD.orders.find((o) => o.id === 1051)!;
    expect(formatOrderMeta(first)).toBe("Mesa 03 · Martina");
    expect(formatOrderTotal(first)).toBe("$13.000");
  });

  it("maps statuses to badges", () => {
    expect(getStatusBadge("received")).toEqual({ label: "Recibido", tone: "brand" });
    expect(getStatusBadge("preparing")).toEqual({ label: "En preparación", tone: "warning" });
    expect(getStatusBadge("delivered")).toEqual({ label: "Entregado", tone: "success" });
    expect(getStatusBadge("cancelled")).toEqual({ label: "Cancelado", tone: "danger" });
  });

  it("labels the history entries of the drawer", () => {
    expect(getHistoryLabel("confirmed")).toBe("Pedido confirmado");
    expect(getHistoryLabel("received")).toBe("Recibido en cocina");
  });

  it("colors history dots like the stage they reached", () => {
    expect(getHistoryTone("confirmed")).toBe("brand");
    expect(getHistoryTone("received")).toBe("brand");
    expect(getHistoryTone("preparing")).toBe("warning");
    expect(getHistoryTone("delivered")).toBe("success");
    expect(getHistoryTone("cancelled")).toBe("danger");
  });
});

describe("getCardNotice", () => {
  const withCustomization = order({
    id: 9,
    items: [
      { id: "a", quantity: 1, name: "Té", unitPrice: 2000 },
      { id: "b", quantity: 1, name: "Latte", unitPrice: 4000, customization: "Leche de almendras" },
    ],
    note: "Sin azúcar.",
  });

  it("shows the first product customization in the warning tone", () => {
    expect(getCardNotice(withCustomization, false)).toEqual({
      label: "Personalización",
      value: "Leche de almendras",
      tone: "warning",
    });
  });

  it("turns green once delivered and red when the table asked for the bill", () => {
    expect(getCardNotice({ ...withCustomization, status: "delivered" }, false)?.tone).toBe("success");
    expect(getCardNotice(withCustomization, true)).toEqual({
      label: "Personalización · Cuenta solicitada",
      value: "Leche de almendras",
      tone: "danger",
    });
  });

  it("has nothing to show without customizations", () => {
    expect(getCardNotice(received, false)).toBeNull();
  });
});

describe("getBillRequestedTables", () => {
  it("collects the 02 tables that requested the bill", () => {
    expect([...getBillRequestedTables(TABLES_BOARD.tables)].sort((a, b) => a - b)).toEqual([4, 5, 7, 10, 12]);
  });
});
