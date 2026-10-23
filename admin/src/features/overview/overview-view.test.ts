import { describe, expect, it } from "vitest";
import type { AttentionOrder, BillRequest, ConfirmedPayment, TableSnapshot } from "@/mocks/types";
import { OVERVIEW_SNAPSHOT } from "@/mocks/service-day";
import {
  formatBillMeta,
  formatBillWarning,
  formatOrderIdentity,
  formatOrderItems,
  formatTablesSummary,
  getBestSellerBars,
  getFinancialSummary,
  getOverviewKpis,
  groupSalesByHour,
  summarizeTables,
} from "./overview-view";

const table = (number: number, status: TableSnapshot["status"], preparing = false): TableSnapshot => ({
  number,
  status,
  preparing,
});

describe("summarizeTables", () => {
  it("counts free, occupied, bill-requested and preparing tables", () => {
    const summary = summarizeTables([
      table(1, "free"),
      table(2, "occupied", true),
      table(3, "bill-requested"),
      table(4, "bill-requested", true),
    ]);
    expect(summary).toEqual({ enabled: 4, free: 1, occupied: 3, withBill: 2, preparing: 2 });
  });

  it("formats the summary line of the tables panel", () => {
    expect(
      formatTablesSummary({ enabled: 12, free: 4, occupied: 8, withBill: 3, preparing: 2 }),
    ).toBe("12 habilitadas · 4 libres · 8 ocupadas · 3 con cuenta · 2 preparando");
  });
});

describe("groupSalesByHour", () => {
  it("sums payments per hour slot, in chronological order", () => {
    const payments: ConfirmedPayment[] = [
      { id: "a", amount: 1000, closedAt: "13:40" },
      { id: "b", amount: 500, closedAt: "12:05" },
      { id: "c", amount: 250, closedAt: "13:10" },
    ];
    expect(groupSalesByHour(payments)).toEqual([
      { hour: "12:00", total: 500, ratio: 0.4 },
      { hour: "13:00", total: 1250, ratio: 1 },
    ]);
  });

  it("returns no bars without payments", () => {
    expect(groupSalesByHour([])).toEqual([]);
  });
});

describe("getFinancialSummary", () => {
  it("derives total, closed bills and rounded average ticket", () => {
    const payments: ConfirmedPayment[] = [
      { id: "a", amount: 1000, closedAt: "12:00" },
      { id: "b", amount: 2001, closedAt: "12:30" },
    ];
    expect(getFinancialSummary(payments, 7)).toEqual({
      total: 3001,
      closedBills: 2,
      averageTicket: 1501,
      confirmedOrders: 7,
    });
  });

  it("uses a zero average when nothing was collected", () => {
    expect(getFinancialSummary([], 0).averageTicket).toBe(0);
  });
});

describe("order formatting", () => {
  const order: AttentionOrder = {
    id: 1051,
    table: "03",
    customer: "Martina",
    items: [
      { quantity: 1, name: "Cappuccino grande" },
      { quantity: 2, name: "Medialunas" },
    ],
    status: "received",
    waitMinutes: 6,
  };

  it("joins id, table and customer", () => {
    expect(formatOrderIdentity(order)).toBe("#1051 · Mesa 03 · Martina");
  });

  it("lists quantities and names", () => {
    expect(formatOrderItems(order.items)).toBe("1 Cappuccino grande · 2 Medialunas");
  });
});

describe("bill request formatting", () => {
  const bill: BillRequest = {
    table: "07",
    paymentMethod: "register",
    total: 19900,
    waitMinutes: 7,
    ordersInPreparation: 1,
  };

  it("shows the payment method and total", () => {
    expect(formatBillMeta(bill)).toBe("En caja · Total $19.900");
    expect(formatBillMeta({ ...bill, paymentMethod: "transfer", total: 31200 })).toBe(
      "Transferencia · Total $31.200",
    );
    expect(formatBillMeta({ ...bill, paymentMethod: "table" })).toBe("En mesa · Total $19.900");
  });

  it("warns about orders still in preparation", () => {
    expect(formatBillWarning(bill)).toEqual({ tone: "warning", text: "⚠ 1 pedido aún en preparación" });
    expect(formatBillWarning({ ...bill, ordersInPreparation: 2 })).toEqual({
      tone: "warning",
      text: "⚠ 2 pedidos aún en preparación",
    });
    expect(formatBillWarning({ ...bill, ordersInPreparation: 0 })).toEqual({
      tone: "success",
      text: "Sin alertas de cocina",
    });
  });
});

describe("getBestSellerBars", () => {
  it("scales each product against the best seller", () => {
    expect(
      getBestSellerBars([
        { name: "Medialunas", quantity: 12 },
        { name: "Cappuccino", quantity: 48 },
      ]),
    ).toEqual([
      { name: "Cappuccino", quantity: 48, ratio: 1 },
      { name: "Medialunas", quantity: 12, ratio: 0.25 },
    ]);
  });
});

/** Cross-screen agreement lives in `src/mocks/service-day/service-day.test.ts`. */
describe("getOverviewKpis with the service day", () => {
  it("derives the four primary KPIs from the service day", () => {
    expect(getOverviewKpis(OVERVIEW_SNAPSHOT)).toEqual([
      { id: "new-orders", label: "Pedidos nuevos", value: "2", subtitle: "Esperan preparación", tone: "warning" },
      { id: "pending-bills", label: "Cuentas pendientes", value: "3", subtitle: "Esperan atención", tone: "danger" },
      { id: "occupied-tables", label: "Mesas ocupadas", value: "10", subtitle: "De 12 mesas habilitadas", tone: "brand" },
      { id: "collected", label: "Total cobrado", value: "$100.900", subtitle: "Cobros confirmados hoy", tone: "success" },
    ]);
  });

  it("feeds the panels of the design", () => {
    expect(OVERVIEW_SNAPSHOT.orders.map(formatOrderIdentity)).toEqual([
      "#1051 · Mesa 03 · Martina",
      "#1052 · Mesa 08 · Tomás",
    ]);
    expect(OVERVIEW_SNAPSHOT.billRequests.map((bill) => [bill.table, formatBillMeta(bill), bill.waitMinutes])).toEqual([
      ["10", "Transferencia · Total $31.200", 18],
      ["05", "En mesa · Total $21.500", 12],
      ["07", "En caja · Total $19.900", 7],
    ]);
    expect(formatTablesSummary(summarizeTables(OVERVIEW_SNAPSHOT.tables))).toBe(
      "12 habilitadas · 2 libres · 10 ocupadas · 5 con cuenta · 4 preparando",
    );
    expect(groupSalesByHour(OVERVIEW_SNAPSHOT.payments).map((bar) => [bar.hour, bar.total])).toEqual([
      ["12:00", 14300],
      ["13:00", 38300],
      ["14:00", 48300],
    ]);
    expect(getFinancialSummary(OVERVIEW_SNAPSHOT.payments, OVERVIEW_SNAPSHOT.confirmedOrders)).toEqual({
      total: 100900,
      closedBills: 5,
      averageTicket: 20180,
      confirmedOrders: 36,
    });
  });
});
