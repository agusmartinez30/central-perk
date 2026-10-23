export type StaffMember = {
  id: string;
  /** Short display name, e.g. "Sofía M.". */
  name: string;
  /** Role label in Spanish, e.g. "Administradora". */
  role: string;
  email: string;
};

export type OrderLine = {
  quantity: number;
  name: string;
};

export type OrderStatus = "received" | "preparing" | "delivered";

/** Live order shown in "Pedidos que requieren atención". */
export type AttentionOrder = {
  id: number;
  /** Two-digit table label, e.g. "03". */
  table: string;
  customer: string;
  items: OrderLine[];
  note?: string;
  status: OrderStatus;
  waitMinutes: number;
};

export type BillPaymentMethod = "transfer" | "table" | "register";

export type BillRequest = {
  table: string;
  paymentMethod: BillPaymentMethod;
  total: number;
  waitMinutes: number;
  /** Kitchen orders of the table that are still in preparation. */
  ordersInPreparation: number;
};

export type TableStatus = "free" | "occupied" | "bill-requested";

export type TableSnapshot = {
  number: number;
  status: TableStatus;
  /** True when the table has an order in preparation. */
  preparing: boolean;
};

/** A confirmed payment; `closedAt` is a local "HH:MM" time. */
export type ConfirmedPayment = {
  id: string;
  amount: number;
  closedAt: string;
};

export type BestSeller = {
  name: string;
  quantity: number;
};

export type OverviewPeriod = "today" | "yesterday" | "last-7-days" | "custom";

export type OverviewSnapshot = {
  /** "HH:MM:SS" of the last data sync. */
  lastSync: string;
  orders: AttentionOrder[];
  billRequests: BillRequest[];
  tables: TableSnapshot[];
  payments: ConfirmedPayment[];
  confirmedOrders: number;
  bestSellers: BestSeller[];
};
