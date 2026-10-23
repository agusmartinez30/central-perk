import type { OverviewSnapshot } from "./types";

/** Live service snapshot reproducing the 10A · Resumen general export. */
export const OVERVIEW_SNAPSHOT: OverviewSnapshot = {
  lastSync: "14:32:08",
  orders: [
    {
      id: 1051,
      table: "03",
      customer: "Martina",
      items: [
        { quantity: 1, name: "Cappuccino grande" },
        { quantity: 2, name: "Medialunas" },
      ],
      note: "Leche deslactosada",
      status: "received",
      waitMinutes: 6,
    },
    {
      id: 1052,
      table: "08",
      customer: "Tomás",
      items: [
        { quantity: 2, name: "Tostados clásicos" },
        { quantity: 1, name: "Limonada" },
      ],
      note: "Sin hielo",
      status: "received",
      waitMinutes: 4,
    },
  ],
  billRequests: [
    { table: "10", paymentMethod: "transfer", total: 31200, waitMinutes: 18, ordersInPreparation: 0 },
    { table: "05", paymentMethod: "table", total: 21500, waitMinutes: 12, ordersInPreparation: 0 },
    { table: "07", paymentMethod: "register", total: 19900, waitMinutes: 7, ordersInPreparation: 1 },
  ],
  tables: [
    { number: 1, status: "free", preparing: false },
    { number: 2, status: "occupied", preparing: false },
    { number: 3, status: "occupied", preparing: false },
    { number: 4, status: "free", preparing: false },
    { number: 5, status: "bill-requested", preparing: false },
    { number: 6, status: "occupied", preparing: false },
    { number: 7, status: "bill-requested", preparing: true },
    { number: 8, status: "occupied", preparing: false },
    { number: 9, status: "free", preparing: false },
    { number: 10, status: "bill-requested", preparing: false },
    { number: 11, status: "occupied", preparing: true },
    { number: 12, status: "free", preparing: false },
  ],
  payments: [
    { id: "pay-01", amount: 14300, closedAt: "12:24" },
    { id: "pay-02", amount: 19800, closedAt: "13:05" },
    { id: "pay-03", amount: 18500, closedAt: "13:48" },
    { id: "pay-04", amount: 26800, closedAt: "14:12" },
    { id: "pay-05", amount: 21500, closedAt: "14:29" },
  ],
  confirmedOrders: 12,
  bestSellers: [
    { name: "Cappuccino", quantity: 48 },
    { name: "Medialunas", quantity: 42 },
    { name: "Tostado clásico", quantity: 28 },
    { name: "Limonada", quantity: 24 },
    { name: "Tostón de palta", quantity: 19 },
  ],
};
