import type { BillRequestsBoard, ManagedBillRequest } from "./types";

/**
 * Bill requests of 04 · Solicitudes de cuenta, in the export's "Mayor espera" order, plus the
 * one request finalized today ("Finalizadas hoy: 1").
 *
 * - Mesa 10, 05 and 07 keep the 10A totals, payment preferences, wait times and kitchen counts
 *   and the 02 account totals (02 shows Mesa 05 at 2 min with 1 kitchen order and Mesa 10 with
 *   4 confirmed orders; 10A and the 04 drawer win here).
 * - Mesa 10's customer, request time and "3 confirmados" come from the 04 drawer; Mesa 07's
 *   customer is the one of order #1048 in 03.
 * - Mesa 12 and 04 only exist in 04 (02 shows them available); the export repeats "18 min",
 *   "Transferencia" and "Pendiente" on every row, so their wait times, payment preferences,
 *   customers and assignees are illustrative, chosen to keep the 04 metrics (2 in attention,
 *   2 active transfers) and the "Mayor espera" order.
 */
const REQUESTS: ManagedBillRequest[] = [
  {
    id: "SC-010",
    tableNumber: 10,
    customer: "Lucía",
    requestedAt: "12:42",
    waitMinutes: 18,
    paymentPreference: "transfer",
    total: 31200,
    confirmedOrders: 3,
    ordersInPreparation: 0,
    status: "pending",
  },
  {
    id: "SC-005",
    tableNumber: 5,
    customer: "Joaquín",
    requestedAt: "12:48",
    waitMinutes: 12,
    paymentPreference: "table",
    total: 21500,
    confirmedOrders: 3,
    ordersInPreparation: 0,
    status: "pending",
  },
  {
    id: "SC-007",
    tableNumber: 7,
    customer: "Lucía",
    requestedAt: "12:53",
    waitMinutes: 7,
    paymentPreference: "register",
    total: 19900,
    confirmedOrders: 2,
    ordersInPreparation: 1,
    status: "pending",
  },
  {
    id: "SC-012",
    tableNumber: 12,
    customer: "Valentina",
    requestedAt: "12:55",
    waitMinutes: 5,
    paymentPreference: "transfer",
    total: 27600,
    confirmedOrders: 3,
    ordersInPreparation: 0,
    status: "attending",
    assignee: "María G.",
  },
  {
    id: "SC-004",
    tableNumber: 4,
    customer: "Diego",
    requestedAt: "12:57",
    waitMinutes: 3,
    paymentPreference: "table",
    total: 14200,
    confirmedOrders: 2,
    ordersInPreparation: 0,
    status: "attending",
    assignee: "Martín A.",
  },
  {
    id: "SC-009",
    tableNumber: 9,
    customer: "Camila",
    requestedAt: "12:15",
    waitMinutes: 9,
    paymentPreference: "register",
    total: 14300,
    confirmedOrders: 2,
    ordersInPreparation: 0,
    status: "finalized",
    assignee: "María G.",
  },
];

/** Live bill requests of 04, with Mesa 10 open in the "Solicitud seleccionada" export. */
export const BILL_REQUESTS_BOARD: BillRequestsBoard = {
  requests: REQUESTS,
  selectedId: "SC-010",
};
