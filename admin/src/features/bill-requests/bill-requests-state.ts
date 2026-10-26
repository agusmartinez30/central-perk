import type { ManagedBillRequest } from "@/mocks/types";
import { finalizeRequest, isActiveRequest, markAttending, verifyPayment } from "./bill-requests-view";

/** In-memory state of 04: the requests and the one shown in the persistent detail panel. */
export type BillRequestsState = {
  requests: ManagedBillRequest[];
  selectedId: string | null;
};

export type BillRequestsAction =
  | { type: "open-detail"; id: string }
  | { type: "close-detail" }
  | { type: "mark-attending"; id: string; staffName: string; at?: string }
  | { type: "verify-payment"; id: string; staffName: string; at: string }
  | { type: "finalize-request"; id: string; staffName: string; at: string };

export function createBillRequestsState(
  requests: ManagedBillRequest[],
  options: Partial<Pick<BillRequestsState, "selectedId">> = {},
): BillRequestsState {
  const selectedId =
    "selectedId" in options
      ? (options.selectedId ?? null)
      : (requests.find(isActiveRequest)?.id ?? requests[0]?.id ?? null);
  return { requests, selectedId };
}

function findRequest(state: BillRequestsState, id: string | null): ManagedBillRequest | null {
  return id === null ? null : (state.requests.find((request) => request.id === id) ?? null);
}

export function getSelectedRequest(state: BillRequestsState): ManagedBillRequest | null {
  return findRequest(state, state.selectedId);
}

/**
 * Pure transitions of the bill requests screen. Contextual actions keep the detail panel open so
 * it reflects the new status and assignee.
 */
export function billRequestsReducer(state: BillRequestsState, action: BillRequestsAction): BillRequestsState {
  switch (action.type) {
    case "open-detail":
      return findRequest(state, action.id) ? { ...state, selectedId: action.id } : state;
    case "close-detail":
      return { ...state, selectedId: null };
    case "mark-attending":
      return {
        ...state,
        requests: state.requests.map((request) =>
          request.id === action.id
            ? markAttending(request, action.staffName, action.at ?? request.history.at(-1)?.at ?? request.requestedAt)
            : request,
        ),
      };
    case "verify-payment":
      return {
        ...state,
        requests: state.requests.map((request) =>
          request.id === action.id ? verifyPayment(request, action.staffName, action.at) : request,
        ),
      };
    case "finalize-request":
      return {
        ...state,
        requests: state.requests.map((request) =>
          request.id === action.id ? finalizeRequest(request, action.staffName, action.at) : request,
        ),
      };
  }
}
