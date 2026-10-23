import type {
  CancellationReason,
  ManagedOrder,
  ManagedTable,
  ManagedOrderStatus,
  OrderHistoryKind,
} from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";

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

export type OrderMetric = {
  id: OrderColumnId;
  label: string;
  value: number;
  tone: OrderTone;
};

/** "Order Metrics" row: one tile per kitchen stage. */
export function getOrderMetrics(orders: readonly ManagedOrder[]): OrderMetric[] {
  const counts = countOrdersByColumn(orders);
  return COLUMN_ORDER.map((id) => ({
    id,
    label: COLUMN_COPY[id].title,
    value: counts[id],
    tone: COLUMN_COPY[id].tone,
  }));
}

export type OrderColumn = {
  id: OrderColumnId;
  title: string;
  tone: OrderTone;
  orders: ManagedOrder[];
};

/** "Kanban Board" columns; "Mostrar entregados" off hides the delivered column. */
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

export type TableOption = { value: number | "all"; label: string };

/** Options of the "Table Selector": every table with an order on the board. */
export function getOrderTableOptions(orders: readonly ManagedOrder[]): TableOption[] {
  const tables = [...new Set(orders.filter(isOnBoard).map((order) => order.tableNumber))].sort((a, b) => a - b);
  return [
    { value: "all", label: "Todas las mesas" },
    ...tables.map((value) => ({ value, label: formatTableLabel(value) })),
  ];
}

export type OrderQuery = {
  table: number | "all";
  query: string;
};

function matchesQuery(order: ManagedOrder, query: string): boolean {
  if (query === "") return true;
  const tableQuery = /^mesa\s*(\d+)$/.exec(query);
  if (tableQuery) return Number(tableQuery[1]) === order.tableNumber;
  const digits = query.replace(/^#/, "");
  if (!/^\d+$/.test(digits)) return false;
  return String(order.id).includes(digits) || Number(digits) === order.tableNumber;
}

/** Applies the "Table Selector" and the "Buscar por número..." text (order or table number). */
export function filterOrders(orders: readonly ManagedOrder[], { table, query }: OrderQuery): ManagedOrder[] {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
  return orders.filter(
    (order) => (table === "all" || order.tableNumber === table) && matchesQuery(order, normalized),
  );
}

export function getOrderTotal(order: ManagedOrder): number {
  return order.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

export function formatOrderTotal(order: ManagedOrder): string {
  return formatPrice(getOrderTotal(order));
}

/** "Order Meta" line of a card: "Mesa 03 · Martina". */
export function formatOrderMeta(order: ManagedOrder): string {
  return `${formatTableLabel(order.tableNumber)} · ${order.customer}`;
}

const STATUS_BADGES: Record<ManagedOrderStatus, { label: string; tone: OrderTone }> = {
  received: { label: "Recibido", tone: "brand" },
  preparing: { label: "En preparación", tone: "warning" },
  delivered: { label: "Entregado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

/** "Card Status" / "Drawer Status" pill. */
export function getStatusBadge(status: ManagedOrderStatus): { label: string; tone: OrderTone } {
  return STATUS_BADGES[status];
}

export type CardNotice = { label: string; value: string; tone: OrderTone };

/**
 * "Card Customization" block: the first product customization. The export tints it green on
 * delivered cards and red on the order of a table that requested the bill (#1048 · Mesa 07).
 */
export function getCardNotice(order: ManagedOrder, billRequested: boolean): CardNotice | null {
  const value = order.items.find((item) => item.customization)?.customization;
  if (!value) return null;
  if (billRequested) return { label: "Personalización · Cuenta solicitada", value, tone: "danger" };
  return { label: "Personalización", value, tone: order.status === "delivered" ? "success" : "warning" };
}

/** Numbers of the 02 tables waiting for their bill. */
export function getBillRequestedTables(tables: readonly ManagedTable[]): ReadonlySet<number> {
  return new Set(tables.filter((table) => table.status === "bill-requested").map((table) => table.number));
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

/** "Primary Status Action" of a card and the drawer; finished orders have none. */
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

/**
 * "Historial de estado" labels. Only "Pedido confirmado" and "Recibido en cocina" appear in
 * the export; the later stages reuse the wording of the status actions.
 */
const HISTORY_LABELS: Record<OrderHistoryKind, string> = {
  confirmed: "Pedido confirmado",
  received: "Recibido en cocina",
  preparing: "Preparación iniciada",
  delivered: "Pedido entregado",
  cancelled: "Pedido cancelado",
};

export function getHistoryLabel(kind: OrderHistoryKind): string {
  return HISTORY_LABELS[kind];
}

/** Dot of a history entry: the export paints "Pedido confirmado" in brand, like "Recibido". */
export function getHistoryTone(kind: OrderHistoryKind): OrderTone {
  return kind === "confirmed" ? "brand" : STATUS_BADGES[kind].tone;
}
