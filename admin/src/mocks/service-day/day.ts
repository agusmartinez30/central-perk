import { PAYMENT_SETTINGS } from "../payments";
import type { BillPaymentMethod, CollectionMethod, OrderHistoryEvent } from "../types";
import { PRODUCTS, STAFF } from "./catalog";
import { VENUE_SPACES, VENUE_TABLES } from "./tables";
import { addMinutes } from "./time";
import type {
  ServiceBillRequest,
  ServiceCollection,
  ServiceDay,
  ServiceOrder,
  ServiceOrderItem,
  TableSession,
} from "./types";

/**
 * The service day every admin screen derives from: Wednesday 21/10/2026 at 14:42.
 *
 * Story: Mesa 09, 01 and 04 already closed five accounts today (05: $100.900, two transfers);
 * ten tables are seated now. Mesa 10, 05 and 07 asked for the bill and wait (04 pending, 10A),
 * Mesa 12 and 04 are in attention, Mesa 02, 03 and 08 have orders in the kitchen (03).
 * Every number on 02, 03, 04, 05 and 10A comes from these rows; see
 * `odd/tasks/admin-mock-unification.md` for the values that changed versus each export.
 */

const DATE = "2026-10-21";
const NOW = "14:42";

const pad = (value: number) => String(value).padStart(2, "0");

const sessionId = (date: string, table: number, index: number) => `S-${date}-${pad(table)}-${index}`;

function session(table: number, index: number, openedAt: string, closedAt?: string, date = DATE): TableSession {
  return { id: sessionId(date, table, index), tableNumber: table, date, openedAt, closedAt };
}

type LineSeed = [productId: string, quantity: number, extras?: { variant?: string; customization?: string }];

type OrderSeed = {
  id: number;
  session: TableSession;
  customer: string;
  at: string;
  lines: LineSeed[];
  note?: string;
  /** Defaults to "delivered". */
  status?: "received" | "preparing" | "delivered";
  /** Defaults to three minutes after `at`. */
  preparingAt?: string;
  deliveredAt?: string;
};

function item(orderId: number, index: number, [productId, quantity, extras]: LineSeed): ServiceOrderItem {
  const product = PRODUCTS.find((candidate) => candidate.id === productId);
  if (!product) throw new Error(`Unknown product ${productId}`);
  return {
    id: `${orderId}-${index + 1}`,
    productId,
    quantity,
    name: quantity > 1 && product.plural ? product.plural : product.name,
    unitPrice: product.price,
    ...extras,
  };
}

function order({ id, session, customer, at, lines, note, status = "delivered", preparingAt, deliveredAt }: OrderSeed): ServiceOrder {
  const history: OrderHistoryEvent[] = [
    { kind: "confirmed", at },
    { kind: "received", at },
  ];
  if (status !== "received") history.push({ kind: "preparing", at: preparingAt ?? addMinutes(at, 3) });
  if (status === "delivered") history.push({ kind: "delivered", at: deliveredAt ?? addMinutes(at, 12) });
  return {
    id,
    sessionId: session.id,
    tableNumber: session.tableNumber,
    customer,
    receivedAt: at,
    items: lines.map((line, index) => item(id, index, line)),
    note,
    status,
    history,
  };
}

// Closed sessions of today (05).
const MESA_09_A = session(9, 1, "11:30", "12:25");
const MESA_01_A = session(1, 1, "12:20", "13:16");
const MESA_04_A = session(4, 1, "12:35", "13:49");
const MESA_09_B = session(9, 2, "12:55", "14:36");
const MESA_01_B = session(1, 2, "13:25", "14:13");

// Seated tables (02).
const MESA_10 = session(10, 1, "12:30");
const MESA_05 = session(5, 1, "12:50");
const MESA_11 = session(11, 1, "13:00");
const MESA_08 = session(8, 1, "13:10");
const MESA_12 = session(12, 1, "13:15");
const MESA_03 = session(3, 1, "13:30");
const MESA_07 = session(7, 1, "13:35");
const MESA_02 = session(2, 1, "13:50");
const MESA_06 = session(6, 1, "13:54");
const MESA_04_B = session(4, 2, "14:00");

const TODAY_SESSIONS = [
  MESA_09_A,
  MESA_01_A,
  MESA_04_A,
  MESA_09_B,
  MESA_01_B,
  MESA_10,
  MESA_05,
  MESA_11,
  MESA_08,
  MESA_12,
  MESA_03,
  MESA_07,
  MESA_02,
  MESA_06,
  MESA_04_B,
];

/**
 * Today's orders. #1042, #1047, #1048, #1050, #1051 and #1052 keep the 03 / 10A products,
 * customizations and customers (#1048 is now Julieta's: Lucía asked for Mesa 10's bill);
 * their times are the 03 times moved to this 14:42 service, so 10A's waits (6 and 4 min) hold.
 */
const TODAY_ORDERS: ServiceOrder[] = [
  order({ id: 1018, session: MESA_09_A, customer: "Camila", at: "11:32", lines: [["cappuccino-grande", 1], ["medialuna", 1]], deliveredAt: "11:45" }),
  order({ id: 1019, session: MESA_09_A, customer: "Camila", at: "11:58", lines: [["cappuccino-grande", 1]], deliveredAt: "12:05" }),
  order({ id: 1020, session: MESA_01_A, customer: "Gabriel", at: "12:22", lines: [["cappuccino", 1], ["cafe-latte", 1]], deliveredAt: "12:30" }),
  order({ id: 1021, session: MESA_10, customer: "Lucía", at: "12:35", lines: [["jugo-naranja", 1], ["toston-palta", 1]], deliveredAt: "12:50" }),
  order({ id: 1022, session: MESA_04_A, customer: "Paula", at: "12:38", lines: [["cafe-latte", 1], ["medialuna", 1]], deliveredAt: "12:48" }),
  order({ id: 1023, session: MESA_01_A, customer: "Gabriel", at: "12:40", lines: [["cafe-latte", 1], ["cafe-con-leche", 1]], deliveredAt: "12:50" }),
  order({ id: 1024, session: MESA_04_A, customer: "Bruno", at: "12:50", lines: [["cappuccino", 1], ["cappuccino-grande", 1]], deliveredAt: "13:00" }),
  order({ id: 1025, session: MESA_10, customer: "Marcos", at: "12:51", lines: [["cappuccino", 1], ["cafe-latte", 1]], deliveredAt: "13:00" }),
  order({ id: 1026, session: MESA_05, customer: "Joaquín", at: "12:52", lines: [["tostado-clasico", 1]], deliveredAt: "13:05" }),
  order({ id: 1027, session: MESA_09_B, customer: "Ignacio", at: "12:58", lines: [["cappuccino", 1], ["cafe-latte", 1]], deliveredAt: "13:06" }),
  order({ id: 1028, session: MESA_11, customer: "Hernán", at: "13:05", lines: [["cafe-con-leche", 1], ["tostado-jamon-queso", 1]], deliveredAt: "13:18" }),
  order({ id: 1029, session: MESA_05, customer: "Emilia", at: "13:06", lines: [["limonada", 1], ["cafe-con-leche", 1]], deliveredAt: "13:14" }),
  order({ id: 1030, session: MESA_04_A, customer: "Paula", at: "13:10", lines: [["limonada", 1]], deliveredAt: "13:14" }),
  order({ id: 1031, session: MESA_08, customer: "Tomás", at: "13:12", lines: [["cappuccino", 1]], deliveredAt: "13:20" }),
  order({ id: 1032, session: MESA_08, customer: "Lola", at: "13:15", lines: [["cappuccino-grande", 1]], deliveredAt: "13:22" }),
  order({ id: 1033, session: MESA_12, customer: "Valentina", at: "13:18", lines: [["jugo-naranja", 1], ["medialuna", 1]], deliveredAt: "13:28" }),
  order({ id: 1034, session: MESA_05, customer: "Joaquín", at: "13:20", lines: [["tostado-jamon-queso", 1]], deliveredAt: "13:35" }),
  order({ id: 1035, session: MESA_01_B, customer: "Nicolás", at: "13:28", lines: [["cappuccino", 1], ["cappuccino-grande", 1]], deliveredAt: "13:36" }),
  order({ id: 1036, session: MESA_09_B, customer: "Rocío", at: "13:30", lines: [["toston-palta", 1], ["limonada", 1]], deliveredAt: "13:42" }),
  order({ id: 1037, session: MESA_12, customer: "Simón", at: "13:31", lines: [["cappuccino", 1], ["cafe-latte", 1]], deliveredAt: "13:40" }),
  order({ id: 1038, session: MESA_11, customer: "Hernán", at: "13:32", lines: [["limonada", 1]], deliveredAt: "13:36" }),
  order({ id: 1039, session: MESA_03, customer: "Martina", at: "13:33", lines: [["medialuna", 2], ["cafe-con-leche", 1]], deliveredAt: "13:45" }),
  order({ id: 1040, session: MESA_01_B, customer: "Florencia", at: "13:35", lines: [["cafe-latte", 1], ["tostado-clasico", 2]], deliveredAt: "13:50" }),
  order({ id: 1041, session: MESA_12, customer: "Valentina", at: "13:38", lines: [["cappuccino", 1], ["cappuccino-grande", 1]], deliveredAt: "13:50" }),
  order({ id: 1042, session: MESA_07, customer: "Agustín", at: "13:40", lines: [["cappuccino-grande", 1], ["medialuna", 2]], deliveredAt: "13:58" }),
  order({ id: 1043, session: MESA_08, customer: "Tomás", at: "13:41", lines: [["sandwich-pollo", 1]], deliveredAt: "13:55" }),
  order({ id: 1044, session: MESA_10, customer: "Lucía", at: "13:45", lines: [["cappuccino", 1], ["cappuccino-grande", 1]], deliveredAt: "13:58" }),
  order({ id: 1045, session: MESA_03, customer: "Paz", at: "13:50", lines: [["cafe-con-leche", 1]], deliveredAt: "13:56" }),
  order({ id: 1046, session: MESA_02, customer: "Sofía", at: "13:52", lines: [["jugo-naranja", 1]], deliveredAt: "14:05" }),
  order({
    id: 1047,
    session: MESA_06,
    customer: "Pedro",
    at: "13:56",
    lines: [["sandwich-pollo", 1, { customization: "Sin mayonesa" }]],
    preparingAt: "13:59",
    deliveredAt: "14:12",
  }),
  order({
    id: 1048,
    session: MESA_07,
    customer: "Julieta",
    at: "14:04",
    lines: [["tostado-jamon-queso", 1, { customization: "Sin tomate" }]],
    status: "preparing",
    preparingAt: "14:08",
  }),
  order({ id: 1049, session: MESA_04_B, customer: "Diego", at: "14:06", lines: [["cappuccino-grande", 1], ["medialuna", 1]], deliveredAt: "14:10" }),
  order({
    id: 1050,
    session: MESA_02,
    customer: "Sofía",
    at: "14:24",
    lines: [["toston-palta", 1], ["cafe-latte", 1, { customization: "Leche deslactosada" }]],
    status: "preparing",
    preparingAt: "14:27",
  }),
  order({
    id: 1051,
    session: MESA_03,
    customer: "Martina",
    at: "14:36",
    lines: [
      ["cappuccino-grande", 1, { variant: "Grande · caliente", customization: "Leche deslactosada" }],
      ["medialuna", 2],
    ],
    note: "Sin azúcar.",
    status: "received",
  }),
  order({
    id: 1052,
    session: MESA_08,
    customer: "Tomás",
    at: "14:38",
    lines: [["tostado-clasico", 2], ["limonada", 1, { customization: "Sin hielo" }]],
    status: "received",
  }),
  order({ id: 1053, session: MESA_04_B, customer: "Abril", at: "14:08", lines: [["jugo-naranja", 1]], deliveredAt: "14:11" }),
];

/** 04: Mesa 10, 05 and 07 wait (10A), Mesa 12 and 04 are in attention, Mesa 09 was closed at 12:24. */
const BILL_REQUESTS: ServiceBillRequest[] = [
  { id: "SC-010", sessionId: MESA_10.id, customer: "Lucía", requestedAt: "14:24", paymentPreference: "transfer", status: "pending" },
  { id: "SC-005", sessionId: MESA_05.id, customer: "Joaquín", requestedAt: "14:30", paymentPreference: "table", status: "pending" },
  { id: "SC-007", sessionId: MESA_07.id, customer: "Julieta", requestedAt: "14:35", paymentPreference: "register", status: "pending" },
  {
    id: "SC-012",
    sessionId: MESA_12.id,
    customer: "Valentina",
    requestedAt: "14:37",
    paymentPreference: "transfer",
    status: "attending",
    assignee: "María G.",
  },
  {
    id: "SC-004",
    sessionId: MESA_04_B.id,
    customer: "Diego",
    requestedAt: "14:39",
    paymentPreference: "table",
    status: "attending",
    assignee: "Martín A.",
  },
  {
    id: "SC-009",
    sessionId: MESA_09_A.id,
    customer: "Camila",
    requestedAt: "12:15",
    paymentPreference: "register",
    status: "finalized",
    assignee: "María G.",
  },
];

/** Today's five 05 collections: $100.900, $42.700 by transfer, as in the 05 and 10A tiles. */
const TODAY_COLLECTIONS: ServiceCollection[] = [
  { number: 22, sessionId: MESA_09_A.id, time: "12:24", method: "transfer", customerPreference: "register", confirmedBy: "María G.", adjustments: 0 },
  { number: 23, sessionId: MESA_01_A.id, time: "13:15", method: "cash", customerPreference: "register", confirmedBy: "Lucas", adjustments: 0 },
  { number: 24, sessionId: MESA_04_A.id, time: "13:48", method: "card", customerPreference: "table", confirmedBy: "Mariana", adjustments: 0 },
  { number: 25, sessionId: MESA_01_B.id, time: "14:12", method: "transfer", customerPreference: "transfer", confirmedBy: "Lucas", adjustments: 0 },
  { number: 26, sessionId: MESA_09_B.id, time: "14:35", method: "cash", customerPreference: "register", confirmedBy: "Mariana", adjustments: 0 },
];

type PastSeed = [
  number: number,
  date: string,
  tableNumber: number,
  time: string,
  method: CollectionMethod,
  confirmedBy: string,
  customer: string,
  lines: LineSeed[],
];

const PREFERENCE_BY_METHOD: Record<CollectionMethod, BillPaymentMethod> = {
  cash: "register",
  transfer: "transfer",
  card: "table",
};

/** Single-order accounts of the previous six days, so 05's "Ayer" and "Últimos 7 días" paginate. */
const PAST_SEEDS: PastSeed[] = [
  [21, "2026-10-20", 4, "19:42", "card", "Lucas", "Florencia", [["cappuccino", 2], ["medialuna", 2]]],
  [20, "2026-10-20", 8, "18:05", "transfer", "Lucas", "Ignacio", [["tostado-clasico", 2]]],
  [19, "2026-10-20", 1, "16:30", "cash", "Mariana", "Rocío", [["cafe-latte", 1], ["toston-palta", 1]]],
  [18, "2026-10-20", 6, "14:18", "transfer", "Mariana", "Santiago", [["limonada", 3], ["tostado-clasico", 3]]],
  [17, "2026-10-20", 10, "12:51", "cash", "Lucas", "Julieta", [["cappuccino-grande", 1]]],
  [16, "2026-10-20", 12, "10:22", "card", "Mariana", "Tomás", [["cafe-con-leche", 2], ["medialuna", 4]]],
  [15, "2026-10-19", 3, "18:47", "transfer", "Mariana", "Martina", [["sandwich-pollo", 2]]],
  [14, "2026-10-19", 9, "15:10", "cash", "Lucas", "Bruno", [["cafe-latte", 1], ["medialuna", 2]]],
  [13, "2026-10-19", 2, "11:35", "card", "Mariana", "Carolina", [["toston-palta", 2]]],
  [12, "2026-10-18", 7, "19:02", "transfer", "Lucas", "Federico", [["cappuccino", 4], ["medialuna", 4]]],
  [11, "2026-10-18", 5, "16:44", "cash", "Mariana", "Agustina", [["limonada", 1], ["tostado-clasico", 1]]],
  [10, "2026-10-18", 11, "13:27", "card", "Lucas", "Matías", [["sandwich-pollo", 2], ["limonada", 2]]],
  [9, "2026-10-17", 1, "18:15", "cash", "Mariana", "Lucía", [["cappuccino", 1], ["medialuna", 1]]],
  [8, "2026-10-17", 6, "14:56", "transfer", "Mariana", "Diego", [["tostado-clasico", 3], ["cafe-latte", 3]]],
  [7, "2026-10-17", 10, "12:08", "card", "Lucas", "Valentina", [["cafe-con-leche", 2]]],
  [6, "2026-10-16", 4, "17:39", "transfer", "Lucas", "Pedro", [["toston-palta", 1], ["limonada", 1]]],
  [5, "2026-10-16", 8, "15:21", "cash", "Mariana", "Sofía", [["cappuccino-grande", 2], ["medialuna", 2]]],
  [4, "2026-10-16", 12, "10:50", "card", "Mariana", "Joaquín", [["cafe-latte", 1]]],
  [3, "2026-10-15", 3, "19:12", "cash", "Lucas", "Camila", [["sandwich-pollo", 2], ["limonada", 1]]],
  [2, "2026-10-15", 9, "13:03", "transfer", "Mariana", "Nicolás", [["tostado-clasico", 2], ["cafe-latte", 2]]],
  [1, "2026-10-15", 5, "09:46", "card", "Lucas", "Paula", [["cappuccino", 1], ["medialuna", 2]]],
];

const PAST = PAST_SEEDS.map(([number, date, table, time, method, confirmedBy, customer, lines]) => {
  const pastSession = session(table, 1, addMinutes(time, -45), addMinutes(time, 1), date);
  return {
    session: pastSession,
    order: order({ id: 900 + number, session: pastSession, customer, at: addMinutes(time, -40), lines }),
    collection: {
      number,
      sessionId: pastSession.id,
      time,
      method,
      customerPreference: PREFERENCE_BY_METHOD[method],
      confirmedBy,
      adjustments: 0,
    } satisfies ServiceCollection,
  };
});

export const SERVICE_DAY: ServiceDay = {
  date: DATE,
  now: NOW,
  syncedAt: `${NOW}:18`,
  tableNumbers: VENUE_TABLES.filter((table) => table.enabled).map((table) => table.number),
  spaces: VENUE_SPACES,
  tables: VENUE_TABLES,
  staff: STAFF,
  products: PRODUCTS,
  sessions: [...TODAY_SESSIONS, ...PAST.map((entry) => entry.session)],
  orders: [...TODAY_ORDERS, ...PAST.map((entry) => entry.order)],
  billRequests: BILL_REQUESTS,
  collections: [...TODAY_COLLECTIONS, ...PAST.map((entry) => entry.collection)],
  paymentSettings: PAYMENT_SETTINGS,
};
