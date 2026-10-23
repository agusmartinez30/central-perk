import { describe, expect, it } from "vitest";
import { ORDERS_BOARD } from "@/mocks/service-day";
import { countOrdersByColumn } from "./orders-view";
import {
  createOrdersState,
  formatClock,
  getCancelTarget,
  getSelectedOrder,
  ordersReducer,
} from "./orders-state";

const initial = createOrdersState(ORDERS_BOARD.orders);

describe("createOrdersState", () => {
  it("starts with nothing open unless asked", () => {
    expect(initial.selectedId).toBeNull();
    expect(initial.cancelTargetId).toBeNull();
    const forced = createOrdersState(ORDERS_BOARD.orders, { selectedId: 1051, cancelTargetId: 1051 });
    expect(getSelectedOrder(forced)?.id).toBe(1051);
    expect(getCancelTarget(forced)?.id).toBe(1051);
  });
});

describe("ordersReducer", () => {
  it("opens and closes the detail drawer, ignoring unknown orders", () => {
    const open = ordersReducer(initial, { type: "open-detail", id: 1052 });
    expect(getSelectedOrder(open)?.id).toBe(1052);
    expect(ordersReducer(open, { type: "close-detail" }).selectedId).toBeNull();
    expect(ordersReducer(initial, { type: "open-detail", id: 1 })).toBe(initial);
  });

  it("advances an order and keeps the drawer on it", () => {
    const open = ordersReducer(initial, { type: "open-detail", id: 1051 });
    const next = ordersReducer(open, { type: "advance", id: 1051, at: "12:50" });
    expect(getSelectedOrder(next)?.status).toBe("preparing");
    expect(countOrdersByColumn(next.orders)).toEqual({ received: 1, preparing: 3, delivered: 1 });
    expect(initial.orders.find((o) => o.id === 1051)?.status).toBe("received");
  });

  it("only asks to cancel orders that can still be cancelled", () => {
    const asked = ordersReducer(initial, { type: "request-cancel", id: 1051 });
    expect(getCancelTarget(asked)?.id).toBe(1051);
    expect(ordersReducer(initial, { type: "request-cancel", id: 1047 })).toBe(initial);
  });

  it("keeps the order untouched when the dialog is dismissed", () => {
    const asked = ordersReducer(initial, { type: "request-cancel", id: 1051 });
    const back = ordersReducer(asked, { type: "dismiss-cancel" });
    expect(back.cancelTargetId).toBeNull();
    expect(back.orders).toBe(initial.orders);
  });

  it("cancels only after confirming, closing the dialog and its drawer", () => {
    const open = ordersReducer(initial, { type: "open-detail", id: 1051 });
    const asked = ordersReducer(open, { type: "request-cancel", id: 1051 });
    const done = ordersReducer(asked, { type: "confirm-cancel", reason: "customer-request", at: "12:52" });
    const cancelled = done.orders.find((o) => o.id === 1051);
    expect(cancelled?.status).toBe("cancelled");
    expect(cancelled?.cancellationReason).toBe("customer-request");
    expect(done.cancelTargetId).toBeNull();
    expect(done.selectedId).toBeNull();
    expect(countOrdersByColumn(done.orders)).toEqual({ received: 1, preparing: 2, delivered: 1 });
  });

  it("keeps another open drawer when cancelling a different order", () => {
    const open = ordersReducer(initial, { type: "open-detail", id: 1052 });
    const asked = ordersReducer(open, { type: "request-cancel", id: 1051 });
    const done = ordersReducer(asked, { type: "confirm-cancel", reason: "order-error", at: "12:52" });
    expect(done.selectedId).toBe(1052);
  });

  it("ignores a confirmation without a pending dialog", () => {
    expect(ordersReducer(initial, { type: "confirm-cancel", reason: "order-error", at: "12:52" })).toBe(initial);
  });
});

describe("formatClock", () => {
  it("prints a local HH:MM time", () => {
    expect(formatClock(new Date(2026, 9, 23, 9, 5))).toBe("09:05");
    expect(formatClock(new Date(2026, 9, 23, 12, 42))).toBe("12:42");
  });
});
