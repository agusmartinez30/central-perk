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

/** Service state of a table in 02 · Gestión de mesas. */
export type TableServiceStatus = "available" | "occupied" | "bill-requested";

export type ManagedTable = {
  id: string;
  number: number;
  status: TableServiceStatus;
  /** Orders confirmed for the table's shared account. */
  confirmedOrders: number;
  /** Confirmed orders the kitchen has not finished yet. */
  pendingKitchenOrders: number;
  /** Shared account total in ARS; 0 for available tables. */
  accountTotal: number;
  /** How the customers want to pay; only set once the bill was requested. */
  paymentPreference?: BillPaymentMethod;
  /** Minutes since the bill was requested; only set once the bill was requested. */
  billRequestedMinutesAgo?: number;
};

export type TablesBoard = {
  /** "HH:MM:SS" of the last realtime update. */
  syncedAt: string;
  tables: ManagedTable[];
  /** Table open in the quick-detail panel when the screen loads. */
  selectedTableId: string | null;
};
