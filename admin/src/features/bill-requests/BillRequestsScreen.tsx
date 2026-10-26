"use client";

import { useReducer, useState } from "react";
import { BILL_REQUESTS_BOARD, SERVICE_DAY } from "@/mocks/service-day";
import { DEMO_STAFF } from "@/mocks/staff";
import { paginate } from "@/shared/lib/pagination";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { ConfirmDialog } from "@/shared/ui";
import {
  filterRequests,
  formatTableCount,
  getRequestMetrics,
  getTransitionConfirm,
  REQUESTS_PAGE_SIZE,
  sortRequests,
  type PaymentFilter,
  type RequestSort,
  type StatusFilter,
  type TransitionAction,
} from "./bill-requests-view";
import {
  billRequestsReducer,
  createBillRequestsState,
  getSelectedRequest,
  type BillRequestsState,
} from "./bill-requests-state";
import { BillRequestDetailPanel } from "./BillRequestDetailPanel";
import { BillRequestsHeader, RequestMetrics } from "./BillRequestsHeader";
import { RequestToolbar } from "./RequestToolbar";
import { NO_REQUESTS_ICON, NO_RESULTS_ICON, RequestsTable, type TableEmptyState } from "./RequestsTable";

/**
 * Forced variants: `selected` (detail panel of Mesa 10, as in the "Solicitud seleccionada" export),
 * `empty` (no bill requests yet) and `no-results` (search with no match). The empty and
 * no-results copy is not in the 04 exports.
 */
export const BILL_REQUESTS_FORCED_STATES = ["selected", "empty", "no-results"] as const;

type ForcedState = (typeof BILL_REQUESTS_FORCED_STATES)[number];

function initBillRequestsState(forcedState: ForcedState | null): BillRequestsState {
  if (forcedState === "empty") return createBillRequestsState([]);
  if (forcedState === "selected") {
    return createBillRequestsState(BILL_REQUESTS_BOARD.requests, { selectedId: BILL_REQUESTS_BOARD.selectedId });
  }
  return createBillRequestsState(BILL_REQUESTS_BOARD.requests);
}

/** Query that `?state=no-results` pre-fills: no table has that number. */
const NO_RESULTS_QUERY = "Mesa 99";

/**
 * 04 · Solicitudes de cuenta. Container: owns the in-memory requests (pure
 * `billRequestsReducer`: detail panel and confirmed status transitions), filters, sort and page, fed by
 * `BILL_REQUESTS_BOARD`.
 */
export function BillRequestsScreen() {
  const forcedState = useScreenState(BILL_REQUESTS_FORCED_STATES);
  const [state, dispatch] = useReducer(billRequestsReducer, forcedState, initBillRequestsState);
  const { requests } = state;
  const selectedRequest = getSelectedRequest(state);
  const [query, setQuery] = useState(() => (forcedState === "no-results" ? NO_RESULTS_QUERY : ""));
  const [sort, setSort] = useState<RequestSort>("longest-wait");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [payment, setPayment] = useState<PaymentFilter>("all");
  const [page, setPage] = useState(1);
  const [pendingTransition, setPendingTransition] = useState<{ action: TransitionAction; id: string } | null>(null);
  const pendingRequest = pendingTransition && requests.find((request) => request.id === pendingTransition.id);

  const confirmTransition = () => {
    if (!pendingTransition) return;
    const { action, id } = pendingTransition;
    const type = action === "finalize" ? "finalize-request" : action;
    dispatch({ type, id, staffName: DEMO_STAFF.name, at: SERVICE_DAY.now });
    setPendingTransition(null);
  };

  const visible = paginate(
    sortRequests(filterRequests(requests, { status, payment, query }), sort),
    page,
    REQUESTS_PAGE_SIZE,
  );

  // Any change to what the table lists goes back to the first page.
  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setPayment("all");
    setPage(1);
  };

  let emptyState: TableEmptyState | null = null;
  if (visible.total === 0) {
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
    // ADMIN 04's 1164px content frame: 50px header, 68px metrics, 46px toolbar and 362px panel.
    <div className="flex h-[calc(100dvh-72px)] min-h-[640px] flex-col gap-3 px-7 pt-[22px] pb-7">
      <BillRequestsHeader />
      <RequestMetrics metrics={getRequestMetrics(requests)} />
      <RequestToolbar
        query={query}
        onQueryChange={resetPage(setQuery)}
        sort={sort}
        onSortChange={resetPage(setSort)}
        status={status}
        onStatusChange={resetPage(setStatus)}
        payment={payment}
        onPaymentChange={resetPage(setPayment)}
      />
      <div className="flex min-h-0 w-full flex-1 gap-3">
        <RequestsTable
          requests={visible.items}
          emptyState={emptyState}
          footerCount={formatTableCount(visible)}
          page={visible.page}
          pageCount={visible.pageCount}
          onPageChange={setPage}
          selectedId={state.selectedId}
          onMarkAttending={(id) => setPendingTransition({ action: "mark-attending", id })}
          onVerifyPayment={(id) => setPendingTransition({ action: "verify-payment", id })}
          onFinalize={(id) => setPendingTransition({ action: "finalize", id })}
          onViewDetail={(id) => dispatch({ type: "open-detail", id })}
        />
        {selectedRequest && (
          <BillRequestDetailPanel
            request={selectedRequest}
            onClose={() => dispatch({ type: "close-detail" })}
            onAction={(action, id) => setPendingTransition({ action, id })}
          />
        )}
      </div>
      {pendingTransition && pendingRequest && (
        <ConfirmDialog
          {...getTransitionConfirm(pendingTransition.action, pendingRequest, DEMO_STAFF.name)}
          onCancel={() => setPendingTransition(null)}
          onConfirm={confirmTransition}
        />
      )}
    </div>
  );
}
