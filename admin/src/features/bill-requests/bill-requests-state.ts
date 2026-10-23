import type { ManagedBillRequest } from "@/mocks/types";
import { markAttending } from "./bill-requests-view";

/** In-memory state of 04: the requests and the one open in the quick-detail drawer. */
export type BillRequestsState = {
  requests: ManagedBillRequest[];
  selectedId: string | null;
};

export type BillRequestsAction =
  | { type: "open-detail"; id: string }
  | { type: "close-detail" }
  | { type: "mark-attending"; id: string; staffName: string };

export function createBillRequestsState(
  requests: ManagedBillRequest[],
  { selectedId = null }: Partial<Pick<BillRequestsState, "selectedId">> = {},
): BillRequestsState {
  return { requests, selectedId };
}

function findRequest(state: BillRequestsState, id: string | null): ManagedBillRequest | null {
  return id === null ? null : (state.requests.find((request) => request.id === id) ?? null);
}

export function getSelectedRequest(state: BillRequestsState): ManagedBillRequest | null {
  return findRequest(state, state.selectedId);
}

/**
 * Pure transitions of the bill requests screen. "Marcar en atención" keeps the drawer open so
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
          request.id === action.id ? markAttending(request, action.staffName) : request,
        ),
      };
  }
}
