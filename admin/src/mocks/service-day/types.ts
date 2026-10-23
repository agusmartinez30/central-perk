import type {
  AcceptedPaymentMethod,
  BillPaymentMethod,
  BillRequestStatus,
  CollectionMethod,
  ManagedOrder,
  ManagedOrderItem,
  SavedPaymentSettings,
  StaffMember,
} from "../types";

/** One product of the menu with its current price in ARS. */
export type Product = {
  id: string;
  /** Singular display name, e.g. "Medialuna". */
  name: string;
  /** Display name for quantities above one, when it differs, e.g. "Medialunas". */
  plural?: string;
  price: number;
};

/** Seated period of a table: from the first customer to the payment that frees it. */
export type TableSession = {
  /** e.g. "S-2026-10-21-05-1". */
  id: string;
  tableNumber: number;
  /** ISO "YYYY-MM-DD". */
  date: string;
  /** Local "HH:MM". */
  openedAt: string;
  /** Local "HH:MM"; unset while the table is still seated. */
  closedAt?: string;
};

export type ServiceOrderItem = ManagedOrderItem & { productId: string };

/** A confirmed order, with its items priced from the catalogue. */
export type ServiceOrder = Omit<ManagedOrder, "items"> & {
  sessionId: string;
  items: ServiceOrderItem[];
};

/** "Solicitar cuenta" of a table session. */
export type ServiceBillRequest = {
  /** e.g. "SC-010". */
  id: string;
  sessionId: string;
  /** Customer who asked for the bill. */
  customer: string;
  /** Local "HH:MM". */
  requestedAt: string;
  paymentPreference: BillPaymentMethod;
  status: BillRequestStatus;
  /** Staff member attending the request; unset while pending. */
  assignee?: string;
};

/** The payment that closed a table session. Its amount is derived from the session's orders. */
export type ServiceCollection = {
  /** Operation number: 26 → "COB-0026" / "CTA-026". */
  number: number;
  sessionId: string;
  /** Local "HH:MM" the payment was confirmed. */
  time: string;
  method: CollectionMethod;
  /** Request mode the customers chose; equals the bill request's when there was one. */
  customerPreference: BillPaymentMethod;
  confirmedBy: string;
  /** "Descuentos y ajustes" in ARS; negative for discounts. */
  adjustments: number;
};

export type PaymentMethodInfo = { id: AcceptedPaymentMethod; label: string };

export type RequestModeInfo = {
  id: BillPaymentMethod;
  /** Name of the mode in 06 · Configuración de pagos. */
  label: string;
  /** Short chip label the live screens (02, 04, 05, 10A) use. */
  shortLabel: string;
};

/** The single source of truth every admin screen derives from. */
export type ServiceDay = {
  /** ISO "YYYY-MM-DD" of the service ("Hoy"). */
  date: string;
  /** Local "HH:MM" the live screens are looking at. */
  now: string;
  /** "HH:MM:SS" of the last realtime sync. */
  syncedAt: string;
  /** Enabled tables of the venue. */
  tableNumbers: number[];
  staff: StaffMember[];
  products: Product[];
  sessions: TableSession[];
  orders: ServiceOrder[];
  billRequests: ServiceBillRequest[];
  collections: ServiceCollection[];
  paymentSettings: SavedPaymentSettings;
};
