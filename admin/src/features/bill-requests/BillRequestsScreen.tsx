"use client";

import { useReducer, useState } from "react";
import { BILL_REQUESTS_BOARD } from "@/mocks/service-day";
import { DEMO_STAFF } from "@/mocks/staff";
import { useScreenState } from "@/shared/lib/use-screen-state";
import {
  filterRequests,
  formatTableCount,
  getRequestMetrics,
  sortRequests,
  type PaymentFilter,
  type RequestSort,
  type StatusFilter,
} from "./bill-requests-view";
import {
  billRequestsReducer,
  createBillRequestsState,
  getSelectedRequest,
  type BillRequestsState,
} from "./bill-requests-state";
import { BillRequestDetailDrawer } from "./BillRequestDetailDrawer";
import { BillRequestsHeader, RequestMetrics } from "./BillRequestsHeader";
import { RequestFilters } from "./RequestFilters";
import { NO_REQUESTS_ICON, NO_RESULTS_ICON, RequestsTable, type TableEmptyState } from "./RequestsTable";

/**
 * Forced variants: `selected` (drawer of Mesa 10, as in the "Solicitud seleccionada" export),
 * `empty` (no bill requests yet) and `no-results` (search with no match). The empty and
 * no-results copy is not in the 04 exports.
 */
export const BILL_REQUESTS_FORCED_STATES = ["selected", "empty", "no-results"] as const;

type ForcedState = (typeof BILL_REQUESTS_FORCED_STATES)[number];

function initBillRequestsState(forcedState: ForcedState | null): BillRequestsState {
  if (forcedState === "empty") return createBillRequestsState([]);
  return createBillRequestsState(BILL_REQUESTS_BOARD.requests, {
    selectedId: forcedState === "selected" ? BILL_REQUESTS_BOARD.selectedId : null,
  });
}

/** Query that `?state=no-results` pre-fills: no table has that number. */
const NO_RESULTS_QUERY = "Mesa 99";

/**
 * 04 · Solicitudes de cuenta. Container: owns the in-memory requests (pure
 * `billRequestsReducer`: quick-detail drawer and "Marcar en atención"), filters and sort, fed by
 * `BILL_REQUESTS_BOARD`.
 */
export function BillRequestsScreen() {
  const forcedState = useScreenState(BILL_REQUESTS_FORCED_STATES);
  const [state, dispatch] = useReducer(billRequestsReducer, forcedState, initBillRequestsState);
  const { requests } = state;
  const selectedRequest = getSelectedRequest(state);
  const [query, setQuery] = useState(() => (forcedState === "no-results" ? NO_RESULTS_QUERY : ""));
  const [sort, setSort] = useState<RequestSort>("longest-wait");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [payment, setPayment] = useState<PaymentFilter>("all");

  const visible = sortRequests(filterRequests(requests, { status, payment, query }), sort);

  const clearFilters = () => {
    setQuery("");
    setStatus("active");
    setPayment("all");
  };

  let emptyState: TableEmptyState | null = null;
  if (visible.length === 0) {
    emptyState =
      requests.length > 0
        ? {
            icon: NO_RESULTS_ICON,
            title: "No encontramos solicitudes",
            description: "Probá con otra mesa, cliente o número de solicitud, o cambiá los filtros.",
            action: { label: "Limpiar búsqueda y filtros", onClick: clearFilters },
          }
        : {
            icon: NO_REQUESTS_ICON,
            title: "No hay solicitudes de cuenta",
            description: "Cuando una mesa pida la cuenta, vas a verla acá.",
          };
  }

  return (
    // The table fills the viewport under the 72px top bar and its rows scroll on their own.
    <div className="flex h-[calc(100dvh-72px)] min-h-[600px] flex-col gap-3 px-7 pt-5 pb-4">
      <BillRequestsHeader />
      <RequestMetrics metrics={getRequestMetrics(requests)} />
      <RequestFilters
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        status={status}
        onStatusChange={setStatus}
        payment={payment}
        onPaymentChange={setPayment}
      />
      <RequestsTable
        requests={visible}
        emptyState={emptyState}
        footerCount={formatTableCount(requests)}
        onMarkAttending={(id) => dispatch({ type: "mark-attending", id, staffName: DEMO_STAFF.name })}
        onViewDetail={(id) => dispatch({ type: "open-detail", id })}
      />
      {selectedRequest && (
        <BillRequestDetailDrawer request={selectedRequest} onClose={() => dispatch({ type: "close-detail" })} />
      )}
    </div>
  );
}
