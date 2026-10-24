import { describe, expect, it } from "vitest";
import { getRequestMetrics } from "@/features/bill-requests/bill-requests-view";
import { filterCollections, getCollectionMetrics, getPeriodRange } from "@/features/collections/collections-view";
import { getOrderTotal } from "@/features/orders/orders-view";
import { getFinancialSummary, getOverviewKpis, summarizeTables } from "@/features/overview/overview-view";
import { getTableActivity } from "@/features/tables/tables-view";
import { formatPrice } from "@/shared/lib/format-price";
import {
  BILL_REQUESTS_BOARD,
  COLLECTIONS_HISTORY,
  DELIVERED_BOARD_WINDOW_MINUTES,
  ORDERS_BOARD,
  OVERVIEW_SNAPSHOT,
  PAYMENT_METHODS,
  REQUEST_MODES,
  SERVICE_DAY,
  TABLE_SECTORS,
  TABLES_BOARD,
  minutesBetween,
} from "./index";

const day = SERVICE_DAY;
const isToday = (sessionId: string) => day.sessions.find((session) => session.id === sessionId)?.date === day.date;
const openSessions = day.sessions.filter((session) => !session.closedAt);
const openSessionIds = new Set(openSessions.map((session) => session.id));
const sessionOf = (id: string) => day.sessions.find((session) => session.id === id);
const ordersOf = (sessionId: string) =>
  day.orders.filter((order) => order.sessionId === sessionId && order.status !== "cancelled");
const tableOf = (number: number) => TABLES_BOARD.tables.find((table) => table.number === number);
const requestOf = (number: number) => BILL_REQUESTS_BOARD.requests.find((request) => request.tableNumber === number);
const todaysCollections = filterCollections(COLLECTIONS_HISTORY.collections, {
  range: getPeriodRange("today", COLLECTIONS_HISTORY.today),
  method: "all",
  staff: "all",
  query: "",
});

describe("minutesBetween", () => {
  it("counts minutes between two local times", () => {
    expect(minutesBetween("12:42", "13:00")).toBe(18);
    expect(minutesBetween("13:58", "14:02")).toBe(4);
  });
});

describe("service day data", () => {
  it("prices every order item from the catalogue", () => {
    for (const order of day.orders) {
      for (const item of order.items) {
        const product = day.products.find((candidate) => candidate.id === item.productId);
        expect(product, item.id).toBeDefined();
        expect(item.unitPrice, item.id).toBe(product?.price);
      }
    }
  });

  it("uses unique ids for orders, sessions, bill requests and collections", () => {
    for (const ids of [
      day.orders.map((order) => String(order.id)),
      day.sessions.map((session) => session.id),
      day.billRequests.map((request) => request.id),
      day.collections.map((collection) => String(collection.number)),
    ]) {
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("keeps every order inside its table session", () => {
    for (const order of day.orders) {
      const session = sessionOf(order.sessionId);
      expect(session, `#${order.id}`).toBeDefined();
      expect(order.tableNumber, `#${order.id}`).toBe(session?.tableNumber);
      expect(order.receivedAt >= (session?.openedAt ?? ""), `#${order.id}`).toBe(true);
      if (session?.closedAt) expect(order.status, `#${order.id}`).toBe("delivered");
      for (const event of order.history) {
        expect(event.at >= order.receivedAt && event.at <= (session?.closedAt ?? day.now), `#${order.id}`).toBe(true);
      }
    }
  });

  it("seats at most one session per table and never overlaps sessions of the same table", () => {
    for (const number of day.tableNumbers) {
      expect(openSessions.filter((session) => session.tableNumber === number).length).toBeLessThanOrEqual(1);
      const today = day.sessions
        .filter((session) => session.tableNumber === number && session.date === day.date)
        .sort((a, b) => a.openedAt.localeCompare(b.openedAt));
      today.forEach((session, index) => {
        if (index === 0) return;
        expect(session.openedAt > (today[index - 1].closedAt ?? "99:99"), session.id).toBe(true);
      });
    }
  });

  it("never seats the same customer at two tables at the same time", () => {
    const tablesByCustomer = new Map<string, Set<number>>();
    for (const order of day.orders.filter((item) => openSessionIds.has(item.sessionId))) {
      tablesByCustomer.set(order.customer, (tablesByCustomer.get(order.customer) ?? new Set()).add(order.tableNumber));
    }
    for (const [customer, tables] of tablesByCustomer) expect(tables.size, customer).toBe(1);
  });

  it("asks for the bill on behalf of a customer of the session, at most once per session", () => {
    for (const request of day.billRequests) {
      expect(ordersOf(request.sessionId).map((order) => order.customer), request.id).toContain(request.customer);
      expect(day.billRequests.filter((item) => item.sessionId === request.sessionId)).toHaveLength(1);
      if (request.status !== "pending") expect(day.staff.map((member) => member.name)).toContain(request.assignee);
    }
  });
});

describe("tables (02) agree with orders (03) and bill requests (04)", () => {
  it("derives every table's status, counts and total from its open session", () => {
    for (const number of day.tableNumbers) {
      const table = tableOf(number);
      const session = openSessions.find((item) => item.tableNumber === number);
      const request = day.billRequests.find((item) => item.sessionId === session?.id && item.status !== "finalized");
      const orders = session ? ordersOf(session.id) : [];
      expect(table?.status, `Mesa ${number}`).toBe(!session ? "available" : request ? "bill-requested" : "occupied");
      expect(table?.confirmedOrders, `Mesa ${number}`).toBe(orders.length);
      expect(table?.pendingKitchenOrders, `Mesa ${number}`).toBe(
        orders.filter((order) => order.status === "received" || order.status === "preparing").length,
      );
      expect(table?.accountTotal, `Mesa ${number}`).toBe(orders.reduce((sum, order) => sum + getOrderTotal(order), 0));
    }
  });

  it("shows the same account, kitchen count, preference and wait in 02 and 04", () => {
    for (const table of TABLES_BOARD.tables.filter((item) => item.status === "bill-requested")) {
      expect(requestOf(table.number), `Mesa ${table.number}`).toMatchObject({
        total: table.accountTotal,
        confirmedOrders: table.confirmedOrders,
        ordersInPreparation: table.pendingKitchenOrders,
        paymentPreference: table.paymentPreference,
        waitMinutes: table.billRequestedMinutesAgo,
      });
    }
    const activeTables = BILL_REQUESTS_BOARD.requests.filter((request) => request.status !== "finalized");
    expect(activeTables.map((request) => tableOf(request.tableNumber)?.status)).toEqual(
      activeTables.map(() => "bill-requested"),
    );
  });

  it("puts every unfinished order of a seated table on the kitchen board, and nothing else", () => {
    const unfinished = day.orders.filter(
      (order) => openSessionIds.has(order.sessionId) && (order.status === "received" || order.status === "preparing"),
    );
    for (const order of unfinished) expect(ORDERS_BOARD.orders.map((item) => item.id)).toContain(order.id);
    for (const order of ORDERS_BOARD.orders) {
      expect(tableOf(order.tableNumber)?.status, `#${order.id}`).not.toBe("available");
      if (order.status === "delivered") {
        const deliveredAt = order.history.find((event) => event.kind === "delivered")?.at ?? "";
        expect(minutesBetween(deliveredAt, day.now)).toBeLessThanOrEqual(DELIVERED_BOARD_WINDOW_MINUTES);
      }
    }
  });

  it("measures 04 waits from the request time to now", () => {
    for (const request of BILL_REQUESTS_BOARD.requests.filter((item) => item.status !== "finalized")) {
      expect(request.waitMinutes, request.id).toBe(minutesBetween(request.requestedAt, day.now));
    }
  });
});

describe("overview (10A) adds up the other screens", () => {
  it("summarizes the same tables as 02", () => {
    const summary = summarizeTables(OVERVIEW_SNAPSHOT.tables);
    const activities = TABLES_BOARD.tables.map(getTableActivity);
    expect(summary.enabled).toBe(TABLES_BOARD.tables.length);
    expect(summary.free).toBe(activities.filter((activity) => activity === "available").length);
    expect(summary.withBill).toBe(activities.filter((activity) => activity === "bill-requested").length);
    expect(summary.preparing).toBe(TABLES_BOARD.tables.filter((table) => table.pendingKitchenOrders > 0).length);
  });

  it("derives the four KPIs from the rows of 03, 04, 02 and 05", () => {
    const [newOrders, pendingBills, occupied, collected] = getOverviewKpis(OVERVIEW_SNAPSHOT);
    expect(Number(newOrders.value)).toBe(ORDERS_BOARD.orders.filter((order) => order.status === "received").length);
    expect(Number(pendingBills.value)).toBe(getRequestMetrics(BILL_REQUESTS_BOARD.requests)[0].value);
    expect(Number(occupied.value)).toBe(TABLES_BOARD.tables.filter((table) => table.status !== "available").length);
    expect(collected.value).toBe(getCollectionMetrics(todaysCollections)[0].value);
  });

  it("lists the received orders of 03 with their wait", () => {
    const received = ORDERS_BOARD.orders.filter((order) => order.status === "received");
    expect(OVERVIEW_SNAPSHOT.orders.map((order) => order.id).sort()).toEqual(received.map((order) => order.id).sort());
    for (const attention of OVERVIEW_SNAPSHOT.orders) {
      const order = received.find((item) => item.id === attention.id);
      expect(attention.customer).toBe(order?.customer);
      expect(Number(attention.table)).toBe(order?.tableNumber);
      expect(attention.waitMinutes).toBe(minutesBetween(order?.receivedAt ?? "", day.now));
    }
  });

  it("lists the pending bill requests of 04 with the same total, preference, wait and kitchen count", () => {
    const pending = BILL_REQUESTS_BOARD.requests.filter((request) => request.status === "pending");
    expect(OVERVIEW_SNAPSHOT.billRequests.map((bill) => Number(bill.table))).toEqual(
      pending.map((request) => request.tableNumber),
    );
    for (const bill of OVERVIEW_SNAPSHOT.billRequests) {
      expect(requestOf(Number(bill.table))).toMatchObject({
        total: bill.total,
        paymentPreference: bill.paymentMethod,
        waitMinutes: bill.waitMinutes,
        ordersInPreparation: bill.ordersInPreparation,
      });
    }
  });

  it("charts and totals exactly today's 05 collections", () => {
    expect(OVERVIEW_SNAPSHOT.payments.map((payment) => [payment.amount, payment.closedAt]).sort()).toEqual(
      todaysCollections.map((collection) => [collection.amount, collection.time]).sort(),
    );
    const summary = getFinancialSummary(OVERVIEW_SNAPSHOT.payments, OVERVIEW_SNAPSHOT.confirmedOrders);
    expect(summary.total).toBe(todaysCollections.reduce((sum, collection) => sum + collection.amount, 0));
    expect(summary.closedBills).toBe(todaysCollections.length);
  });

  it("counts today's confirmed orders and best sellers from the orders", () => {
    const todays = day.orders.filter((order) => isToday(order.sessionId) && order.status !== "cancelled");
    expect(OVERVIEW_SNAPSHOT.confirmedOrders).toBe(todays.length);
    for (const seller of OVERVIEW_SNAPSHOT.bestSellers) {
      const product = day.products.find((item) => item.name === seller.name);
      const sold = todays
        .flatMap((order) => order.items)
        .filter((item) => item.productId === product?.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      expect(seller.quantity, seller.name).toBe(sold);
    }
  });

  it("syncs every live screen at the same time", () => {
    expect(OVERVIEW_SNAPSHOT.lastSync).toBe(TABLES_BOARD.syncedAt);
  });
});

describe("bill requests (04) and collections (05)", () => {
  it("closes every finalized request with a collection of the same total, preference and staff member", () => {
    for (const request of day.billRequests.filter((item) => item.status === "finalized")) {
      const collection = day.collections.find((item) => item.sessionId === request.sessionId);
      const row = COLLECTIONS_HISTORY.collections.find((item) => item.id === `COB-${String(collection?.number).padStart(4, "0")}`);
      const board = BILL_REQUESTS_BOARD.requests.find((item) => item.id === request.id);
      expect(row, request.id).toBeDefined();
      expect(row?.amount).toBe(board?.total);
      expect(row?.customerPreference).toBe(request.paymentPreference);
      expect(row?.confirmedBy).toBe(request.assignee);
      expect(row?.tableNumber).toBe(board?.tableNumber);
      expect(board?.waitMinutes).toBe(minutesBetween(request.requestedAt, collection?.time ?? ""));
    }
  });

  it("only collects closed sessions, never one with an active request", () => {
    for (const collection of day.collections) {
      const session = sessionOf(collection.sessionId);
      expect(session?.closedAt, `#${collection.number}`).toBeDefined();
      expect(collection.time <= (session?.closedAt ?? "")).toBe(true);
      expect(
        day.billRequests.some((request) => request.sessionId === collection.sessionId && request.status !== "finalized"),
      ).toBe(false);
    }
    for (const session of day.sessions.filter((item) => item.closedAt)) {
      expect(day.collections.filter((item) => item.sessionId === session.id), session.id).toHaveLength(1);
    }
  });

  it("settles each collection with its session's orders", () => {
    for (const row of COLLECTIONS_HISTORY.collections) {
      const collection = day.collections.find((item) => `COB-${String(item.number).padStart(4, "0")}` === row.id);
      const orders = ordersOf(collection?.sessionId ?? "");
      expect(row.orders.map((order) => order.id)).toEqual(orders.map((order) => order.id));
      expect(row.amount).toBe(orders.reduce((sum, order) => sum + getOrderTotal(order), 0) + row.adjustments);
    }
  });

  it("matches the 'Transferencias' tile with the sum of today's transfers", () => {
    const transfers = todaysCollections
      .filter((collection) => collection.method === "transfer")
      .reduce((sum, collection) => sum + collection.amount, 0);
    expect(transfers).toBeGreaterThan(0);
    expect(getCollectionMetrics(todaysCollections)[3].value).toBe(formatPrice(transfers));
  });

  it("only uses payment methods and request modes enabled in 06", () => {
    const { methods, requestModes } = day.paymentSettings.settings;
    for (const collection of day.collections) {
      expect(methods[collection.method], `#${collection.number}`).toBe(true);
      expect(requestModes[collection.customerPreference], `#${collection.number}`).toBe(true);
    }
    for (const request of day.billRequests) expect(requestModes[request.paymentPreference], request.id).toBe(true);
    expect(PAYMENT_METHODS.map((method) => method.label)).toEqual(["Efectivo", "Tarjeta", "Transferencia", "Otro"]);
    expect(REQUEST_MODES.map((mode) => mode.label)).toEqual(["En mesa", "En caja", "Por transferencia"]);
  });

  it("confirms collections with members of the staff", () => {
    for (const collection of day.collections) {
      expect(day.staff.map((member) => member.name)).toContain(collection.confirmedBy);
    }
  });
});

describe("venue tables (09)", () => {
  const tables = day.tables;

  it("configures the twelve tables of 02 with the 09A sectors and capacities", () => {
    expect(tables.map((table) => table.label)).toEqual(
      Array.from({ length: 12 }, (_, index) => `Mesa ${String(index + 1).padStart(2, "0")}`),
    );
    expect(tables.map((table) => table.sector)).toEqual([
      "interior", "interior", "interior", "interior", "terraza", "terraza",
      "interior", "terraza", "patio", "patio", "patio", "patio",
    ]);
    expect(tables.map((table) => table.capacity)).toEqual([2, 4, 4, 2, 4, 2, 4, 6, 4, 6, 4, 2]);
    expect(TABLE_SECTORS.map((sector) => sector.label)).toEqual(["Interior", "Terraza", "Patio"]);
  });

  it("uses unique, stable ids, numbers and labels", () => {
    for (const values of <unknown[][]>[
      tables.map((table) => table.id),
      tables.map((table) => table.number),
      tables.map((table) => table.label.toLowerCase()),
    ]) {
      expect(new Set(values).size).toBe(values.length);
    }
    for (const table of tables) expect(table.id).toBe(`tbl_${String(table.number).padStart(2, "0")}`);
  });

  it("shows exactly the enabled tables on the live screens", () => {
    expect(day.tableNumbers).toEqual(tables.filter((table) => table.enabled).map((table) => table.number));
    expect(TABLES_BOARD.tables.map((table) => table.number)).toEqual(day.tableNumbers);
  });

  it("seats sessions only at configured tables", () => {
    const numbers = new Set(tables.map((table) => table.number));
    for (const session of day.sessions) expect(numbers.has(session.tableNumber), session.id).toBe(true);
  });

  it("never reuses a QR token, active or revoked", () => {
    const tokens = tables.flatMap((table) => [
      ...(table.qr ? [table.qr.token] : []),
      ...table.revokedQrs.map((credential) => credential.token),
    ]);
    expect(new Set(tokens).size).toBe(tokens.length);
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9]{10}$/);
  });

  it("gives Mesa 07 the 09B/09C credential and its rotation history", () => {
    const table = tables.find((candidate) => candidate.id === "tbl_07");
    expect(table).toMatchObject({ label: "Mesa 07", description: "Cerca de la ventana", version: 18 });
    expect(table?.qr).toEqual({ token: "4pX9kR2mL7", generatedOn: day.date, generatedBy: "Sofía M." });
    expect(table?.revokedQrs.map((credential) => credential.auditId)).toEqual(["QR-118"]);
  });

  it("generates and rotates credentials with members of the staff, never in the future", () => {
    const staff = day.staff.map((member) => member.name);
    for (const table of tables) {
      for (const credential of [...(table.qr ? [table.qr] : []), ...table.revokedQrs]) {
        expect(staff, table.id).toContain(credential.generatedBy);
        expect(credential.generatedOn <= day.date, table.id).toBe(true);
      }
      for (const credential of table.revokedQrs) {
        expect(credential.generatedOn <= credential.revokedOn, table.id).toBe(true);
        expect(credential.revokedOn <= (table.qr?.generatedOn ?? day.date), table.id).toBe(true);
      }
    }
  });
});
