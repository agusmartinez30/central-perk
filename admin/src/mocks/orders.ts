import type { ManagedOrder, OrderHistoryEvent, OrdersBoard } from "./types";

/** "Pedido confirmado" and "Recibido en cocina" happen together when the customer confirms. */
const confirmedAt = (at: string): OrderHistoryEvent[] => [
  { kind: "confirmed", at },
  { kind: "received", at },
];

/**
 * The five orders of 03 · Gestión de pedidos. #1051 and #1052 are the 10A attention orders
 * (same tables, customers and products); every table is seated in the 02 tables board.
 * Unit prices, variants and the customizations of #1048 and #1047 are illustrative: the
 * export repeats "Leche deslactosada" on every card and only prices the first line of #1051.
 */
const ORDERS: ManagedOrder[] = [
  {
    id: 1051,
    tableNumber: 3,
    customer: "Martina",
    receivedAt: "12:42",
    items: [
      {
        id: "1051-1",
        quantity: 1,
        name: "Cappuccino grande",
        variant: "Grande · caliente",
        unitPrice: 5200,
        customization: "Leche deslactosada",
      },
      { id: "1051-2", quantity: 2, name: "Medialunas", unitPrice: 3900 },
    ],
    note: "Sin azúcar.",
    status: "received",
    history: confirmedAt("12:42"),
  },
  {
    id: 1052,
    tableNumber: 8,
    customer: "Tomás",
    receivedAt: "12:44",
    items: [
      { id: "1052-1", quantity: 2, name: "Tostados clásicos", unitPrice: 7200 },
      { id: "1052-2", quantity: 1, name: "Limonada", unitPrice: 3600, customization: "Sin hielo" },
    ],
    status: "received",
    history: confirmedAt("12:44"),
  },
  {
    id: 1050,
    tableNumber: 2,
    customer: "Sofía",
    receivedAt: "12:30",
    items: [
      { id: "1050-1", quantity: 1, name: "Tostón palta", unitPrice: 7500 },
      { id: "1050-2", quantity: 1, name: "Café latte", unitPrice: 4200, customization: "Leche deslactosada" },
    ],
    status: "preparing",
    history: [...confirmedAt("12:30"), { kind: "preparing", at: "12:33" }],
  },
  {
    id: 1048,
    tableNumber: 7,
    customer: "Lucía",
    receivedAt: "12:10",
    items: [
      { id: "1048-1", quantity: 1, name: "Tostado de jamón y queso", unitPrice: 6900, customization: "Sin tomate" },
    ],
    status: "preparing",
    history: [...confirmedAt("12:10"), { kind: "preparing", at: "12:14" }],
  },
  {
    id: 1047,
    tableNumber: 6,
    customer: "Pedro",
    receivedAt: "12:02",
    items: [
      { id: "1047-1", quantity: 1, name: "Sándwich de pollo", unitPrice: 8900, customization: "Sin mayonesa" },
    ],
    status: "delivered",
    history: [
      ...confirmedAt("12:02"),
      { kind: "preparing", at: "12:05" },
      { kind: "delivered", at: "12:18" },
    ],
  },
];

/** Live kitchen board of 03 in the column order of the export. */
export const ORDERS_BOARD: OrdersBoard = { orders: ORDERS };
