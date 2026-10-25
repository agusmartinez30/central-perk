import type { CancellationReason, ManagedOrder, ManagedOrderStatus } from "@/mocks/types";

export type OrderTone = "brand" | "warning" | "success" | "danger";

/** Kitchen stages that own a board column and a metric; cancelled orders leave the board. */
export type OrderColumnId = Exclude<ManagedOrderStatus, "cancelled">;

const COLUMN_ORDER: readonly OrderColumnId[] = ["received", "preparing", "delivered"];

const COLUMN_COPY: Record<OrderColumnId, { title: string; tone: OrderTone }> = {
  received: { title: "Recibidos", tone: "brand" },
  preparing: { title: "En preparación", tone: "warning" },
  delivered: { title: "Entregados", tone: "success" },
};

function isOnBoard(order: ManagedOrder): order is ManagedOrder & { status: OrderColumnId } {
  return order.status !== "cancelled";
}

export function countOrdersByColumn(orders: readonly ManagedOrder[]): Record<OrderColumnId, number> {
  const counts: Record<OrderColumnId, number> = { received: 0, preparing: 0, delivered: 0 };
  for (const order of orders) if (isOnBoard(order)) counts[order.status] += 1;
  return counts;
}

export type OrderColumn = {
  id: OrderColumnId;
  title: string;
  tone: OrderTone;
  orders: ManagedOrder[];
};

/** "Tablero de estados" columns; "Entregados visibles" off hides the delivered column. */
export function groupOrdersByColumn(
  orders: readonly ManagedOrder[],
  { showDelivered = true }: { showDelivered?: boolean } = {},
): OrderColumn[] {
  return COLUMN_ORDER.filter((id) => showDelivered || id !== "delivered").map((id) => ({
    id,
    ...COLUMN_COPY[id],
    orders: orders.filter((order) => order.status === id),
  }));
}

/** "Mesa 03". */
export function formatTableLabel(tableNumber: number): string {
  return `Mesa ${String(tableNumber).padStart(2, "0")}`;
}

export function getOrderTotal(order: ManagedOrder): number {
  return order.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

const STATUS_BADGES: Record<ManagedOrderStatus, { label: string; tone: OrderTone }> = {
  received: { label: "Recibido", tone: "brand" },
  preparing: { label: "En preparación", tone: "warning" },
  delivered: { label: "Entregado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

/** Status badge of the detail panel. */
export function getStatusBadge(status: ManagedOrderStatus): { label: string; tone: OrderTone } {
  return STATUS_BADGES[status];
}

const NEXT_STATUS: Record<ManagedOrderStatus, ManagedOrderStatus | null> = {
  received: "preparing",
  preparing: "delivered",
  delivered: null,
  cancelled: null,
};

/** The only forward transition allowed from `status`, or null once the order is finished. */
export function getNextStatus(status: ManagedOrderStatus): ManagedOrderStatus | null {
  return NEXT_STATUS[status];
}

const PRIMARY_ACTIONS: Partial<Record<ManagedOrderStatus, { label: string; tone: OrderTone }>> = {
  received: { label: "Comenzar preparación", tone: "brand" },
  preparing: { label: "Marcar entregado", tone: "warning" },
};

/** Primary action of a card; finished orders have none. */
export function getPrimaryAction(order: ManagedOrder): { label: string; tone: OrderTone } | null {
  return PRIMARY_ACTIONS[order.status] ?? null;
}

/** Moves the order one kitchen stage forward and logs it; finished orders are returned as is. */
export function advanceOrder(order: ManagedOrder, at: string): ManagedOrder {
  const next = getNextStatus(order.status);
  if (!next) return order;
  return { ...order, status: next, history: [...order.history, { kind: next, at }] };
}

/** Delivered orders already reached the table, so only received or preparing ones can be cancelled. */
export function canCancelOrder(order: ManagedOrder): boolean {
  return order.status === "received" || order.status === "preparing";
}

export function cancelOrder(order: ManagedOrder, reason: CancellationReason, at: string): ManagedOrder {
  if (!canCancelOrder(order)) return order;
  return {
    ...order,
    status: "cancelled",
    cancellationReason: reason,
    history: [...order.history, { kind: "cancelled", at }],
  };
}

/** Options of the cancellation "Reason Selector", in the order of the dialog. */
export const CANCELLATION_REASONS: readonly { id: CancellationReason; label: string }[] = [
  { id: "product-unavailable", label: "Producto no disponible" },
  { id: "customer-request", label: "Solicitado por el cliente" },
  { id: "order-error", label: "Error en el pedido" },
];
