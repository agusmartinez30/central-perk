import type { CancellationReason, ManagedOrder } from "@/mocks/types";
import { advanceOrder, canCancelOrder, cancelOrder } from "./orders-view";

/** In-memory state of 03: the orders, the order open in the drawer and the pending cancellation. */
export type OrdersState = {
  orders: ManagedOrder[];
  selectedId: number | null;
  cancelTargetId: number | null;
};

export type OrdersAction =
  | { type: "open-detail"; id: number }
  | { type: "close-detail" }
  | { type: "advance"; id: number; at: string }
  | { type: "request-cancel"; id: number }
  | { type: "dismiss-cancel" }
  | { type: "confirm-cancel"; reason: CancellationReason; at: string };

export function createOrdersState(
  orders: ManagedOrder[],
  { selectedId = null, cancelTargetId = null }: Partial<Pick<OrdersState, "selectedId" | "cancelTargetId">> = {},
): OrdersState {
  return { orders, selectedId, cancelTargetId };
}

function findOrder(state: OrdersState, id: number | null): ManagedOrder | null {
  return id === null ? null : (state.orders.find((order) => order.id === id) ?? null);
}

export function getSelectedOrder(state: OrdersState): ManagedOrder | null {
  return findOrder(state, state.selectedId);
}

export function getCancelTarget(state: OrdersState): ManagedOrder | null {
  return findOrder(state, state.cancelTargetId);
}

function updateOrder(state: OrdersState, id: number, update: (order: ManagedOrder) => ManagedOrder) {
  return state.orders.map((order) => (order.id === id ? update(order) : order));
}

/**
 * Pure transitions of the orders screen. Cancelling is two-step: `request-cancel` opens the
 * confirmation dialog and only `confirm-cancel` changes the order.
 */
export function ordersReducer(state: OrdersState, action: OrdersAction): OrdersState {
  switch (action.type) {
    case "open-detail":
      return findOrder(state, action.id) ? { ...state, selectedId: action.id } : state;
    case "close-detail":
      return { ...state, selectedId: null };
    case "advance":
      return { ...state, orders: updateOrder(state, action.id, (order) => advanceOrder(order, action.at)) };
    case "request-cancel": {
      const order = findOrder(state, action.id);
      return order && canCancelOrder(order) ? { ...state, cancelTargetId: action.id } : state;
    }
    case "dismiss-cancel":
      return { ...state, cancelTargetId: null };
    case "confirm-cancel": {
      const id = state.cancelTargetId;
      if (id === null) return state;
      return {
        orders: updateOrder(state, id, (order) => cancelOrder(order, action.reason, action.at)),
        // A cancelled order leaves the board, so its drawer closes with the dialog.
        selectedId: state.selectedId === id ? null : state.selectedId,
        cancelTargetId: null,
      };
    }
  }
}

/** Local "HH:MM" for the status history. */
export function formatClock(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
