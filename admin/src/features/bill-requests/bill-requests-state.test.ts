import { describe, expect, it } from "vitest";
import { BILL_REQUESTS_BOARD } from "@/mocks/service-day";
import { billRequestsReducer, createBillRequestsState, getSelectedRequest } from "./bill-requests-state";
import { getRequestMetrics } from "./bill-requests-view";

const initial = createBillRequestsState(BILL_REQUESTS_BOARD.requests);
const valueOf = (state: typeof initial, id: string) =>
  getRequestMetrics(state.requests).find((metric) => metric.id === id)?.value;

describe("billRequestsReducer", () => {
  it("starts with no selection unless one is given", () => {
    expect(getSelectedRequest(initial)).toBeNull();
    const selected = createBillRequestsState(BILL_REQUESTS_BOARD.requests, { selectedId: "SC-010" });
    expect(getSelectedRequest(selected)?.tableNumber).toBe(10);
  });

  it("opens and closes the quick detail", () => {
    const opened = billRequestsReducer(initial, { type: "open-detail", id: "SC-007" });
    expect(getSelectedRequest(opened)?.id).toBe("SC-007");
    expect(billRequestsReducer(opened, { type: "close-detail" }).selectedId).toBeNull();
  });

  it("ignores unknown requests", () => {
    expect(billRequestsReducer(initial, { type: "open-detail", id: "SC-999" })).toBe(initial);
  });

  it("marks a pending request as attending, updating the metrics and the open detail", () => {
    const opened = billRequestsReducer(initial, { type: "open-detail", id: "SC-010" });
    const next = billRequestsReducer(opened, { type: "mark-attending", id: "SC-010", staffName: "Sofía M." });
    expect(getSelectedRequest(next)).toMatchObject({ status: "attending", assignee: "Sofía M." });
    expect(valueOf(next, "pending")).toBe(2);
    expect(valueOf(next, "attending")).toBe(3);
    expect(valueOf(next, "transfers")).toBe(2);
    expect(initial.requests[0].status).toBe("pending");
  });

  it("does not change requests that are not pending", () => {
    const next = billRequestsReducer(initial, { type: "mark-attending", id: "SC-012", staffName: "Sofía M." });
    expect(next.requests.find((request) => request.id === "SC-012")?.assignee).toBe("María G.");
    expect(valueOf(next, "attending")).toBe(2);
  });
});
