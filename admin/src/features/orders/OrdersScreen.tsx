"use client";

import { useMemo, useReducer, useState } from "react";
import { ClipboardList } from "lucide-react";
import { ORDERS_BOARD } from "@/mocks/orders";
import { TABLES_BOARD } from "@/mocks/tables";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { KanbanBoard, type BoardEmptyState } from "./KanbanBoard";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { OrderFilters } from "./OrderFilters";
import { OrderMetrics, OrdersHeader } from "./OrdersHeader";
import {
  createOrdersState,
  formatClock,
  getCancelTarget,
  getSelectedOrder,
  ordersReducer,
  type OrdersState,
} from "./orders-state";
import {
  filterOrders,
  getBillRequestedTables,
  getOrderMetrics,
  getOrderTableOptions,
  groupOrdersByColumn,
  type OrderQuery,
} from "./orders-view";

/**
 * Forced variants: `detail` (drawer of #1051, as in the "Pedido seleccionado" export),
 * `cancel` (cancellation dialog of #1051), `empty` (no orders yet) and `no-results`
 * (search with no match). The empty and no-results copy is not in the 03 exports.
 */
export const ORDERS_FORCED_STATES = ["detail", "cancel", "empty", "no-results"] as const;

type ForcedState = (typeof ORDERS_FORCED_STATES)[number];

/** Order the `detail` and `cancel` variants open, as in the exports. */
const FORCED_ORDER_ID = 1051;

/** Query that `?state=no-results` pre-fills: no order has that number. */
const NO_RESULTS_QUERY = "9999";

function initOrdersState(forcedState: ForcedState | null): OrdersState {
  if (forcedState === "empty") return createOrdersState([]);
  return createOrdersState(ORDERS_BOARD.orders, {
    selectedId: forcedState === "detail" ? FORCED_ORDER_ID : null,
    cancelTargetId: forcedState === "cancel" ? FORCED_ORDER_ID : null,
  });
}

const now = () => formatClock(new Date());

/**
 * 03 · Gestión de pedidos. Container: owns the in-memory orders (pure `ordersReducer`: drawer,
 * status changes and two-step cancellation), filters and toggles, fed by `ORDERS_BOARD`.
 */
export function OrdersScreen() {
  const forcedState = useScreenState(ORDERS_FORCED_STATES);
  const [state, dispatch] = useReducer(ordersReducer, forcedState, initOrdersState);
  const { orders } = state;
  const selectedOrder = getSelectedOrder(state);
  const cancelTarget = getCancelTarget(state);
  const [table, setTable] = useState<OrderQuery["table"]>("all");
  const [query, setQuery] = useState(() => (forcedState === "no-results" ? NO_RESULTS_QUERY : ""));
  const [showDelivered, setShowDelivered] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const billRequestedTables = useMemo(() => getBillRequestedTables(TABLES_BOARD.tables), []);
  const visibleOrders = useMemo(() => filterOrders(orders, { table, query }), [orders, table, query]);
  const columns = groupOrdersByColumn(visibleOrders, { showDelivered });
  const hasVisibleOrders = columns.some((column) => column.orders.length > 0);

  const advance = (id: number) => dispatch({ type: "advance", id, at: now() });

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
        onOpen={(id) => dispatch({ type: "open-detail", id })}
        onAdvance={advance}
      />
      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => dispatch({ type: "close-detail" })}
          onAdvance={advance}
          onRequestCancel={(id) => dispatch({ type: "request-cancel", id })}
        />
      )}
      {cancelTarget && (
        <CancelOrderDialog
          key={cancelTarget.id}
          order={cancelTarget}
          onDismiss={() => dispatch({ type: "dismiss-cancel" })}
          onConfirm={(reason) => dispatch({ type: "confirm-cancel", reason, at: now() })}
        />
      )}
    </div>
  );
}
