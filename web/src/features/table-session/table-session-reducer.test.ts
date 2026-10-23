import { describe, expect, it } from "vitest";
import { SEED_ORDERS } from "@/mocks/table";
import {
  buildOrder,
  getNextOrderNumber,
  initialSession,
  parseStoredSession,
  selectOrderById,
  selectTableTotal,
  tableSessionReducer,
  type PlaceOrderInput,
} from "./table-session-reducer";

const input: PlaceOrderInput = {
  customerName: "  Sofía ",
  note: " Todo junto, por favor. ",
  time: "12:30",
  lines: [
    { productId: "cappuccino", choiceIds: ["mediano", "almendras"], quantity: 1, note: "Poco caliente" },
    { productId: "medialunas", choiceIds: [], quantity: 2 },
  ],
};

describe("initialSession", () => {
  it("starts with the seed orders, an open table and no payment preference", () => {
    expect(initialSession.orders).toEqual(SEED_ORDERS);
    expect(initialSession.tableStatus).toBe("open");
    expect(initialSession.paymentPreference).toBeNull();
  });
});

describe("getNextOrderNumber", () => {
  it("continues after the highest order number", () => {
    expect(getNextOrderNumber(SEED_ORDERS)).toBe("1043");
  });

  it("starts at 1001 without orders", () => {
    expect(getNextOrderNumber([])).toBe("1001");
  });
});

describe("buildOrder", () => {
  it("creates a sent order with menu prices, trimmed name and note", () => {
    const result = buildOrder(initialSession, input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order).toMatchObject({
      id: "order-1043",
      number: "1043",
      customerName: "Sofía",
      note: "Todo junto, por favor.",
      time: "12:30",
      status: "sent",
    });
    expect(result.order.lines).toEqual([
      {
        productId: "cappuccino",
        name: "Cappuccino",
        quantity: 1,
        unitPrice: 5400,
        customization: "Mediano · Leche de almendras",
        note: "Poco caliente",
      },
      {
        productId: "medialunas",
        name: "Medialunas",
        quantity: 2,
        unitPrice: 3800,
        customization: undefined,
        note: undefined,
      },
    ]);
  });

  it("skips lines whose product no longer exists", () => {
    const result = buildOrder(initialSession, {
      ...input,
      lines: [...input.lines, { productId: "ghost", choiceIds: [], quantity: 1 }],
    });
    expect(result.ok && result.order.lines).toHaveLength(2);
  });

  it("rejects a blank customer name", () => {
    expect(buildOrder(initialSession, { ...input, customerName: "   " })).toEqual({
      ok: false,
      reason: "missing-name",
    });
  });

  it("rejects an order without valid lines", () => {
    expect(buildOrder(initialSession, { ...input, lines: [] })).toEqual({
      ok: false,
      reason: "empty",
    });
  });

  it("rejects new orders while the table account is closed", () => {
    expect(buildOrder({ ...initialSession, tableStatus: "closed" }, input)).toEqual({
      ok: false,
      reason: "table-closed",
    });
  });
});

describe("tableSessionReducer", () => {
  it("appends a placed order, which then counts in the table total", () => {
    const result = buildOrder(initialSession, input);
    if (!result.ok) throw new Error("expected a valid order");
    const state = tableSessionReducer(initialSession, { type: "addOrder", order: result.order });
    expect(state.orders).toHaveLength(2);
    expect(selectOrderById(state, "order-1043")?.customerName).toBe("Sofía");
    expect(selectTableTotal(state)).toBe(13000 + 5400 + 7600);
  });

  it("ignores an order whose id already exists", () => {
    const state = tableSessionReducer(initialSession, { type: "addOrder", order: SEED_ORDERS[0] });
    expect(state).toBe(initialSession);
  });

  it("updates an order status", () => {
    const state = tableSessionReducer(initialSession, {
      type: "setOrderStatus",
      orderId: "order-1042",
      status: "cancelled",
    });
    expect(selectOrderById(state, "order-1042")?.status).toBe("cancelled");
  });

  it("sets the table status and the payment preference", () => {
    let state = tableSessionReducer(initialSession, { type: "setTableStatus", status: "requested" });
    state = tableSessionReducer(state, { type: "setPaymentPreference", preference: "transfer" });
    expect(state.tableStatus).toBe("requested");
    expect(state.paymentPreference).toBe("transfer");
  });

  it("resets to the initial session", () => {
    const changed = tableSessionReducer(initialSession, { type: "setTableStatus", status: "closed" });
    expect(tableSessionReducer(changed, { type: "reset" })).toEqual(initialSession);
  });

  it("replaces the state on hydrate", () => {
    const stored = { ...initialSession, tableStatus: "attending" as const };
    expect(tableSessionReducer(initialSession, { type: "hydrate", state: stored })).toBe(stored);
  });
});

describe("selectOrderById", () => {
  it("returns undefined for an unknown id", () => {
    expect(selectOrderById(initialSession, "order-0")).toBeUndefined();
  });
});

describe("parseStoredSession", () => {
  it("round-trips a serialized session", () => {
    const raw = JSON.stringify({ ...initialSession, paymentPreference: "cashier" });
    expect(parseStoredSession(raw)).toEqual({ ...initialSession, paymentPreference: "cashier" });
  });

  it("falls back to the initial session on missing or malformed data", () => {
    expect(parseStoredSession(null)).toBe(initialSession);
    expect(parseStoredSession("{oops")).toBe(initialSession);
    expect(parseStoredSession(JSON.stringify({ orders: "x" }))).toBe(initialSession);
    expect(
      parseStoredSession(JSON.stringify({ ...initialSession, tableStatus: "exploded" })),
    ).toBe(initialSession);
  });
});
