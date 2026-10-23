import type {
  AttentionOrder,
  BestSeller,
  BillRequest,
  ConfirmedPayment,
  OrderLine,
  OverviewSnapshot,
  TableSnapshot,
} from "@/mocks/types";
import { getRequestModeShortLabel } from "@/mocks/service-day/catalog";
import { formatPrice } from "@/shared/lib/format-price";

/** Pure aggregation and formatting for 10A · Resumen general. */

export type SignalTone = "brand" | "success" | "warning" | "danger";

export type Kpi = {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  tone: SignalTone;
};

export type TablesSummary = {
  enabled: number;
  free: number;
  /** Seated tables, including those that already asked for the bill. */
  occupied: number;
  withBill: number;
  preparing: number;
};

export function summarizeTables(tables: readonly TableSnapshot[]): TablesSummary {
  const free = tables.filter((table) => table.status === "free").length;
  return {
    enabled: tables.length,
    free,
    occupied: tables.length - free,
    withBill: tables.filter((table) => table.status === "bill-requested").length,
    preparing: tables.filter((table) => table.preparing).length,
  };
}

export function formatTablesSummary(summary: TablesSummary): string {
  return [
    `${summary.enabled} habilitadas`,
    `${summary.free} libres`,
    `${summary.occupied} ocupadas`,
    `${summary.withBill} con cuenta`,
    `${summary.preparing} preparando`,
  ].join(" · ");
}

export type SalesBar = {
  /** Hour slot label, e.g. "13:00". */
  hour: string;
  total: number;
  /** Height relative to the busiest slot (0–1). */
  ratio: number;
};

export function groupSalesByHour(payments: readonly ConfirmedPayment[]): SalesBar[] {
  const totals = new Map<string, number>();
  for (const payment of payments) {
    const hour = `${payment.closedAt.slice(0, 2)}:00`;
    totals.set(hour, (totals.get(hour) ?? 0) + payment.amount);
  }
  const max = Math.max(0, ...totals.values());
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, total]) => ({ hour, total, ratio: max > 0 ? total / max : 0 }));
}

export type FinancialSummary = {
  total: number;
  closedBills: number;
  averageTicket: number;
  confirmedOrders: number;
};

export function getFinancialSummary(
  payments: readonly ConfirmedPayment[],
  confirmedOrders: number,
): FinancialSummary {
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const closedBills = payments.length;
  return {
    total,
    closedBills,
    averageTicket: closedBills > 0 ? Math.round(total / closedBills) : 0,
    confirmedOrders,
  };
}

export function formatOrderIdentity(order: AttentionOrder): string {
  return `#${order.id} · Mesa ${order.table} · ${order.customer}`;
}

export function formatOrderItems(items: readonly OrderLine[]): string {
  return items.map((item) => `${item.quantity} ${item.name}`).join(" · ");
}

export function formatBillMeta(bill: BillRequest): string {
  return `${getRequestModeShortLabel(bill.paymentMethod)} · Total ${formatPrice(bill.total)}`;
}

export function formatBillWarning(bill: BillRequest): { tone: "success" | "warning"; text: string } {
  const count = bill.ordersInPreparation;
  if (count === 0) return { tone: "success", text: "Sin alertas de cocina" };
  const noun = count === 1 ? "pedido" : "pedidos";
  return { tone: "warning", text: `⚠ ${count} ${noun} aún en preparación` };
}

export type BestSellerBar = BestSeller & { ratio: number };

/** Best sellers sorted by quantity, each scaled against the top product. */
export function getBestSellerBars(products: readonly BestSeller[]): BestSellerBar[] {
  const sorted = [...products].sort((a, b) => b.quantity - a.quantity);
  const max = sorted[0]?.quantity ?? 0;
  return sorted.map((product) => ({ ...product, ratio: max > 0 ? product.quantity / max : 0 }));
}

export function getOverviewKpis(snapshot: OverviewSnapshot): Kpi[] {
  const tables = summarizeTables(snapshot.tables);
  const newOrders = snapshot.orders.filter((order) => order.status === "received").length;
  const { total } = getFinancialSummary(snapshot.payments, snapshot.confirmedOrders);
  return [
    {
      id: "new-orders",
      label: "Pedidos nuevos",
      value: String(newOrders),
      subtitle: "Esperan preparación",
      tone: "warning",
    },
    {
      id: "pending-bills",
      label: "Cuentas pendientes",
      value: String(snapshot.billRequests.length),
      subtitle: "Esperan atención",
      tone: "danger",
    },
    {
      id: "occupied-tables",
      label: "Mesas ocupadas",
      value: String(tables.occupied),
      subtitle: `De ${tables.enabled} mesas habilitadas`,
      tone: "brand",
    },
    {
      id: "collected",
      label: "Total cobrado",
      value: formatPrice(total),
      subtitle: "Cobros confirmados hoy",
      tone: "success",
    },
  ];
}
