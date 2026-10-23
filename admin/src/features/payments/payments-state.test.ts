import { describe, expect, it } from "vitest";
import { PAYMENT_SETTINGS } from "@/mocks/payments";
import { createPaymentsState, getPaymentsView, paymentsReducer } from "./payments-state";

const initial = createPaymentsState(PAYMENT_SETTINGS);

describe("createPaymentsState", () => {
  it("starts on 'Medios de cobro' with a clean copy of the saved settings", () => {
    expect(initial.tab).toBe("methods");
    expect(initial.draft).toEqual(PAYMENT_SETTINGS.settings);
    expect(initial.draft).not.toBe(PAYMENT_SETTINGS.settings);
    expect(getPaymentsView(initial)).toMatchObject({
      changes: [],
      dirty: false,
      title: "Configuración sin cambios",
      meta: "Versión 18 · actualizada hoy 09:42",
    });
  });
});

describe("paymentsReducer", () => {
  it("switches tabs without touching the draft", () => {
    const bank = paymentsReducer(initial, { type: "select-tab", tab: "bank" });
    expect(bank.tab).toBe("bank");
    expect(bank.draft).toBe(initial.draft);
  });

  it("toggles methods and request modes in the draft only", () => {
    const toggled = paymentsReducer(
      paymentsReducer(initial, { type: "toggle-method", method: "other" }),
      { type: "toggle-request-mode", mode: "register" },
    );
    expect(toggled.draft.methods.other).toBe(true);
    expect(toggled.draft.requestModes.register).toBe(false);
    expect(toggled.saved).toBe(PAYMENT_SETTINGS);
    expect(getPaymentsView(toggled)).toMatchObject({ dirty: true, title: "2 cambios sin guardar" });
  });

  it("is clean again after toggling a method back", () => {
    const twice = paymentsReducer(
      paymentsReducer(initial, { type: "toggle-method", method: "card" }),
      { type: "toggle-method", method: "card" },
    );
    expect(getPaymentsView(twice).dirty).toBe(false);
  });

  it("never turns off the last enabled method", () => {
    let state = initial;
    for (const method of ["cash", "card", "transfer"] as const) {
      state = paymentsReducer(state, { type: "toggle-method", method });
    }
    expect(state.draft.methods).toEqual({ cash: false, card: false, transfer: true, other: false });
    expect(getPaymentsView(state).lockedMethods).toEqual(["transfer"]);
  });

  it("discards the draft back to the saved settings", () => {
    const toggled = paymentsReducer(initial, { type: "toggle-method", method: "other" });
    const discarded = paymentsReducer(toggled, { type: "discard" });
    expect(discarded.draft).toEqual(PAYMENT_SETTINGS.settings);
    expect(getPaymentsView(discarded).dirty).toBe(false);
  });
});

describe("getPaymentsView", () => {
  it("previews only the request modes enabled in the draft", () => {
    const state = paymentsReducer(initial, { type: "toggle-request-mode", mode: "table" });
    expect(getPaymentsView(state).previewModes.map((mode) => mode.label)).toEqual(["En caja", "Por transferencia"]);
  });

  it("reports the rules the draft breaks", () => {
    const state = paymentsReducer(initial, { type: "toggle-method", method: "transfer" });
    expect(getPaymentsView(state).issues.map((issue) => issue.id)).toEqual(["transfer-mode-requirements"]);
  });
});
