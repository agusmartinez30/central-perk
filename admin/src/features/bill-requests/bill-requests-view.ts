import type { BillPaymentMethod, BillRequestStatus, ManagedBillRequest } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";

export type RequestTone = "brand" | "warning" | "success" | "danger";

export function isActiveRequest(request: ManagedBillRequest): boolean {
  return request.status !== "finalized";
}

export type RequestMetric = {
  id: "pending" | "attending" | "transfers" | "finalized";
  label: string;
  value: number;
  tone: RequestTone;
};

/** "Request Metrics": pending, in attention, active transfers and finalized today. */
export function getRequestMetrics(requests: readonly ManagedBillRequest[]): RequestMetric[] {
  const count = (predicate: (request: ManagedBillRequest) => boolean) => requests.filter(predicate).length;
  return [
    { id: "pending", label: "Pendientes", value: count((r) => r.status === "pending"), tone: "warning" },
    { id: "attending", label: "En atención", value: count((r) => r.status === "attending"), tone: "brand" },
    {
      id: "transfers",
      label: "Transferencias activas",
      value: count((r) => isActiveRequest(r) && r.paymentPreference === "transfer"),
      tone: "brand",
    },
    { id: "finalized", label: "Finalizadas hoy", value: count((r) => r.status === "finalized"), tone: "success" },
  ];
}

export type StatusFilter = "active" | BillRequestStatus | "all";
export type PaymentFilter = "all" | BillPaymentMethod;
export type RequestSort = "longest-wait" | "highest-total";

/** "Status Filters" chips; "Activas" (pending plus in attention) is the default. */
export const STATUS_FILTERS: readonly { id: StatusFilter; label: string }[] = [
  { id: "active", label: "Activas" },
  { id: "pending", label: "Pendientes" },
  { id: "attending", label: "En atención" },
  { id: "finalized", label: "Finalizadas" },
  { id: "all", label: "Todas" },
];

/** "Payment Filters" chips. */
export const PAYMENT_FILTERS: readonly { id: PaymentFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "table", label: "En mesa" },
  { id: "register", label: "En caja" },
  { id: "transfer", label: "Transferencia" },
];

/** "Sort Control" options; the export only shows "Mayor espera", "Mayor total" is ours. */
export const SORT_OPTIONS: readonly { id: RequestSort; label: string }[] = [
  { id: "longest-wait", label: "Mayor espera" },
  { id: "highest-total", label: "Mayor total" },
];

export type RequestQuery = {
  status: StatusFilter;
  payment: PaymentFilter;
  query: string;
};

function matchesStatus(request: ManagedBillRequest, status: StatusFilter): boolean {
  if (status === "all") return true;
  if (status === "active") return isActiveRequest(request);
  return request.status === status;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/#/g, "")
    .toLowerCase()
    .trim();
}

function matchesQuery(request: ManagedBillRequest, query: string): boolean {
  const needle = normalize(query);
  if (!needle) return true;
  const number = needle.match(/^(?:mesa\s*)?(\d+)$/);
  if (number && Number(number[1]) === request.tableNumber) return true;
  return [formatTableLabel(request), request.customer, request.id].some((text) => normalize(text).includes(needle));
}

/** Status chip, payment chip and "Buscar por mesa, cliente o solicitud...". */
export function filterRequests(
  requests: readonly ManagedBillRequest[],
  { status, payment, query }: RequestQuery,
): ManagedBillRequest[] {
  return requests.filter(
    (request) =>
      matchesStatus(request, status) &&
      (payment === "all" || request.paymentPreference === payment) &&
      matchesQuery(request, query),
  );
}

/** Active requests first, then by the selected criterion; returns a new array. */
export function sortRequests(requests: readonly ManagedBillRequest[], sort: RequestSort): ManagedBillRequest[] {
  const key = (request: ManagedBillRequest) => (sort === "longest-wait" ? request.waitMinutes : request.total);
  return [...requests].sort(
    (a, b) => Number(isActiveRequest(b)) - Number(isActiveRequest(a)) || key(b) - key(a),
  );
}

/** "18 min", "1 h" or "1 h 15 min". */
export function formatWait(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Minutes of wait from which the "Waiting Indicator" turns red. */
export const URGENT_WAIT_MINUTES = 20;

/** The export shows every wait in the warning tone; long waits escalate, closed ones go neutral. */
export function getWaitTone(request: ManagedBillRequest): "warning" | "danger" | "neutral" {
  if (!isActiveRequest(request)) return "neutral";
  return request.waitMinutes >= URGENT_WAIT_MINUTES ? "danger" : "warning";
}

/** "Mesa 05". */
export function formatTableLabel(request: Pick<ManagedBillRequest, "tableNumber">): string {
  return `Mesa ${String(request.tableNumber).padStart(2, "0")}`;
}

/** "#SC-010". */
export function formatRequestId(request: Pick<ManagedBillRequest, "id">): string {
  return `#${request.id}`;
}

export function formatRequestTotal(request: Pick<ManagedBillRequest, "total">): string {
  return formatPrice(request.total);
}

const PAYMENT_LABELS: Record<BillPaymentMethod, string> = {
  table: "En mesa",
  register: "En caja",
  transfer: "Transferencia",
};

export function getPaymentLabel(method: BillPaymentMethod): string {
  return PAYMENT_LABELS[method];
}

const STATUS_BADGES: Record<BillRequestStatus, { label: string; tone: RequestTone }> = {
  pending: { label: "Pendiente", tone: "warning" },
  attending: { label: "En atención", tone: "brand" },
  finalized: { label: "Finalizada", tone: "success" },
};

/** "Request Status" / "Panel Status" pill. */
export function getStatusBadge(status: BillRequestStatus): { label: string; tone: RequestTone } {
  return STATUS_BADGES[status];
}

/** "1 pedido en preparación" under the request id and in the drawer; null when the kitchen is done. */
export function getKitchenNote(request: ManagedBillRequest): string | null {
  const count = request.ordersInPreparation;
  if (count === 0) return null;
  return `${count} ${count === 1 ? "pedido" : "pedidos"} en preparación`;
}

/** "Table Count": "5 solicitudes activas · Actualizado hace unos segundos". */
export function formatTableCount(requests: readonly ManagedBillRequest[]): string {
  const count = requests.filter(isActiveRequest).length;
  const noun = count === 1 ? "solicitud activa" : "solicitudes activas";
  return `${count} ${noun} · Actualizado hace unos segundos`;
}

/** Amount still to collect across the active requests. */
export function getActiveTotal(requests: readonly ManagedBillRequest[]): number {
  return requests.filter(isActiveRequest).reduce((sum, request) => sum + request.total, 0);
}

export type DetailInfo = { label: string; value: string };

/** "Request Information" rows of the quick-detail drawer. */
export function getDetailInfo(request: ManagedBillRequest): DetailInfo[] {
  const orders = request.confirmedOrders;
  return [
    { label: "Cliente", value: request.customer },
    { label: "Solicitada", value: `Hoy, ${request.requestedAt}` },
    { label: "Total compartido", value: formatRequestTotal(request) },
    { label: "Pedidos", value: `${orders} ${orders === 1 ? "confirmado" : "confirmados"}` },
    { label: "Preferencia", value: getPaymentLabel(request.paymentPreference) },
  ];
}

/** "Assigned Name": who attends the request. */
export function getAssigneeLabel(request: ManagedBillRequest): string {
  return request.assignee ?? "Sin asignar";
}

export type RowAction = "mark-attending" | "view-detail";

export function canMarkAttending(request: ManagedBillRequest): boolean {
  return request.status === "pending";
}

/** "Row Actions": pending rows add "Marcar en atención" before "Ver detalle". */
export function getRowActions(request: ManagedBillRequest): RowAction[] {
  return canMarkAttending(request) ? ["mark-attending", "view-detail"] : ["view-detail"];
}

/**
 * "Marcar en atención": a pending request moves to attention, assigned to the staff member who
 * took it. Closing the table requires authorization ("El cierre de mesa requiere autorización"),
 * so there is no transition to finalized here. Other statuses are returned unchanged.
 */
export function markAttending(request: ManagedBillRequest, staffName: string): ManagedBillRequest {
  if (!canMarkAttending(request)) return request;
  return { ...request, status: "attending", assignee: staffName };
}
