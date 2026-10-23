"use client";

import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import type { ManagedOrder } from "@/mocks/types";
import { ORDERS_BOARD } from "@/mocks/orders";
import { TABLES_BOARD } from "@/mocks/tables";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { KanbanBoard, type BoardEmptyState } from "./KanbanBoard";
import { OrderFilters } from "./OrderFilters";
import { OrderMetrics, OrdersHeader } from "./OrdersHeader";
import {
  advanceOrder,
  filterOrders,
  getBillRequestedTables,
  getOrderMetrics,
  getOrderTableOptions,
  groupOrdersByColumn,
  type OrderQuery,
} from "./orders-view";

/**
 * Forced variants: `empty` (no orders yet) and `no-results` (search with no match).
 * Their copy is not in the 03 export.
 */
export const ORDERS_FORCED_STATES = ["empty", "no-results"] as const;

/** Query that `?state=no-results` pre-fills: no order has that number. */
const NO_RESULTS_QUERY = "9999";

/**
 * 03 · Gestión de pedidos. Container: owns the in-memory orders, filters and toggles, and
 * feeds the presentational pieces from the `ORDERS_BOARD` mock.
 */
export function OrdersScreen() {
  const forcedState = useScreenState(ORDERS_FORCED_STATES);
  const [orders, setOrders] = useState<ManagedOrder[]>(() =>
    forcedState === "empty" ? [] : ORDERS_BOARD.orders,
  );
  const [table, setTable] = useState<OrderQuery["table"]>("all");
  const [query, setQuery] = useState(() => (forcedState === "no-results" ? NO_RESULTS_QUERY : ""));
  const [showDelivered, setShowDelivered] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const billRequestedTables = useMemo(() => getBillRequestedTables(TABLES_BOARD.tables), []);
  const visibleOrders = useMemo(() => filterOrders(orders, { table, query }), [orders, table, query]);
  const columns = groupOrdersByColumn(visibleOrders, { showDelivered });
  const hasVisibleOrders = columns.some((column) => column.orders.length > 0);

  const advance = (id: number) => {
    const at = new Date().toTimeString().slice(0, 5);
    setOrders((current) => current.map((order) => (order.id === id ? advanceOrder(order, at) : order)));
  };

  const clearFilters = () => {
    setTable("all");
    setQuery("");
    setShowDelivered(true);
  };

  let emptyState: BoardEmptyState | null = null;
  if (!hasVisibleOrders) {
    emptyState = orders.some((order) => order.status !== "cancelled")
      ? {
          title: "No encontramos pedidos",
          description: "Probá con otro número de pedido o de mesa, o cambiá la mesa seleccionada.",
          action: { label: "Limpiar búsqueda y filtros", onClick: clearFilters },
        }
      : {
          icon: ClipboardList,
          title: "Todavía no hay pedidos",
          description: "Cuando las mesas confirmen pedidos, vas a verlos acá.",
        };
  }

  return (
    // The kanban fills the viewport under the 72px top bar and each column scrolls on its own.
    <div className="flex h-[calc(100dvh-72px)] min-h-[600px] flex-col gap-3 px-7 pt-5 pb-4">
      <OrdersHeader enabled={soundEnabled} onToggle={() => setSoundEnabled((enabled) => !enabled)} />
      <OrderMetrics metrics={getOrderMetrics(orders)} />
      <OrderFilters
        tableOptions={getOrderTableOptions(orders)}
        table={table}
        onTableChange={setTable}
        query={query}
        onQueryChange={setQuery}
        showDelivered={showDelivered}
        onShowDeliveredChange={setShowDelivered}
      />
      <KanbanBoard
        columns={columns}
        emptyState={emptyState}
        billRequestedTables={billRequestedTables}
        onOpen={() => {}}
        onAdvance={advance}
      />
    </div>
  );
}
