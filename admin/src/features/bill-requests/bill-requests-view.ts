import { REQUEST_MODES, getRequestModeShortLabel } from "@/mocks/service-day/catalog";
import type { BillPaymentMethod, BillRequestStatus, ManagedBillRequest, PaymentVerification } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";
import type { Page } from "@/shared/lib/pagination";

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

/** "Request Metrics": pending, in attention, manual payment reviews and finalized today. */
export function getRequestMetrics(requests: readonly ManagedBillRequest[]): RequestMetric[] {
  const count = (predicate: (request: ManagedBillRequest) => boolean) => requests.filter(predicate).length;
  return [
    { id: "pending", label: "Pendientes", value: count((r) => r.status === "pending"), tone: "warning" },
    { id: "attending", label: "En atención", value: count((r) => r.status === "attending"), tone: "brand" },
    {
      id: "transfers",
      label: "Por verificar",
      value: count((r) => isActiveRequest(r) && r.paymentVerification.status === "pending"),
      tone: "danger",
    },
    { id: "finalized", label: "Finalizadas hoy", value: count((r) => r.status === "finalized"), tone: "success" },
  ];
}

export type StatusFilter = "active" | "payment-review" | BillRequestStatus | "all";
export type PaymentFilter = "all" | BillPaymentMethod;
export type RequestSort = "longest-wait" | "highest-total";

/** "Status Filters" chips; "Activas" (pending plus in attention) is the default. */
export const STATUS_FILTERS: readonly { id: StatusFilter; label: string }[] = [
  { id: "active", label: "Activas" },
  { id: "pending", label: "Pendientes" },
  { id: "attending", label: "En atención" },
  { id: "payment-review", label: "Por verificar" },
  { id: "finalized", label: "Finalizadas" },
  { id: "all", label: "Todas" },
];

/** "Payment Filters" chips: the request modes of 06 with their short chip labels. */
export const PAYMENT_FILTERS: readonly { id: PaymentFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  ...REQUEST_MODES.map((mode) => ({ id: mode.id, label: mode.shortLabel })),
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
  if (status === "payment-review") return request.paymentVerification.status === "pending";
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
    (a, b) =>
      Number(isActiveRequest(b)) - Number(isActiveRequest(a)) ||
      key(b) - key(a) ||
      a.requestedAt.localeCompare(b.requestedAt) ||
      a.id.localeCompare(b.id),
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

export function getPaymentLabel(method: BillPaymentMethod): string {
  return getRequestModeShortLabel(method);
}

export function getPaymentVerificationLabel(verification: PaymentVerification): string {
  switch (verification.status) {
    case "not-required":
      return "No requiere verificación";
    case "awaiting-receipt":
      return "Esperando comprobante";
    case "pending":
      return "Pago por verificar";
    case "verified":
      return "Pago verificado";
  }
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

/** Rows per page of the "Requests Table": five 82px rows fit the 1440×900 frame without scrolling. */
export const REQUESTS_PAGE_SIZE = 5;

/** "Table Count": "Mostrando 1–5 de 6 solicitudes". */
export function formatTableCount({ from, to, total }: Pick<Page<unknown>, "from" | "to" | "total">): string {
  if (total === 0) return "Sin solicitudes para mostrar";
  return `Mostrando ${from}–${to} de ${total} ${total === 1 ? "solicitud" : "solicitudes"}`;
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

export type RowAction = "mark-attending" | "verify-payment" | "finalize" | "view-detail";

/** Status transitions that change a request; each one asks for confirmation first. */
export type TransitionAction = Exclude<RowAction, "view-detail">;

export type TransitionConfirm = {
  title: string;
  description: string;
  note?: string;
  confirmLabel: string;
  tone: "primary" | "danger";
};

/** Copy of the confirmation dialog shown before a status transition. */
export function getTransitionConfirm(
  action: TransitionAction,
  request: ManagedBillRequest,
  staffName: string,
): TransitionConfirm {
  const table = formatTableLabel(request);
  switch (action) {
    case "mark-attending":
      return {
        title: `¿Atender la solicitud de ${table}?`,
        description: `${staffName} queda como responsable y la solicitud pasa a En atención.`,
        confirmLabel: "Atender solicitud",
        tone: "primary",
      };
    case "verify-payment":
      return {
        title: `¿Confirmar el pago de ${table}?`,
        description: `Confirmá que la transferencia de ${formatRequestTotal(request)} está acreditada en la cuenta del local.`,
        confirmLabel: "Confirmar pago",
        tone: "primary",
      };
    case "finalize":
      return {
        title: `¿Finalizar la solicitud de ${table}?`,
        description: `La cuenta de ${formatRequestTotal(request)} se marca como cobrada y la solicitud deja de estar activa.`,
        note: "Esta acción no se puede deshacer.",
        confirmLabel: "Finalizar solicitud",
        tone: "primary",
      };
  }
}

export function canMarkAttending(request: ManagedBillRequest): boolean {
  return request.status === "pending";
}

/** Actions follow the next valid operational transition and always retain detail access. */
export function getRowActions(request: ManagedBillRequest): RowAction[] {
  if (canMarkAttending(request)) return ["mark-attending", "view-detail"];
  if (request.status === "attending" && request.paymentVerification.status === "pending") {
    return ["verify-payment", "view-detail"];
  }
  if (request.status === "attending" && request.paymentVerification.status !== "awaiting-receipt") {
    return ["finalize", "view-detail"];
  }
  return ["view-detail"];
}

/**
 * "Marcar en atención": a pending request moves to attention and records the responsible staff
 * member. Other statuses are returned unchanged.
 */
export function markAttending(request: ManagedBillRequest, staffName: string, at: string): ManagedBillRequest {
  if (!canMarkAttending(request)) return request;
  return {
    ...request,
    status: "attending",
    assignee: staffName,
    history: [...request.history, { kind: "attending", at, by: staffName }],
  };
}

export function verifyPayment(request: ManagedBillRequest, staffName: string, at: string): ManagedBillRequest {
  if (request.status !== "attending" || request.paymentVerification.status !== "pending") return request;
  return {
    ...request,
    paymentVerification: {
      status: "verified",
      reportedAt: request.paymentVerification.reportedAt,
      verifiedAt: at,
      verifiedBy: staffName,
    },
    history: [...request.history, { kind: "payment-verified", at, by: staffName }],
  };
}

export function finalizeRequest(request: ManagedBillRequest, staffName: string, at: string): ManagedBillRequest {
  if (request.status !== "attending") return request;
  if (request.paymentPreference === "transfer" && request.paymentVerification.status !== "verified") return request;
  return {
    ...request,
    status: "finalized",
    history: [...request.history, { kind: "finalized", at, by: staffName }],
  };
}
