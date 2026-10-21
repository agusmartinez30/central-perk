import { describe, expect, it } from "vitest";
import {
  BILL_REQUEST_FORCED_STATES,
  canConfirmBillRequest,
  getBillRequestHint,
  getBillRequestView,
} from "./bill-request";

const base = { tableStatus: "open" as const, sending: false, forced: null, totalChanged: false };

describe("getBillRequestView", () => {
  it("shows the form while the table is open or reopened", () => {
    expect(getBillRequestView(base)).toBe("form");
    expect(getBillRequestView({ ...base, tableStatus: "reopened" })).toBe("form");
  });

  it("shows 08C once the bill was requested or is being attended", () => {
    expect(getBillRequestView({ ...base, tableStatus: "requested" })).toBe("requested");
    expect(getBillRequestView({ ...base, tableStatus: "attending" })).toBe("requested");
  });

  it("shows 08F when the account is closed", () => {
    expect(getBillRequestView({ ...base, tableStatus: "closed" })).toBe("closed");
  });

  it("shows 08D when the total changed since the screen opened", () => {
    expect(getBillRequestView({ ...base, totalChanged: true })).toBe("updated");
  });

  it("keeps showing 08B while sending, even after the store says requested", () => {
    expect(getBillRequestView({ ...base, sending: true })).toBe("sending");
    expect(getBillRequestView({ ...base, sending: true, tableStatus: "requested" })).toBe("sending");
    expect(getBillRequestView({ ...base, sending: true, forced: "error" })).toBe("sending");
  });

  it("lets a forced state override the store", () => {
    expect(getBillRequestView({ ...base, forced: "error" })).toBe("error");
    expect(getBillRequestView({ ...base, tableStatus: "closed", forced: "updated" })).toBe("updated");
  });

  it("accepts the forced states of screens 08B–F", () => {
    expect(BILL_REQUEST_FORCED_STATES).toEqual(["sending", "updated", "error", "requested", "closed"]);
  });
});

describe("canConfirmBillRequest", () => {
  const ready = { view: "form" as const, preference: "cashier" as const, acknowledged: true, orderCount: 2 };

  it("requires a payment preference and the acknowledgement", () => {
    expect(canConfirmBillRequest(ready)).toBe(true);
    expect(canConfirmBillRequest({ ...ready, preference: null })).toBe(false);
    expect(canConfirmBillRequest({ ...ready, acknowledged: false })).toBe(false);
  });

  it("requires at least one billable order", () => {
    expect(canConfirmBillRequest({ ...ready, orderCount: 0 })).toBe(false);
  });

  it("allows confirming from the form, the updated total and the retry after an error", () => {
    expect(canConfirmBillRequest({ ...ready, view: "updated" })).toBe(true);
    expect(canConfirmBillRequest({ ...ready, view: "error" })).toBe(true);
  });

  it("blocks confirming while sending, once requested and when closed", () => {
    expect(canConfirmBillRequest({ ...ready, view: "sending" })).toBe(false);
    expect(canConfirmBillRequest({ ...ready, view: "requested" })).toBe(false);
    expect(canConfirmBillRequest({ ...ready, view: "closed" })).toBe(false);
  });
});

describe("getBillRequestHint", () => {
  it("asks for the confirmation once a preference is chosen", () => {
    expect(getBillRequestHint({ view: "form", preference: "table", acknowledged: false })).toBe(
      "Seleccioná la confirmación para continuar",
    );
  });

  it("explains the single request otherwise", () => {
    const single =
      "La solicitud se envía una sola vez. Luego queda bloqueada hasta que el personal la gestione.";
    expect(getBillRequestHint({ view: "form", preference: null, acknowledged: false })).toBe(single);
    expect(getBillRequestHint({ view: "form", preference: "table", acknowledged: true })).toBe(single);
  });

  it("uses the state notes of the other variants", () => {
    expect(getBillRequestHint({ view: "sending", preference: "table", acknowledged: true })).toBe(
      "Validando el estado de la cuenta",
    );
    expect(getBillRequestHint({ view: "updated", preference: "table", acknowledged: true })).toBe(
      "Revisá el nuevo total antes de confirmar",
    );
    expect(getBillRequestHint({ view: "error", preference: null, acknowledged: false })).toBe(
      "No se registró ninguna solicitud",
    );
  });
});
