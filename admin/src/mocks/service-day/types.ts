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

/** Menu categories of 07 · Productos ("Cafés", "Tostadas", …). */
export type ProductCategoryId =
  | "cafes"
  | "bebidas"
  | "panaderia"
  | "tostadas"
  | "tostados"
  | "sandwiches"
  | "hamburguesas"
  | "postres"
  | "licuados";

/** "Momentos de consumo" of 07B. */
export type ConsumptionMomentId = "desayunar" | "merendar" | "cenar" | "tomar";

/** Whether customers see the product: "Publicado" or "Borrador". */
export type ProductPublication = "published" | "draft";

/** One choice of a "Tamaño" or "Extras" group with its price adjustment in ARS (07B "+$800"). */
export type ProductOption = { id: string; name: string; priceDelta: number };

/** One product of the menu with its current price in ARS. */
export type Product = {
  id: string;
  /** Singular display name, e.g. "Medialuna". */
  name: string;
  /** Display name for quantities above one, when it differs, e.g. "Medialunas". */
  plural?: string;
  /** "Precio base (ARS)". */
  price: number;
  categoryId: ProductCategoryId;
  /** One-line description customers read (07B "Descripción"). */
  description: string;
  /** Public path of the main photo ("Imagen principal"); unset shows a neutral placeholder. */
  image?: string;
  moments: ConsumptionMomentId[];
  publication: ProductPublication;
  /** Availability switch of 07A/07B: whether it can be ordered right now. */
  available: boolean;
  /** Archived products are kept (they have confirmed orders) but leave the menu. */
  archived: boolean;
  /** "Permitir observaciones del cliente". */
  allowCustomerNotes: boolean;
  /** "Tamaño": single choice, required when there are sizes. */
  sizes: ProductOption[];
  /** Size preselected for the customer; set exactly when there are sizes. */
  defaultSizeId?: string;
  /** "Extras": multiple choice, optional. */
  extras: ProductOption[];
};

/**
 * A product category: the 07 taxonomy and an 08C filter of the customer "Explore" screen.
 * Product counts are never stored: they are derived from `Product.categoryId`.
 */
export type ProductCategoryInfo = {
  id: ProductCategoryId;
  label: string;
  /** 08D "Descripción opcional". */
  description: string;
  /** 08D "Imagen opcional"; unset shows the upload area. */
  image?: string;
  /** "Visible en la carta". */
  visible: boolean;
  /** 08C "Orden" (1-based display order of the filters). */
  order: number;
};

/**
 * A consumption moment: the 07B chip and an 08A editorial collection. Its products are the
 * products whose `Product.moments` include it (never a stored count); `categoryIds` are the
 * filters it offers ("Las categorías no agregan productos automáticamente").
 */
export type ConsumptionMomentInfo = {
  id: ConsumptionMomentId;
  /** Short chip label of 07 ("Desayunar"). */
  label: string;
  /** 08A card and customer title ("Para desayunar"). */
  title: string;
  /** 08B "Descripción breve". */
  description: string;
  /** 08B "Fotografía de portada"; unset shows a placeholder. */
  image?: string;
  /** "Visible en la carta". */
  visible: boolean;
  /** 08A "Orden" (1-based). */
  order: number;
  /** 08B "Categorías asociadas"; shown in the categories' display order. */
  categoryIds: ProductCategoryId[];
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
