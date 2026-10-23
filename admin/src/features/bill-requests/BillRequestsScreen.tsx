"use client";

import { useState } from "react";
import { BILL_REQUESTS_BOARD } from "@/mocks/bill-requests";
import { DEMO_STAFF } from "@/mocks/staff";
import type { ManagedBillRequest } from "@/mocks/types";
import { useScreenState } from "@/shared/lib/use-screen-state";
import {
  filterRequests,
  formatTableCount,
  getRequestMetrics,
  markAttending,
  sortRequests,
  type PaymentFilter,
  type RequestSort,
  type StatusFilter,
} from "./bill-requests-view";
import { BillRequestsHeader, RequestMetrics } from "./BillRequestsHeader";
import { RequestFilters } from "./RequestFilters";
import { NO_REQUESTS_ICON, NO_RESULTS_ICON, RequestsTable, type TableEmptyState } from "./RequestsTable";

/**
 * Forced variants: `empty` (no bill requests yet) and `no-results` (search with no match).
 * Their copy is not in the 04 exports.
 */
export const BILL_REQUESTS_FORCED_STATES = ["empty", "no-results"] as const;

/** Query that `?state=no-results` pre-fills: no table has that number. */
const NO_RESULTS_QUERY = "Mesa 99";

/**
 * 04 · Solicitudes de cuenta. Container: owns the in-memory requests, filters and sort,
 * fed by `BILL_REQUESTS_BOARD`.
 */
export function BillRequestsScreen() {
  const forcedState = useScreenState(BILL_REQUESTS_FORCED_STATES);
  const [requests, setRequests] = useState<ManagedBillRequest[]>(() =>
    forcedState === "empty" ? [] : BILL_REQUESTS_BOARD.requests,
  );
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

  const handleMarkAttending = (id: string) =>
    setRequests((current) =>
      current.map((request) => (request.id === id ? markAttending(request, DEMO_STAFF.name) : request)),
    );

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
        onMarkAttending={handleMarkAttending}
        onViewDetail={() => {}}
      />
    </div>
  );
}
