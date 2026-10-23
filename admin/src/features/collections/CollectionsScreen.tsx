"use client";

import { useReducer } from "react";
import { COLLECTIONS_HISTORY } from "@/mocks/collections";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { formatDateRange, formatResultCount, getCollectionMetrics, getStaffOptions } from "./collections-view";
import {
  collectionsReducer,
  createCollectionsState,
  getVisibleCollections,
  type CollectionsState,
} from "./collections-state";
import { PaymentHistoryFilters } from "./PaymentHistoryFilters";
import { PaymentHistoryHeader, PaymentMetrics } from "./PaymentHistoryHeader";
import {
  NO_COLLECTIONS_ICON,
  NO_RESULTS_ICON,
  PaymentHistoryTable,
  type TableEmptyState,
} from "./PaymentHistoryTable";

/**
 * Forced variants: `empty` (no collections in the period) and `no-results` (search with no
 * match). Their copy is not in the 05 exports.
 */
export const COLLECTIONS_FORCED_STATES = ["empty", "no-results"] as const;

type ForcedState = (typeof COLLECTIONS_FORCED_STATES)[number];

/** Query that `?state=no-results` pre-fills: no table has that number. */
const NO_RESULTS_QUERY = "Mesa 99";

function initCollectionsState(forcedState: ForcedState | null): CollectionsState {
  const { collections, today } = COLLECTIONS_HISTORY;
  if (forcedState === "empty") return createCollectionsState([], today);
  return createCollectionsState(collections, today, {
    query: forcedState === "no-results" ? NO_RESULTS_QUERY : "",
  });
}

/**
 * 05 · Historial de cobros. Container: owns the in-memory history (pure `collectionsReducer`:
 * period, search, selects, sort and page), fed by `COLLECTIONS_HISTORY`.
 */
export function CollectionsScreen() {
  const forcedState = useScreenState(COLLECTIONS_FORCED_STATES);
  const [state, dispatch] = useReducer(collectionsReducer, forcedState, initCollectionsState);
  const visible = getVisibleCollections(state);

  let emptyState: TableEmptyState | null = null;
  if (visible.total === 0) {
    emptyState =
      visible.periodCollections.length > 0
        ? {
            icon: NO_RESULTS_ICON,
            title: "No encontramos operaciones",
            description: "Probá con otra mesa, cuenta u operación, o cambiá los filtros.",
            action: { label: "Limpiar búsqueda y filtros", onClick: () => dispatch({ type: "clear-filters" }) },
          }
        : {
            icon: NO_COLLECTIONS_ICON,
            title: "No hay cobros en este período",
            description: "Cuando se confirme el pago de una cuenta, vas a verlo acá.",
          };
  }

  return (
    // The table fills the viewport under the 72px top bar and its rows scroll on their own.
    <div className="flex h-[calc(100dvh-72px)] min-h-[600px] flex-col gap-3 px-7 pt-5 pb-4">
      <PaymentHistoryHeader />
      <PaymentMetrics metrics={getCollectionMetrics(visible.periodCollections)} />
      <PaymentHistoryFilters
        period={state.period}
        onPeriodChange={(period) => dispatch({ type: "set-period", period })}
        rangeLabel={formatDateRange(visible.range)}
        query={state.query}
        onQueryChange={(query) => dispatch({ type: "set-query", query })}
        method={state.method}
        onMethodChange={(method) => dispatch({ type: "set-method", method })}
        staff={state.staff}
        staffOptions={getStaffOptions(state.collections)}
        onStaffChange={(staff) => dispatch({ type: "set-staff", staff })}
        sort={state.sort}
        onSortChange={(sort) => dispatch({ type: "set-sort", sort })}
      />
      <PaymentHistoryTable
        collections={visible.items}
        emptyState={emptyState}
        resultCount={formatResultCount(visible)}
        page={visible.page}
        pageCount={visible.pageCount}
        onPageChange={(page) => dispatch({ type: "set-page", page })}
        // The selected-collection drawer arrives with T3.
        onViewDetail={() => {}}
      />
    </div>
  );
}
