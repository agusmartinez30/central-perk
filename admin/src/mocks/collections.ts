import type {
  BillPaymentMethod,
  CollectionMethod,
  CollectionOrder,
  CollectionsHistory,
  ManagedCollection,
  OrderLine,
} from "./types";

/** "HH:MM" one minute later; the table session closes right after the payment. */
function nextMinute(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + 1;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

type CollectionSeed = {
  number: number;
  date: string;
  tableNumber: number;
  time: string;
  method: CollectionMethod;
  customerPreference: BillPaymentMethod;
  confirmedBy: string;
  orders: CollectionOrder[];
};

/** "COB-0026" / "CTA-026", with the amount settled from the orders and the standard audit trail. */
function closedAccount({ number, orders, time, ...seed }: CollectionSeed): ManagedCollection {
  return {
    ...seed,
    id: `COB-${String(number).padStart(4, "0")}`,
    accountId: `CTA-${String(number).padStart(3, "0")}`,
    time,
    amount: orders.reduce((sum, order) => sum + order.total, 0),
    adjustments: 0,
    status: "confirmed",
    orders,
    audit: [
      { kind: "payment-confirmed", at: time },
      { kind: "balance-updated", at: time },
      { kind: "table-session-closed", at: nextMinute(time) },
    ],
  };
}

const order = (id: number, customer: string, items: OrderLine[], total: number): CollectionOrder => ({
  id,
  customer,
  items,
  total,
});

const line = (quantity: number, name: string): OrderLine => ({ quantity, name });

const TODAY = "2026-10-21";

/**
 * Today's five collections of the 05 export ("Mostrando 1–5", "Hoy"), newest first.
 *
 * - Totals match the 10A financial summary ($100.900, 5 accounts, $20.180 average), but 10A's
 *   individual payments and times differ ($14.300 12:24, $19.800 13:05, ...); 05 wins here.
 * - The export labels every row "Efectivo" (copy-paste leftover) while the "Transferencias"
 *   tile reads $42.700, so Mesa 03 ($28.400) and Mesa 11 ($14.300) are transfers; Mesa 05 paid by
 *   card ("En mesa" preference) and Mesa 02 in cash are illustrative.
 * - Mesa 07 and Mesa 05 close the pending 04 requests (same totals, preferences and order count);
 *   Mesa 07 holds order #1048 of 03 (the drawer shortens its product to "Tostado").
 * - 04's finalized Mesa 09 ($14.300, María G., 12:15) has no 05 row: the 05 export wins and lists
 *   $14.300 for Mesa 11 at 12:40.
 * - Orders and customers other than Mesa 07's are illustrative.
 */
const TODAY_COLLECTIONS: ManagedCollection[] = [
  closedAccount({
    number: 26,
    date: TODAY,
    tableNumber: 7,
    time: "14:35",
    method: "cash",
    customerPreference: "register",
    confirmedBy: "Mariana",
    orders: [
      order(1042, "Agustín", [line(1, "Cappuccino"), line(2, "Medialunas")], 13000),
      order(1048, "Lucía", [line(1, "Tostado")], 6900),
    ],
  }),
  closedAccount({
    number: 25,
    date: TODAY,
    tableNumber: 3,
    time: "14:12",
    method: "transfer",
    customerPreference: "transfer",
    confirmedBy: "Lucas",
    orders: [
      order(1036, "Valentina", [line(2, "Tostados clásicos"), line(1, "Limonada")], 18000),
      order(1039, "Nicolás", [line(2, "Café latte"), line(1, "Tostón de palta")], 10400),
    ],
  }),
  closedAccount({
    number: 24,
    date: TODAY,
    tableNumber: 5,
    time: "13:48",
    method: "card",
    customerPreference: "table",
    confirmedBy: "Mariana",
    orders: [
      order(1033, "Joaquín", [line(2, "Cappuccino"), line(1, "Medialuna")], 9500),
      order(1037, "Joaquín", [line(1, "Tostado clásico")], 7200),
      order(1040, "Paula", [line(1, "Limonada"), line(1, "Medialuna")], 4800),
    ],
  }),
  closedAccount({
    number: 23,
    date: TODAY,
    tableNumber: 2,
    time: "13:15",
    method: "cash",
    customerPreference: "register",
    confirmedBy: "Lucas",
    orders: [
      order(1030, "Gabriel", [line(2, "Café con leche"), line(2, "Medialunas")], 9600),
      order(1034, "Gabriel", [line(1, "Tostado clásico")], 7200),
    ],
  }),
  closedAccount({
    number: 22,
    date: TODAY,
    tableNumber: 11,
    time: "12:40",
    method: "transfer",
    customerPreference: "transfer",
    confirmedBy: "Mariana",
    orders: [
      order(1028, "Camila", [line(1, "Tostón de palta"), line(1, "Medialuna")], 10100),
      order(1031, "Camila", [line(1, "Café latte")], 4200),
    ],
  }),
];

type PastSeed = [
  number: number,
  date: string,
  tableNumber: number,
  time: string,
  method: CollectionMethod,
  confirmedBy: string,
  customer: string,
  items: OrderLine[],
  total: number,
];

const PREFERENCE_BY_METHOD: Record<CollectionMethod, BillPaymentMethod> = {
  cash: "register",
  transfer: "transfer",
  card: "table",
};

/** Illustrative single-order accounts of the previous six days, so "Ayer" and "Últimos 7 días" paginate. */
const PAST_SEEDS: PastSeed[] = [
  [21, "2026-10-20", 4, "19:42", "card", "Lucas", "Florencia", [line(2, "Cappuccino"), line(2, "Medialunas")], 15400],
  [20, "2026-10-20", 8, "18:05", "transfer", "Lucas", "Ignacio", [line(2, "Tostados clásicos")], 14400],
  [19, "2026-10-20", 1, "16:30", "cash", "Mariana", "Rocío", [line(1, "Café latte"), line(1, "Tostón de palta")], 11700],
  [18, "2026-10-20", 6, "14:18", "transfer", "Mariana", "Santiago", [line(3, "Limonada"), line(3, "Tostados clásicos")], 32400],
  [17, "2026-10-20", 10, "12:51", "cash", "Lucas", "Julieta", [line(1, "Cappuccino grande")], 5200],
  [16, "2026-10-20", 12, "10:22", "card", "Mariana", "Tomás", [line(2, "Café con leche"), line(4, "Medialunas")], 17400],
  [15, "2026-10-19", 3, "18:47", "transfer", "Mariana", "Martina", [line(2, "Sándwich de pollo")], 17800],
  [14, "2026-10-19", 9, "15:10", "cash", "Lucas", "Bruno", [line(1, "Café latte"), line(2, "Medialunas")], 8100],
  [13, "2026-10-19", 2, "11:35", "card", "Mariana", "Carolina", [line(2, "Tostón de palta")], 15000],
  [12, "2026-10-18", 7, "19:02", "transfer", "Lucas", "Federico", [line(4, "Cappuccino"), line(4, "Medialunas")], 31200],
  [11, "2026-10-18", 5, "16:44", "cash", "Mariana", "Agustina", [line(1, "Limonada"), line(1, "Tostado clásico")], 10800],
  [10, "2026-10-18", 11, "13:27", "card", "Lucas", "Matías", [line(2, "Sándwich de pollo"), line(2, "Limonada")], 25000],
  [9, "2026-10-17", 1, "18:15", "cash", "Mariana", "Lucía", [line(1, "Cappuccino"), line(1, "Medialuna")], 6400],
  [8, "2026-10-17", 6, "14:56", "transfer", "Mariana", "Diego", [line(3, "Tostados clásicos"), line(3, "Café latte")], 34200],
  [7, "2026-10-17", 10, "12:08", "card", "Lucas", "Valentina", [line(2, "Café con leche")], 7600],
  [6, "2026-10-16", 4, "17:39", "transfer", "Lucas", "Pedro", [line(1, "Tostón de palta"), line(1, "Limonada")], 11100],
  [5, "2026-10-16", 8, "15:21", "cash", "Mariana", "Sofía", [line(2, "Cappuccino grande"), line(2, "Medialunas")], 18200],
  [4, "2026-10-16", 12, "10:50", "card", "Mariana", "Joaquín", [line(1, "Café latte")], 4200],
  [3, "2026-10-15", 3, "19:12", "cash", "Lucas", "Camila", [line(2, "Sándwich de pollo"), line(1, "Limonada")], 21400],
  [2, "2026-10-15", 9, "13:03", "transfer", "Mariana", "Nicolás", [line(2, "Tostados clásicos"), line(2, "Café latte")], 22800],
  [1, "2026-10-15", 5, "09:46", "card", "Lucas", "Paula", [line(1, "Cappuccino"), line(2, "Medialunas")], 13000],
];

const PAST_COLLECTIONS: ManagedCollection[] = PAST_SEEDS.map(
  ([number, date, tableNumber, time, method, confirmedBy, customer, items, total]) =>
    closedAccount({
      number,
      date,
      tableNumber,
      time,
      method,
      customerPreference: PREFERENCE_BY_METHOD[method],
      confirmedBy,
      orders: [order(1000 + number, customer, items, total)],
    }),
);

/** 05 · Historial de cobros on 21/10/2026, with COB-0026 (Mesa 07) open in "Cobro seleccionado". */
export const COLLECTIONS_HISTORY: CollectionsHistory = {
  today: TODAY,
  collections: [...TODAY_COLLECTIONS, ...PAST_COLLECTIONS],
  selectedId: "COB-0026",
};
