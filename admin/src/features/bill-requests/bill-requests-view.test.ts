import { describe, expect, it } from "vitest";
import type { ManagedBillRequest } from "@/mocks/types";
import { BILL_REQUESTS_BOARD, OVERVIEW_SNAPSHOT, TABLES_BOARD } from "@/mocks/service-day";
import {
  PAYMENT_FILTERS,
  SORT_OPTIONS,
  STATUS_FILTERS,
  canMarkAttending,
  filterRequests,
  formatRequestId,
  formatRequestTotal,
  formatTableCount,
  formatTableLabel,
  formatWait,
  getActiveTotal,
  getAssigneeLabel,
  getDetailInfo,
  getKitchenNote,
  getPaymentLabel,
  getPaymentVerificationLabel,
  getRequestMetrics,
  getRowActions,
  getStatusBadge,
  getWaitTone,
  isActiveRequest,
  markAttending,
  finalizeRequest,
  sortRequests,
  verifyPayment,
  getTransitionConfirm,
} from "./bill-requests-view";
import { formatPrice } from "@/shared/lib/format-price";

const request = (overrides: Partial<ManagedBillRequest> & Pick<ManagedBillRequest, "id">): ManagedBillRequest => ({
  tableNumber: 1,
  spaceName: "Salón",
  customer: "Ana",
  requestedAt: "12:00",
  waitMinutes: 5,
  paymentPreference: "table",
  total: 10000,
  consumptions: [{ id: "coffee", name: "Café", quantity: 1, unitPrice: 10000, total: 10000 }],
  confirmedOrders: 1,
  ordersInPreparation: 0,
  status: "pending",
  paymentVerification: { status: "not-required" },
  history: [{ kind: "requested", at: "12:00" }],
  ...overrides,
});

const { requests } = BILL_REQUESTS_BOARD;
const byTable = (number: number) => requests.find((item) => item.tableNumber === number);

/** Full cross-screen agreement lives in `src/mocks/service-day/service-day.test.ts`. */
describe("BILL_REQUESTS_BOARD of the service day", () => {
  it("lists the five active requests of 04 in the export order plus one finalized today", () => {
    expect(requests.filter(isActiveRequest).map(formatTableLabel)).toEqual([
      "Mesa 10",
      "Mesa 05",
      "Mesa 07",
      "Mesa 12",
      "Mesa 04",
    ]);
    expect(requests.filter((item) => item.status === "finalized")).toHaveLength(1);
  });

  it("matches the 10A bill requests (total, payment, wait and kitchen) of the pending ones", () => {
    for (const bill of OVERVIEW_SNAPSHOT.billRequests) {
      const match = byTable(Number(bill.table));
      expect(match).toMatchObject({
        total: bill.total,
        paymentPreference: bill.paymentMethod,
        waitMinutes: bill.waitMinutes,
        ordersInPreparation: bill.ordersInPreparation,
        status: "pending",
      });
    }
  });

  it("shares the 02 account totals and payment preferences of the tables that requested the bill", () => {
    for (const table of TABLES_BOARD.tables.filter((item) => item.status === "bill-requested")) {
      expect(byTable(table.number)).toMatchObject({
        total: table.accountTotal,
        paymentPreference: table.paymentPreference,
      });
    }
  });

  it("opens Mesa 10 in the selected-request drawer", () => {
    expect(byTable(10)).toMatchObject({
      id: "SC-010",
      customer: "Lucía",
      requestedAt: "14:24",
      confirmedOrders: 3,
    });
    expect(byTable(10)?.assignee).toBeUndefined();
    expect(BILL_REQUESTS_BOARD.selectedId).toBe("SC-010");
  });

  it("projects canonical consumption, location, payment verification and timeline details", () => {
    const transfer = byTable(12)!;
    expect(transfer.spaceName).toBe("Patio");
    expect(transfer.consumptions.length).toBeGreaterThan(0);
    expect(transfer.consumptions.reduce((sum, item) => sum + item.total, 0)).toBe(transfer.total);
    expect(transfer.paymentVerification).toEqual({ status: "pending", reportedAt: "14:41" });
    expect(transfer.history).toEqual([
      { kind: "requested", at: "14:37" },
      { kind: "attending", at: "14:38", by: "María G." },
      { kind: "receipt-reported", at: "14:41" },
    ]);
  });
});

describe("getRequestMetrics", () => {
  it("reproduces the four 04 tiles", () => {
    expect(getRequestMetrics(requests)).toEqual([
      { id: "pending", label: "Pendientes", value: 3, tone: "warning" },
      { id: "attending", label: "En atención", value: 2, tone: "brand" },
      { id: "transfers", label: "Por verificar", value: 1, tone: "danger" },
      { id: "finalized", label: "Finalizadas hoy", value: 1, tone: "success" },
    ]);
  });

  it("does not count finalized transfers as active", () => {
    const metrics = getRequestMetrics([
      request({
        id: "a",
        paymentVerification: { status: "verified", verifiedAt: "12:08", verifiedBy: "Sofía M." },
        status: "finalized",
      }),
      request({ id: "b", paymentVerification: { status: "pending", reportedAt: "12:04" }, status: "attending" }),
    ]);
    expect(metrics.find((metric) => metric.id === "transfers")?.value).toBe(1);
  });
});

describe("filters", () => {
  it("exposes the status and payment chips of the export", () => {
    expect(STATUS_FILTERS.map((filter) => filter.label)).toEqual([
      "Activas",
      "Pendientes",
      "En atención",
      "Por verificar",
      "Finalizadas",
      "Todas",
    ]);
    expect(PAYMENT_FILTERS.map((filter) => filter.label)).toEqual(["Todas", "En mesa", "En caja", "Transferencia"]);
    expect(SORT_OPTIONS.map((option) => option.label)).toEqual(["Mayor espera", "Mayor total"]);
  });

  const all = { status: "all", payment: "all", query: "" } as const;
  const tables = (list: ManagedBillRequest[]) => list.map((item) => item.tableNumber);

  it("filters by status, with active as pending plus attending", () => {
    expect(tables(filterRequests(requests, { ...all, status: "active" }))).toEqual([10, 5, 7, 12, 4]);
    expect(tables(filterRequests(requests, { ...all, status: "pending" }))).toEqual([10, 5, 7]);
    expect(tables(filterRequests(requests, { ...all, status: "attending" }))).toEqual([12, 4]);
    expect(tables(filterRequests(requests, { ...all, status: "payment-review" }))).toEqual([12]);
    expect(filterRequests(requests, { ...all, status: "finalized" })).toHaveLength(1);
    expect(filterRequests(requests, all)).toHaveLength(6);
  });

  it("filters by payment preference", () => {
    expect(tables(filterRequests(requests, { ...all, status: "active", payment: "transfer" }))).toEqual([10, 12]);
    expect(tables(filterRequests(requests, { ...all, status: "active", payment: "register" }))).toEqual([7]);
  });

  it("searches by table, customer or request id, ignoring case, accents and padding", () => {
    expect(tables(filterRequests(requests, { ...all, query: "mesa 5" }))).toEqual([5]);
    expect(tables(filterRequests(requests, { ...all, query: "Mesa 07" }))).toEqual([7]);
    expect(tables(filterRequests(requests, { ...all, query: "10" }))).toEqual([10]);
    expect(tables(filterRequests(requests, { ...all, query: "lucia" }))).toEqual([10]);
    expect(tables(filterRequests(requests, { ...all, query: "#sc-012" }))).toEqual([12]);
    expect(tables(filterRequests(requests, { ...all, query: "  " }))).toHaveLength(6);
    expect(filterRequests(requests, { ...all, query: "zzz" })).toEqual([]);
  });
});

describe("sortRequests", () => {
  it("puts the longest wait first and finalized requests last", () => {
    const list = [
      request({ id: "a", waitMinutes: 3 }),
      request({ id: "b", waitMinutes: 40, status: "finalized" }),
      request({ id: "c", waitMinutes: 12 }),
    ];
    expect(sortRequests(list, "longest-wait").map((item) => item.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts by the highest total", () => {
    const list = [request({ id: "a", total: 100 }), request({ id: "b", total: 300 })];
    expect(sortRequests(list, "highest-total").map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("does not mutate its input", () => {
    const list = [request({ id: "a", waitMinutes: 1 }), request({ id: "b", waitMinutes: 2 })];
    sortRequests(list, "longest-wait");
    expect(list.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("uses request time and id as deterministic tie breakers", () => {
    const list = [
      request({ id: "b", requestedAt: "12:05", waitMinutes: 10 }),
      request({ id: "c", requestedAt: "12:00", waitMinutes: 10 }),
      request({ id: "a", requestedAt: "12:00", waitMinutes: 10 }),
    ];
    expect(sortRequests(list, "longest-wait").map((item) => item.id)).toEqual(["a", "c", "b"]);
  });
});

describe("wait time", () => {
  it("formats minutes and hours", () => {
    expect(formatWait(0)).toBe("0 min");
    expect(formatWait(18)).toBe("18 min");
    expect(formatWait(60)).toBe("1 h");
    expect(formatWait(75)).toBe("1 h 15 min");
  });

  it("turns danger from 20 minutes and neutral once finalized", () => {
    expect(getWaitTone(request({ id: "a", waitMinutes: 18 }))).toBe("warning");
    expect(getWaitTone(request({ id: "a", waitMinutes: 20 }))).toBe("danger");
    expect(getWaitTone(request({ id: "a", waitMinutes: 30, status: "finalized" }))).toBe("neutral");
  });
});

describe("copy", () => {
  it("formats labels, ids, totals and payment preferences", () => {
    expect(formatTableLabel(request({ id: "a", tableNumber: 5 }))).toBe("Mesa 05");
    expect(formatRequestId(request({ id: "SC-010" }))).toBe("#SC-010");
    expect(formatRequestTotal(request({ id: "a", total: 31200 }))).toBe("$31.200");
    expect(getPaymentLabel("table")).toBe("En mesa");
    expect(getPaymentLabel("register")).toBe("En caja");
    expect(getPaymentLabel("transfer")).toBe("Transferencia");
  });

  it("maps each status to its badge", () => {
    expect(getStatusBadge("pending")).toEqual({ label: "Pendiente", tone: "warning" });
    expect(getStatusBadge("attending")).toEqual({ label: "En atención", tone: "brand" });
    expect(getStatusBadge("finalized")).toEqual({ label: "Finalizada", tone: "success" });
  });

  it("warns about orders still in preparation", () => {
    expect(getKitchenNote(request({ id: "a" }))).toBeNull();
    expect(getKitchenNote(request({ id: "a", ordersInPreparation: 1 }))).toBe("1 pedido en preparación");
    expect(getKitchenNote(request({ id: "a", ordersInPreparation: 2 }))).toBe("2 pedidos en preparación");
  });

  it("counts every displayed request in the table footer", () => {
    expect(formatTableCount({ from: 1, to: 5, total: 6 })).toBe("Mostrando 1–5 de 6 solicitudes");
    expect(formatTableCount({ from: 1, to: 1, total: 1 })).toBe("Mostrando 1–1 de 1 solicitud");
    expect(formatTableCount({ from: 0, to: 0, total: 0 })).toBe("Sin solicitudes para mostrar");
  });

  it("sums the active totals", () => {
    expect(getActiveTotal(requests)).toBe(31200 + 21500 + 19900 + 27600 + 14200);
  });

  it("lists the drawer information rows of 04", () => {
    expect(getDetailInfo(byTable(10)!)).toEqual([
      { label: "Cliente", value: "Lucía" },
      { label: "Solicitada", value: "Hoy, 14:24" },
      { label: "Total compartido", value: "$31.200" },
      { label: "Pedidos", value: "3 confirmados" },
      { label: "Preferencia", value: "Transferencia" },
    ]);
    expect(getDetailInfo(request({ id: "a", confirmedOrders: 1 }))[3]).toEqual({
      label: "Pedidos",
      value: "1 confirmado",
    });
  });

  it("shows the assignee or 'Sin asignar'", () => {
    expect(getAssigneeLabel(request({ id: "a" }))).toBe("Sin asignar");
    expect(getAssigneeLabel(request({ id: "a", assignee: "María G." }))).toBe("María G.");
  });

  it("describes each payment verification state", () => {
    expect(getPaymentVerificationLabel({ status: "not-required" })).toBe("No requiere verificación");
    expect(getPaymentVerificationLabel({ status: "awaiting-receipt" })).toBe("Esperando comprobante");
    expect(getPaymentVerificationLabel({ status: "pending", reportedAt: "12:04" })).toBe("Pago por verificar");
    expect(getPaymentVerificationLabel({ status: "verified", verifiedAt: "12:08", verifiedBy: "Sofía M." })).toBe(
      "Pago verificado",
    );
  });
});

describe("actions", () => {
  it("offers 'Marcar en atención' only for pending requests", () => {
    expect(getRowActions(request({ id: "a" }))).toEqual(["mark-attending", "view-detail"]);
    expect(getRowActions(request({ id: "a", status: "attending" }))).toEqual(["finalize", "view-detail"]);
    expect(getRowActions(request({ id: "a", status: "finalized" }))).toEqual(["view-detail"]);
    expect(canMarkAttending(request({ id: "a", status: "attending" }))).toBe(false);
  });

  it("offers payment verification or finalization according to the request context", () => {
    expect(
      getRowActions(
        request({ id: "a", status: "attending", paymentVerification: { status: "pending", reportedAt: "12:04" } }),
      ),
    ).toEqual(["verify-payment", "view-detail"]);
    expect(getRowActions(request({ id: "b", status: "attending" }))).toEqual(["finalize", "view-detail"]);
  });

  it("marks a pending request as attending and assigns the staff member", () => {
    const pending = request({ id: "a" });
    expect(markAttending(pending, "Sofía M.", "12:00")).toEqual({
      ...pending,
      status: "attending",
      assignee: "Sofía M.",
      history: [...pending.history, { kind: "attending", at: "12:00", by: "Sofía M." }],
    });
    expect(pending.status).toBe("pending");
  });

  it("leaves other statuses untouched", () => {
    const attending = request({ id: "a", status: "attending", assignee: "María G." });
    expect(markAttending(attending, "Sofía M.", "12:02")).toBe(attending);
  });

  it("records attending, verification and finalization transitions without mutating prior values", () => {
    const pending = request({ id: "a", history: [{ kind: "requested", at: "12:00" }] });
    const attending = markAttending(pending, "Sofía M.", "12:02");
    expect(attending.history.at(-1)).toEqual({ kind: "attending", at: "12:02", by: "Sofía M." });

    const awaitingVerification = request({
      id: "b",
      status: "attending",
      assignee: "Sofía M.",
      paymentVerification: { status: "pending", reportedAt: "12:04" },
      history: [{ kind: "receipt-reported", at: "12:04" }],
    });
    const verified = verifyPayment(awaitingVerification, "Sofía M.", "12:06");
    expect(verified.paymentVerification).toEqual({
      status: "verified",
      reportedAt: "12:04",
      verifiedAt: "12:06",
      verifiedBy: "Sofía M.",
    });
    expect(verified.history.at(-1)).toEqual({ kind: "payment-verified", at: "12:06", by: "Sofía M." });

    const finalized = finalizeRequest(verified, "Sofía M.", "12:08");
    expect(finalized.status).toBe("finalized");
    expect(finalized.history.at(-1)).toEqual({ kind: "finalized", at: "12:08", by: "Sofía M." });
    expect(awaitingVerification.paymentVerification.status).toBe("pending");
  });

  it("does not finalize a transfer before payment verification", () => {
    const pending = request({
      id: "a",
      status: "attending",
      paymentPreference: "transfer",
      paymentVerification: { status: "pending", reportedAt: "12:04" },
    });
    expect(finalizeRequest(pending, "Sofía M.", "12:08")).toBe(pending);
  });
});

describe("getTransitionConfirm", () => {
  const target = request({ id: "SC-010", tableNumber: 10, total: 31200 });

  it("asks before taking a request and names who will be assigned", () => {
    expect(getTransitionConfirm("mark-attending", target, "Sofía M.")).toEqual({
      title: "¿Atender la solicitud de Mesa 10?",
      description: "Sofía M. queda como responsable y la solicitud pasa a En atención.",
      confirmLabel: "Atender solicitud",
      tone: "primary",
    });
  });

  it("asks to confirm the credited amount before verifying a payment", () => {
    expect(getTransitionConfirm("verify-payment", target, "Sofía M.")).toMatchObject({
      title: "¿Confirmar el pago de Mesa 10?",
      description: `Confirmá que la transferencia de ${formatPrice(31200)} está acreditada en la cuenta del local.`,
      confirmLabel: "Confirmar pago",
    });
  });

  it("warns that finalizing cannot be undone", () => {
    expect(getTransitionConfirm("finalize", target, "Sofía M.")).toMatchObject({
      title: "¿Finalizar la solicitud de Mesa 10?",
      note: "Esta acción no se puede deshacer.",
      confirmLabel: "Finalizar solicitud",
    });
  });
});
