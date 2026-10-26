"use client";

import { useReducer, useState } from "react";
import { BILL_REQUESTS_BOARD, SERVICE_DAY } from "@/mocks/service-day";
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
import { BillRequestDetailPanel } from "./BillRequestDetailPanel";
import { BillRequestsHeader, RequestMetrics } from "./BillRequestsHeader";
import { RequestToolbar } from "./RequestToolbar";
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
  if (forcedState === "selected") {
    return createBillRequestsState(BILL_REQUESTS_BOARD.requests, { selectedId: BILL_REQUESTS_BOARD.selectedId });
  }
  return createBillRequestsState(BILL_REQUESTS_BOARD.requests);
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
  const [status, setStatus] = useState<StatusFilter>("all");
  const [payment, setPayment] = useState<PaymentFilter>("all");

  const visible = sortRequests(filterRequests(requests, { status, payment, query }), sort);

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
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
    // ADMIN 04's 1164px content frame: 50px header, 68px metrics, 46px toolbar and 362px panel.
    <div className="flex h-[calc(100dvh-72px)] min-h-[640px] flex-col gap-3 px-7 pt-[22px] pb-7">
      <BillRequestsHeader />
      <RequestMetrics metrics={getRequestMetrics(requests)} />
      <RequestToolbar
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        status={status}
        onStatusChange={setStatus}
        payment={payment}
        onPaymentChange={setPayment}
      />
      <div className="flex min-h-0 w-full flex-1 gap-3">
        <RequestsTable
          requests={visible}
          emptyState={emptyState}
          footerCount={formatTableCount(visible)}
          selectedId={state.selectedId}
          onMarkAttending={(id) =>
            dispatch({ type: "mark-attending", id, staffName: DEMO_STAFF.name, at: SERVICE_DAY.now })
          }
          onVerifyPayment={(id) =>
            dispatch({ type: "verify-payment", id, staffName: DEMO_STAFF.name, at: SERVICE_DAY.now })
          }
          onFinalize={(id) =>
            dispatch({ type: "finalize-request", id, staffName: DEMO_STAFF.name, at: SERVICE_DAY.now })
          }
          onViewDetail={(id) => dispatch({ type: "open-detail", id })}
        />
        <BillRequestDetailPanel
          request={selectedRequest}
          onClose={() => dispatch({ type: "close-detail" })}
          onAction={(action, id) => {
            if (action === "mark-attending") {
              dispatch({ type: "mark-attending", id, staffName: DEMO_STAFF.name, at: SERVICE_DAY.now });
            } else if (action === "verify-payment") {
              dispatch({ type: "verify-payment", id, staffName: DEMO_STAFF.name, at: SERVICE_DAY.now });
            } else {
              dispatch({ type: "finalize-request", id, staffName: DEMO_STAFF.name, at: SERVICE_DAY.now });
            }
          }}
        />
      </div>
    </div>
  );
}
