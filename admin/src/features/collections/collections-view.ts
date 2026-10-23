import type {
  BillPaymentMethod,
  CollectionAuditKind,
  CollectionMethod,
  CollectionOrder,
  CollectionStatus,
  ManagedCollection,
} from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";

export type CollectionPeriod = "today" | "yesterday" | "last-7-days";

/** "Quick Date Filters"; "Hoy" is the default. */
export const PERIOD_FILTERS: readonly { id: CollectionPeriod; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "yesterday", label: "Ayer" },
  { id: "last-7-days", label: "Últimos 7 días" },
];

/** Inclusive ISO "YYYY-MM-DD" range. */
export type DateRange = { from: string; to: string };

function shiftDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Dates covered by a quick date filter, relative to `today`. */
export function getPeriodRange(period: CollectionPeriod, today: string): DateRange {
  switch (period) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const yesterday = shiftDate(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case "last-7-days":
      return { from: shiftDate(today, -6), to: today };
  }
}

/** "2026-10-21" → "21/10/2026". */
function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/** "Custom Date Range" label: "21/10/2026 — 21/10/2026". */
export function formatDateRange({ from, to }: DateRange): string {
  return `${formatIsoDate(from)} — ${formatIsoDate(to)}`;
}

export function formatCollectionDate(collection: Pick<ManagedCollection, "date">): string {
  return formatIsoDate(collection.date);
}

/** "21/10/2026 · 14:35". */
export function formatCollectionDateTime(collection: Pick<ManagedCollection, "date" | "time">): string {
  return `${formatIsoDate(collection.date)} · ${collection.time}`;
}

/** "Mesa 07". */
export function formatTableLabel(collection: Pick<ManagedCollection, "tableNumber">): string {
  return `Mesa ${String(collection.tableNumber).padStart(2, "0")}`;
}

const METHOD_LABELS: Record<CollectionMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
};

export function getMethodLabel(method: CollectionMethod): string {
  return METHOD_LABELS[method];
}

/** Same wording as the 04 payment preference chips. */
const PREFERENCE_LABELS: Record<BillPaymentMethod, string> = {
  table: "En mesa",
  register: "En caja",
  transfer: "Transferencia",
};

export function getPreferenceLabel(preference: BillPaymentMethod): string {
  return PREFERENCE_LABELS[preference];
}

export type CollectionTone = "success";

const STATUS_BADGES: Record<CollectionStatus, { label: string; tone: CollectionTone }> = {
  confirmed: { label: "Confirmado", tone: "success" },
};

/** "Row Payment Status" / "Drawer Payment Status" pill. */
export function getStatusBadge(status: CollectionStatus): { label: string; tone: CollectionTone } {
  return STATUS_BADGES[status];
}

export type CollectionMetric = {
  id: "total" | "accounts" | "average" | "transfers";
  label: string;
  value: string;
};

export function getTotalsByMethod(collections: readonly ManagedCollection[]): Record<CollectionMethod, number> {
  const totals: Record<CollectionMethod, number> = { cash: 0, transfer: 0, card: 0 };
  for (const collection of collections) totals[collection.method] += collection.amount;
  return totals;
}

/** "Payment Metrics": collected total, closed accounts, average ticket and transfers. */
export function getCollectionMetrics(collections: readonly ManagedCollection[]): CollectionMetric[] {
  const total = collections.reduce((sum, collection) => sum + collection.amount, 0);
  const accounts = collections.length;
  return [
    { id: "total", label: "Total cobrado", value: formatPrice(total) },
    { id: "accounts", label: "Cuentas cerradas", value: String(accounts) },
    { id: "average", label: "Ticket promedio", value: formatPrice(accounts > 0 ? total / accounts : 0) },
    { id: "transfers", label: "Transferencias", value: formatPrice(getTotalsByMethod(collections).transfer) },
  ];
}

export type MethodFilter = "all" | CollectionMethod;
/** A staff name, or "all". */
export type StaffFilter = string;
export type CollectionSort = "recent" | "oldest" | "highest-amount";

/** "Todos los medios" select. */
export const METHOD_FILTERS: readonly { id: MethodFilter; label: string }[] = [
  { id: "all", label: "Todos los medios" },
  { id: "cash", label: "Efectivo" },
  { id: "transfer", label: "Transferencia" },
  { id: "card", label: "Tarjeta" },
];

/** "Más recientes" select; the export only shows the default, the other two are ours. */
export const SORT_OPTIONS: readonly { id: CollectionSort; label: string }[] = [
  { id: "recent", label: "Más recientes" },
  { id: "oldest", label: "Más antiguos" },
  { id: "highest-amount", label: "Mayor importe" },
];

/** "Todo el personal" select: every staff member who confirmed a loaded collection. */
export function getStaffOptions(collections: readonly ManagedCollection[]): { id: StaffFilter; label: string }[] {
  const names = [...new Set(collections.map((collection) => collection.confirmedBy))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  return [{ id: "all", label: "Todo el personal" }, ...names.map((name) => ({ id: name, label: name }))];
}

export type CollectionQuery = {
  range: DateRange;
  method: MethodFilter;
  staff: StaffFilter;
  query: string;
};

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/#/g, "")
    .toLowerCase()
    .trim();
}

const codeNumber = (code: string) => Number(code.replace(/\D/g, ""));

function matchesQuery(collection: ManagedCollection, query: string): boolean {
  const needle = normalize(query);
  if (!needle) return true;
  const number = needle.match(/^(?:mesa\s*)?(\d+)$/);
  if (number) {
    const value = Number(number[1]);
    if (value === collection.tableNumber) return true;
    // A bare number also finds its operation and account ("26" → COB-0026 / CTA-026).
    if (!needle.startsWith("mesa") && value === codeNumber(collection.id)) return true;
    return false;
  }
  return [formatTableLabel(collection), collection.accountId, collection.id].some((text) =>
    normalize(text).includes(needle),
  );
}

export function isInRange(collection: Pick<ManagedCollection, "date">, { from, to }: DateRange): boolean {
  return collection.date >= from && collection.date <= to;
}

/** Period, "Todos los medios", "Todo el personal" and "Buscar mesa, cuenta u operación...". */
export function filterCollections(
  collections: readonly ManagedCollection[],
  { range, method, staff, query }: CollectionQuery,
): ManagedCollection[] {
  return collections.filter(
    (collection) =>
      isInRange(collection, range) &&
      (method === "all" || collection.method === method) &&
      (staff === "all" || collection.confirmedBy === staff) &&
      matchesQuery(collection, query),
  );
}

const closedAtKey = (collection: ManagedCollection) => `${collection.date} ${collection.time}`;

/** Returns a new array; ties keep the most recent first. */
export function sortCollections(collections: readonly ManagedCollection[], sort: CollectionSort): ManagedCollection[] {
  const byRecent = (a: ManagedCollection, b: ManagedCollection) => closedAtKey(b).localeCompare(closedAtKey(a));
  return [...collections].sort((a, b) => {
    if (sort === "oldest") return -byRecent(a, b);
    if (sort === "highest-amount") return b.amount - a.amount || byRecent(a, b);
    return byRecent(a, b);
  });
}

/** Rows per page of "Payment History Data Table" ("Mostrando 1–5"). */
export const PAGE_SIZE = 5;

export type Page<T> = {
  items: T[];
  /** Current page, clamped to the available pages (1-based). */
  page: number;
  pageCount: number;
  /** 1-based position of the first and last row shown; 0 when empty. */
  from: number;
  to: number;
  total: number;
};

export function paginate<T>(items: readonly T[], page: number, size: number = PAGE_SIZE): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * size;
  const slice = items.slice(start, start + size);
  return {
    items: slice,
    page: current,
    pageCount,
    from: slice.length > 0 ? start + 1 : 0,
    to: start + slice.length,
    total,
  };
}

export type PageItem = number | "ellipsis";

/** "Server Pagination" buttons: first, last, the current page and its neighbours, with gaps as "…". */
export function getPageItems(current: number, pageCount: number): PageItem[] {
  const pages = new Set([1, pageCount, current - 1, current, current + 1]);
  if (current <= 2) [2, 3].forEach((page) => pages.add(page));
  if (current >= pageCount - 1) [pageCount - 1, pageCount - 2].forEach((page) => pages.add(page));
  const sorted = [...pages].filter((page) => page >= 1 && page <= pageCount).sort((a, b) => a - b);
  const items: PageItem[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push("ellipsis");
    items.push(page);
  });
  return items;
}

/** "History Result Count": "Mostrando 1–5 de 128 operaciones". */
export function formatResultCount({ from, to, total }: Pick<Page<unknown>, "from" | "to" | "total">): string {
  if (total === 0) return "Sin operaciones para mostrar";
  return `Mostrando ${from}–${to} de ${total} ${total === 1 ? "operación" : "operaciones"}`;
}

export type DetailRow = { label: string; value: string };

/** "Payment Facts" of the selected collection drawer. */
export function getCollectionFacts(collection: ManagedCollection): DetailRow[] {
  return [
    { label: "Cierre de sesión", value: formatCollectionDateTime(collection) },
    { label: "Importe confirmado", value: formatPrice(collection.amount) },
    { label: "Medio real", value: getMethodLabel(collection.method) },
    { label: "Preferencia cliente", value: getPreferenceLabel(collection.customerPreference) },
    { label: "Confirmado por", value: collection.confirmedBy },
  ];
}

/** "Pedido #1042 · Agustín". */
export function formatOrderTitle(order: Pick<CollectionOrder, "id" | "customer">): string {
  return `Pedido #${order.id} · ${order.customer}`;
}

/** "1 Cappuccino · 2 Medialunas". */
export function formatOrderProducts(order: Pick<CollectionOrder, "items">): string {
  return order.items.map((item) => `${item.quantity} ${item.name}`).join(" · ");
}

export function getCollectionSubtotal(collection: Pick<ManagedCollection, "orders">): number {
  return collection.orders.reduce((sum, order) => sum + order.total, 0);
}

/** "Account Totals": subtotal, discounts and adjustments, final total. */
export function getAccountTotals(collection: ManagedCollection): DetailRow[] {
  return [
    { label: "Subtotal", value: formatPrice(getCollectionSubtotal(collection)) },
    { label: "Descuentos y ajustes", value: formatPrice(collection.adjustments) },
    { label: "Total final", value: formatPrice(collection.amount) },
  ];
}

function getAuditLabel(kind: CollectionAuditKind, collection: ManagedCollection): string {
  switch (kind) {
    case "payment-confirmed":
      return `Pago confirmado · ${collection.confirmedBy}`;
    case "balance-updated":
      return "Saldo actualizado a $0";
    case "table-session-closed":
      return "Sesión de mesa cerrada";
  }
}

/** "Drawer Audit Timeline" entries. */
export function getAuditEvents(collection: ManagedCollection): { label: string; at: string }[] {
  return collection.audit.map((event) => ({
    label: getAuditLabel(event.kind, collection),
    at: formatCollectionDateTime({ date: collection.date, time: event.at }),
  }));
}
