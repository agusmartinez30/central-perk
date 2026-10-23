import { describe, expect, it } from "vitest";
import { BILL_STATUS_FORCED_STATES, getBillStatusView, getPaymentStatusLabel } from "./bill-status";

describe("getBillStatusView", () => {
  it("follows the table status after the request", () => {
    expect(getBillStatusView("requested", null)).toBe("requested");
    expect(getBillStatusView("attending", null)).toBe("attending");
    expect(getBillStatusView("closed", null)).toBe("closed");
    expect(getBillStatusView("reopened", null)).toBe("reopened");
  });

  it("reports an open table that never requested the bill", () => {
    expect(getBillStatusView("open", null)).toBe("not-requested");
  });

  it("lets a forced state override the store", () => {
    expect(getBillStatusView("open", "offline")).toBe("offline");
    expect(getBillStatusView("requested", "invalid")).toBe("invalid");
  });

  it("accepts the forced states of screens 09–09E", () => {
    expect(BILL_STATUS_FORCED_STATES).toEqual([
      "requested",
      "attending",
      "closed",
      "reopened",
      "offline",
      "invalid",
    ]);
  });
});

describe("getPaymentStatusLabel", () => {
  it("names the chosen preference while the payment is pending", () => {
    expect(getPaymentStatusLabel("cashier")).toBe("Preferencia: En caja · Pago pendiente");
    expect(getPaymentStatusLabel("table")).toBe("Preferencia: En la mesa · Pago pendiente");
    expect(getPaymentStatusLabel("transfer")).toBe("Preferencia: Por transferencia · Pago pendiente");
  });

  it("falls back to the cashier preference of screen 09", () => {
    expect(getPaymentStatusLabel(null)).toBe("Preferencia: En caja · Pago pendiente");
  });
});
