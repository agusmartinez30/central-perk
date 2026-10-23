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

/** Kitchen stage of an order in 03 · Gestión de pedidos; cancelled orders leave the board. */
export type ManagedOrderStatus = "received" | "preparing" | "delivered" | "cancelled";

/** Entries of the drawer's "Historial de estado". */
export type OrderHistoryKind = "confirmed" | ManagedOrderStatus;

export type OrderHistoryEvent = {
  kind: OrderHistoryKind;
  /** Local "HH:MM" time. */
  at: string;
};

export type CancellationReason = "product-unavailable" | "customer-request" | "order-error";

export type ManagedOrderItem = {
  id: string;
  quantity: number;
  name: string;
  /** Size or temperature line under the product name, e.g. "Grande · caliente". */
  variant?: string;
  /** Unit price in ARS. */
  unitPrice: number;
  /** Product customization requested by the customer, e.g. "Leche deslactosada". */
  customization?: string;
};

export type ManagedOrder = {
  /** Order number shown as "Pedido #1051". */
  id: number;
  tableNumber: number;
  customer: string;
  /** Local "HH:MM" time the order was confirmed. */
  receivedAt: string;
  items: ManagedOrderItem[];
  /** Free-text "Nota del cliente" for the whole order. */
  note?: string;
  status: ManagedOrderStatus;
  history: OrderHistoryEvent[];
  cancellationReason?: CancellationReason;
};

export type OrdersBoard = {
  orders: ManagedOrder[];
};

/** Stage of a bill request in 04 · Solicitudes de cuenta; finalized requests are paid and closed. */
export type BillRequestStatus = "pending" | "attending" | "finalized";

export type ManagedBillRequest = {
  /** Request code shown as "#SC-010". */
  id: string;
  tableNumber: number;
  /** Customer who asked for the bill. */
  customer: string;
  /** Local "HH:MM" time the bill was requested. */
  requestedAt: string;
  /** Minutes since the bill was requested. */
  waitMinutes: number;
  paymentPreference: BillPaymentMethod;
  /** Shared account total in ARS. */
  total: number;
  /** Orders confirmed for the table's shared account. */
  confirmedOrders: number;
  /** Confirmed orders the kitchen has not finished yet. */
  ordersInPreparation: number;
  status: BillRequestStatus;
  /** Staff member attending the request ("Responsable"); unset while pending. */
  assignee?: string;
};

export type BillRequestsBoard = {
  requests: ManagedBillRequest[];
  /** Request open in the quick-detail drawer of the "Solicitud seleccionada" export. */
  selectedId: string;
};
