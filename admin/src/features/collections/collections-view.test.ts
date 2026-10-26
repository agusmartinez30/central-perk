import { describe, expect, it } from "vitest";
import type { ManagedCollection } from "@/mocks/types";
import { BILL_REQUESTS_BOARD, COLLECTIONS_HISTORY, OVERVIEW_SNAPSHOT } from "@/mocks/service-day";
import {
  METHOD_FILTERS,
  PERIOD_FILTERS,
  SORT_OPTIONS,
  filterCollections,
  formatCollectionDate,
  formatCollectionDateTime,
  formatDateRange,
  formatOrderProducts,
  formatOrderTitle,
  formatResultCount,
  formatTableLabel,
  getAccountTotals,
  getAuditEvents,
  getCollectionFacts,
  getCollectionMetrics,
  getCollectionSubtotal,
  getMethodLabel,
  getPeriodRange,
  getStaffOptions,
  getStatusBadge,
  getTotalsByMethod,
  sortCollections,
} from "./collections-view";

const { collections, today } = COLLECTIONS_HISTORY;
const todayRange = getPeriodRange("today", today);
const todays = filterCollections(collections, { range: todayRange, method: "all", staff: "all", query: "" });
const byId = (id: string) => collections.find((collection) => collection.id === id) as ManagedCollection;

const collection = (overrides: Partial<ManagedCollection> & Pick<ManagedCollection, "id">): ManagedCollection => ({
  accountId: "CTA-001",
  tableNumber: 1,
  date: "2026-10-21",
  time: "12:00",
  method: "cash",
  customerPreference: "register",
  amount: 1000,
  adjustments: 0,
  confirmedBy: "Mariana",
  status: "confirmed",
  orders: [{ id: 1, customer: "Ana", items: [{ quantity: 1, name: "Café" }], total: 1000 }],
  audit: [],
  ...overrides,
});

/** Full cross-screen agreement lives in `src/mocks/service-day/service-day.test.ts`. */
describe("COLLECTIONS_HISTORY of the service day", () => {
  it("lists today's five collections, newest first", () => {
    expect(sortCollections(todays, "recent").map((item) => [item.id, formatTableLabel(item), item.time, item.amount])).toEqual([
      ["COB-0026", "Mesa 09", "14:35", 19900],
      ["COB-0025", "Mesa 01", "14:12", 28400],
      ["COB-0024", "Mesa 04", "13:48", 21500],
      ["COB-0023", "Mesa 01", "13:15", 16800],
      ["COB-0022", "Mesa 09", "12:24", 14300],
    ]);
  });

  it("keeps today's totals of the 10A financial summary", () => {
    const overviewTotal = OVERVIEW_SNAPSHOT.payments.reduce((sum, payment) => sum + payment.amount, 0);
    expect(todays.reduce((sum, item) => sum + item.amount, 0)).toBe(overviewTotal);
    expect(todays).toHaveLength(OVERVIEW_SNAPSHOT.payments.length);
  });

  it("closes the finalized 04 request of Mesa 09 with its total, preference, orders and staff member", () => {
    const request = BILL_REQUESTS_BOARD.requests.find((item) => item.status === "finalized");
    const closed = byId("COB-0022");
    expect(request?.tableNumber).toBe(closed.tableNumber);
    expect(closed.amount).toBe(request?.total);
    expect(closed.customerPreference).toBe(request?.paymentPreference);
    expect(closed.orders).toHaveLength(request?.confirmedOrders ?? -1);
    expect(closed.confirmedBy).toBe(request?.assignee);
  });

  it("settles every account: amount equals its orders plus adjustments", () => {
    for (const item of collections) {
      expect(item.amount).toBe(getCollectionSubtotal(item) + item.adjustments);
    }
  });

  it("uses unique operation and account codes and opens COB-0026 in the selected export", () => {
    expect(new Set(collections.map((item) => item.id)).size).toBe(collections.length);
    expect(new Set(collections.map((item) => item.accountId)).size).toBe(collections.length);
    expect(COLLECTIONS_HISTORY.selectedId).toBe("COB-0026");
  });
});

describe("getPeriodRange / formatDateRange", () => {
  it("resolves the quick date filters around the mock day", () => {
    expect(PERIOD_FILTERS.map((filter) => filter.label)).toEqual(["Hoy", "Ayer", "Últimos 7 días"]);
    expect(getPeriodRange("today", "2026-10-21")).toEqual({ from: "2026-10-21", to: "2026-10-21" });
    expect(getPeriodRange("yesterday", "2026-10-21")).toEqual({ from: "2026-10-20", to: "2026-10-20" });
    expect(getPeriodRange("last-7-days", "2026-10-21")).toEqual({ from: "2026-10-15", to: "2026-10-21" });
    expect(getPeriodRange("yesterday", "2026-11-01")).toEqual({ from: "2026-10-31", to: "2026-10-31" });
  });

  it("formats the range as the 'Custom Date Range' label", () => {
    expect(formatDateRange(todayRange)).toBe("21/10/2026 — 21/10/2026");
    expect(formatDateRange(getPeriodRange("last-7-days", today))).toBe("15/10/2026 — 21/10/2026");
  });
});

describe("getCollectionMetrics", () => {
  it("keeps the four 05 tiles for today", () => {
    expect(getCollectionMetrics(todays).map((metric) => [metric.label, metric.value])).toEqual([
      ["Total cobrado", "$100.900"],
      ["Cuentas cerradas", "5"],
      ["Ticket promedio", "$20.180"],
      ["Transferencias", "$42.700"],
    ]);
  });

  it("shows zero values without a division by zero", () => {
    expect(getCollectionMetrics([]).map((metric) => metric.value)).toEqual(["$0", "0", "$0", "$0"]);
  });
});

describe("getTotalsByMethod", () => {
  it("adds up today's collections per payment method", () => {
    expect(getTotalsByMethod(todays)).toEqual({ cash: 36700, transfer: 42700, card: 21500 });
    expect(getTotalsByMethod([])).toEqual({ cash: 0, transfer: 0, card: 0 });
  });
});

describe("filterCollections", () => {
  const base = { range: todayRange, method: "all", staff: "all", query: "" } as const;
  const ids = (items: ManagedCollection[]) => items.map((item) => item.id);

  it("keeps only the collections inside the period", () => {
    const yesterday = filterCollections(collections, { ...base, range: getPeriodRange("yesterday", today) });
    expect(yesterday.length).toBeGreaterThan(0);
    expect(yesterday.every((item) => item.date === "2026-10-20")).toBe(true);
    const week = filterCollections(collections, { ...base, range: getPeriodRange("last-7-days", today) });
    expect(week).toHaveLength(collections.length);
  });

  it("filters by payment method and by staff member", () => {
    expect(ids(filterCollections(collections, { ...base, method: "transfer" }))).toEqual(["COB-0025", "COB-0022"]);
    expect(ids(filterCollections(collections, { ...base, staff: "Lucas" }))).toEqual(["COB-0025", "COB-0023"]);
  });

  it("searches by table, account or operation ignoring case, padding and the '#' sign", () => {
    expect(ids(filterCollections(collections, { ...base, query: "mesa 9" }))).toEqual(["COB-0026", "COB-0022"]);
    expect(ids(filterCollections(collections, { ...base, query: "Mesa 04" }))).toEqual(["COB-0024"]);
    expect(ids(filterCollections(collections, { ...base, query: "1" }))).toEqual(["COB-0025", "COB-0023"]);
    expect(ids(filterCollections(collections, { ...base, query: "cta-025" }))).toEqual(["COB-0025"]);
    expect(ids(filterCollections(collections, { ...base, query: "#cob-0024" }))).toEqual(["COB-0024"]);
    expect(ids(filterCollections(collections, { ...base, query: "26" }))).toEqual(["COB-0026"]);
    expect(filterCollections(collections, { ...base, query: "Mesa 99" })).toEqual([]);
    expect(filterCollections(collections, { ...base, query: "  " })).toHaveLength(5);
  });
});

describe("sortCollections", () => {
  const items = [
    collection({ id: "A", date: "2026-10-20", time: "20:00", amount: 500 }),
    collection({ id: "B", date: "2026-10-21", time: "09:30", amount: 900 }),
    collection({ id: "C", date: "2026-10-21", time: "13:00", amount: 100 }),
  ];

  it("orders by close time or by amount without mutating the input", () => {
    expect(SORT_OPTIONS.map((option) => option.label)).toEqual(["Más recientes", "Más antiguos", "Mayor importe"]);
    expect(sortCollections(items, "recent").map((item) => item.id)).toEqual(["C", "B", "A"]);
    expect(sortCollections(items, "oldest").map((item) => item.id)).toEqual(["A", "B", "C"]);
    expect(sortCollections(items, "highest-amount").map((item) => item.id)).toEqual(["B", "A", "C"]);
    expect(items.map((item) => item.id)).toEqual(["A", "B", "C"]);
  });
});

describe("formatResultCount", () => {
  it("formats the 'History Result Count'", () => {
    expect(formatResultCount({ from: 1, to: 5, total: 128 })).toBe("Mostrando 1–5 de 128 operaciones");
    expect(formatResultCount({ from: 1, to: 1, total: 1 })).toBe("Mostrando 1–1 de 1 operación");
    expect(formatResultCount({ from: 0, to: 0, total: 0 })).toBe("Sin operaciones para mostrar");
  });
});

describe("filter options", () => {
  it("offers every payment method and the staff of the loaded collections", () => {
    expect(METHOD_FILTERS.map((filter) => filter.label)).toEqual([
      "Todos los medios",
      "Efectivo",
      "Transferencia",
      "Tarjeta",
    ]);
    expect(getStaffOptions(todays)).toEqual([
      { id: "all", label: "Todo el personal" },
      { id: "Lucas", label: "Lucas" },
      { id: "María G.", label: "María G." },
      { id: "Mariana", label: "Mariana" },
    ]);
  });
});

describe("formatting", () => {
  it("formats dates, tables, methods and the status pill", () => {
    const selected = byId("COB-0026");
    expect(formatCollectionDate(selected)).toBe("21/10/2026");
    expect(formatCollectionDateTime(selected)).toBe("21/10/2026 · 14:35");
    expect(formatTableLabel({ tableNumber: 12 })).toBe("Mesa 12");
    expect(getMethodLabel("cash")).toBe("Efectivo");
    expect(getMethodLabel("card")).toBe("Tarjeta");
    expect(getStatusBadge("confirmed")).toEqual({ label: "Confirmado", tone: "success" });
  });
});

describe("selected collection detail", () => {
  const selected = byId("COB-0026");

  it("lists the 'Payment Facts' of the drawer", () => {
    expect(getCollectionFacts(selected)).toEqual([
      { label: "Cierre de sesión", value: "21/10/2026 · 14:35" },
      { label: "Importe confirmado", value: "$19.900" },
      { label: "Medio real", value: "Efectivo" },
      { label: "Preferencia cliente", value: "En caja" },
      { label: "Confirmado por", value: "Mariana" },
    ]);
  });

  it("summarizes each order of the account", () => {
    expect(selected.orders.map((order) => [formatOrderTitle(order), formatOrderProducts(order)])).toEqual([
      ["Pedido #1027 · Ignacio", "1 Cappuccino · 1 Café latte"],
      ["Pedido #1036 · Rocío", "1 Tostón de palta · 1 Limonada"],
    ]);
  });

  it("shows the 'Account Totals' with adjustments", () => {
    expect(getAccountTotals(selected)).toEqual([
      { label: "Subtotal", value: "$19.900" },
      { label: "Descuentos y ajustes", value: "$0" },
      { label: "Total final", value: "$19.900" },
    ]);
    const discounted = collection({ id: "D", amount: 800, adjustments: -200 });
    expect(getAccountTotals(discounted).map((row) => row.value)).toEqual(["$1.000", "-$200", "$800"]);
  });

  it("builds the 'Drawer Audit Timeline'", () => {
    expect(getAuditEvents(selected)).toEqual([
      { label: "Pago confirmado · Mariana", at: "21/10/2026 · 14:35" },
      { label: "Saldo actualizado a $0", at: "21/10/2026 · 14:35" },
      { label: "Sesión de mesa cerrada", at: "21/10/2026 · 14:36" },
    ]);
  });
});
