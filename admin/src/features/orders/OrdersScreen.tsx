"use client";

import { useMemo, useReducer, useState } from "react";
import { ClipboardList } from "lucide-react";
import { ORDERS_BOARD, SERVICE_DAY } from "@/mocks/service-day";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { KanbanBoard, type BoardEmptyState } from "./KanbanBoard";
import { OrderDetailPanel } from "./OrderDetailPanel";
import { OrderToolbar } from "./OrderToolbar";
import { OrderMetrics, OrdersHeader } from "./OrdersHeader";
import {
  countQuickFilters,
  filterBoardOrders,
  getAlertMetrics,
  getDefaultSelectedOrderId,
  sortNewestFirst,
  type QuickFilter,
} from "./order-alerts";
import {
  createOrdersState,
  getCancelTarget,
  getSelectedOrder,
  ordersReducer,
  type OrdersState,
} from "./orders-state";
import { groupOrdersByColumn } from "./orders-view";

/**
 * Forced variants: `detail` (panel on #1051, the received order of the original drawer
 * export), `cancel` (cancellation dialog of #1051), `empty` (no orders yet) and `no-results`
 * (search with no match). Without a variant the panel opens on the oldest delayed order.
 */
export const ORDERS_FORCED_STATES = ["detail", "cancel", "empty", "no-results"] as const;

type ForcedState = (typeof ORDERS_FORCED_STATES)[number];

/** Order the `detail` and `cancel` variants open, as in the original exports. */
const FORCED_ORDER_ID = 1051;

/** Query that `?state=no-results` pre-fills: no order has that number. */
const NO_RESULTS_QUERY = "9999";

/** The service day's clock: elapsed times, delays and new status changes all use it. */
const NOW = SERVICE_DAY.now;

function initOrdersState(forcedState: ForcedState | null): OrdersState {
  if (forcedState === "empty") return createOrdersState([]);
  const orders = ORDERS_BOARD.orders;
  const forced = forcedState === "detail" || forcedState === "cancel";
  return createOrdersState(orders, {
    selectedId: forced ? FORCED_ORDER_ID : getDefaultSelectedOrderId(orders, NOW),
    cancelTargetId: forcedState === "cancel" ? FORCED_ORDER_ID : null,
  });
}

/**
 * 03 · Gestión de pedidos (propuesta optimizada). Container: owns the in-memory orders (pure
 * `ordersReducer`: selection, status changes and two-step cancellation), search, quick filter
 * and toggles, fed by `ORDERS_BOARD`.
 */
export function OrdersScreen() {
  const forcedState = useScreenState(ORDERS_FORCED_STATES);
  const [state, dispatch] = useReducer(ordersReducer, forcedState, initOrdersState);
  const { orders, selectedId } = state;
  const selectedOrder = getSelectedOrder(state);
  const cancelTarget = getCancelTarget(state);
  const [query, setQuery] = useState(() => (forcedState === "no-results" ? NO_RESULTS_QUERY : ""));
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [showDelivered, setShowDelivered] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const visibleOrders = useMemo(
    () => filterBoardOrders(orders, { query, quickFilter, showDelivered, now: NOW }),
    [orders, query, quickFilter, showDelivered],
  );
  const columns = groupOrdersByColumn(sortNewestFirst(visibleOrders), { showDelivered });

  const advance = (id: number) => dispatch({ type: "advance", id, at: NOW });

  const clearFilters = () => {
    setQuery("");
    setQuickFilter("all");
    setShowDelivered(true);
  };

  let emptyState: BoardEmptyState | null = null;
  if (visibleOrders.length === 0) {
    emptyState = orders.some((order) => order.status !== "cancelled")
      ? {
          title: "No encontramos pedidos",
          description: "Probá con otro pedido, mesa o cliente, o mostrá todos los pedidos.",
          action: { label: "Limpiar búsqueda y filtros", onClick: clearFilters },
        }
      : {
          icon: ClipboardList,
          title: "Todavía no hay pedidos",
          description: "Cuando las mesas confirmen pedidos, vas a verlos acá.",
        };
  }

  return (
    // The board and the panel fill the viewport under the 72px top bar; columns scroll on their own.
    <div className="flex h-[calc(100dvh-72px)] min-h-[640px] flex-col gap-3 px-7 pt-[22px] pb-7">
      <OrdersHeader enabled={alertsEnabled} onToggle={() => setAlertsEnabled((enabled) => !enabled)} />
      <OrderMetrics metrics={getAlertMetrics(orders, NOW)} />
      <OrderToolbar
        query={query}
        onQueryChange={setQuery}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        delayedCount={countQuickFilters(orders, NOW).delayed}
        showDelivered={showDelivered}
        onShowDeliveredChange={setShowDelivered}
      />
      <div className="flex min-h-0 w-full flex-1 gap-3">
        <KanbanBoard
          columns={columns}
          emptyState={emptyState}
          now={NOW}
          selectedId={selectedId}
          onSelect={(id) => dispatch({ type: "open-detail", id })}
          onAdvance={advance}
        />
        <OrderDetailPanel
          order={selectedOrder}
          now={NOW}
          onClose={() => dispatch({ type: "close-detail" })}
          onAdvance={advance}
          onRequestCancel={(id) => dispatch({ type: "request-cancel", id })}
        />
      </div>
      {cancelTarget && (
        <CancelOrderDialog
          key={cancelTarget.id}
          order={cancelTarget}
          onDismiss={() => dispatch({ type: "dismiss-cancel" })}
          onConfirm={(reason) => dispatch({ type: "confirm-cancel", reason, at: NOW })}
        />
      )}
    </div>
  );
}
