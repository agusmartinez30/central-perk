import { describe, expect, it } from "vitest";
import { PAYMENT_SETTINGS, PAYMENT_SETTINGS_VIEWED_AT } from "@/mocks/payments";
import { createPaymentsState, getPaymentsView, paymentsReducer } from "./payments-state";

const initial = createPaymentsState(PAYMENT_SETTINGS, { now: PAYMENT_SETTINGS_VIEWED_AT });

describe("createPaymentsState", () => {
  it("starts on 'Métodos y modalidades' with a clean copy of the saved settings", () => {
    expect(initial.tab).toBe("methods");
    expect(initial.draft).toEqual(PAYMENT_SETTINGS.settings);
    expect(initial.draft).not.toBe(PAYMENT_SETTINGS.settings);
    expect(getPaymentsView(initial)).toMatchObject({
      changes: [],
      dirty: false,
      savedAgo: "Guardado hace 4 min",
      meta: "Versión 18 · actualizada hoy 14:38",
    });
  });

  it("reads the clock at the last save when none is given", () => {
    expect(getPaymentsView(createPaymentsState(PAYMENT_SETTINGS)).savedAgo).toBe("Guardado recién");
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
    expect(getPaymentsView(toggled)).toMatchObject({ dirty: true });
    expect(getPaymentsView(toggled).changes).toHaveLength(2);
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

describe("bank details", () => {
  const bank = paymentsReducer(initial, { type: "select-tab", tab: "bank" });

  it("edits bank fields in the draft and marks them dirty", () => {
    const edited = paymentsReducer(bank, { type: "set-bank-field", field: "bank", value: "Banco Prueba" });
    expect(edited.draft.bankAccount.bank).toBe("Banco Prueba");
    expect(edited.saved.settings.bankAccount.bank).toBe("Banco Demo");
    expect(getPaymentsView(edited).changes.map((change) => change.id)).toEqual(["bankAccount.bank"]);
  });

  it("shows errors only for edited fields until saving is attempted", () => {
    const edited = paymentsReducer(
      paymentsReducer(bank, { type: "set-bank-field", field: "alias", value: "CAFE" }),
      { type: "set-bank-field", field: "holder", value: "Café Central SRL · FICTICIO" },
    );
    expect(getPaymentsView(edited).bankErrors).toEqual({
      alias: "El alias debe tener entre 6 y 20 caracteres: letras, números, puntos o guiones.",
    });
  });
});

describe("saving", () => {
  const changed = paymentsReducer(initial, { type: "toggle-method", method: "other" });

  it("does nothing without changes", () => {
    expect(paymentsReducer(initial, { type: "request-save" })).toBe(initial);
  });

  it("asks for confirmation before saving a valid draft", () => {
    const confirming = paymentsReducer(changed, { type: "request-save" });
    expect(confirming.confirmOpen).toBe(true);
    expect(confirming.saved).toBe(PAYMENT_SETTINGS);
  });

  it("keeps the draft and the saved settings when the confirmation is cancelled", () => {
    const cancelled = paymentsReducer(paymentsReducer(changed, { type: "request-save" }), { type: "cancel-save" });
    expect(cancelled.confirmOpen).toBe(false);
    expect(cancelled.saved).toBe(PAYMENT_SETTINGS);
    expect(cancelled.draft.methods.other).toBe(true);
  });

  it("applies the draft as the next version after confirming", () => {
    const saved = paymentsReducer(paymentsReducer(changed, { type: "request-save" }), {
      type: "confirm-save",
      now: "10:15",
    });
    expect(saved.confirmOpen).toBe(false);
    expect(saved.saved.version).toBe(19);
    expect(saved.saved.settings.methods.other).toBe(true);
    expect(getPaymentsView(saved)).toMatchObject({
      dirty: false,
      savedAgo: "Guardado recién",
      meta: "Versión 19 · actualizada hoy 10:15",
    });
    expect(PAYMENT_SETTINGS.settings.methods.other).toBe(false);
  });

  it("blocks invalid drafts, reveals every bank error and opens the bank tab", () => {
    const invalid = paymentsReducer(
      paymentsReducer(initial, { type: "set-bank-field", field: "cbu", value: "" }),
      { type: "set-bank-field", field: "holder", value: "" },
    );
    const attempted = paymentsReducer(invalid, { type: "request-save" });
    expect(attempted).toMatchObject({ confirmOpen: false, showErrors: true, tab: "bank" });
    expect(getPaymentsView(attempted).bankErrors).toEqual({
      holder: "Ingresá el titular de la cuenta.",
      cbu: "Ingresá el CBU / CVU.",
    });
  });

  it("blocks the transfer mode without the transfer method and stays on the current tab", () => {
    const blocked = paymentsReducer(paymentsReducer(initial, { type: "toggle-method", method: "transfer" }), {
      type: "request-save",
    });
    expect(blocked).toMatchObject({ confirmOpen: false, showErrors: true, tab: "methods" });
  });

  it("hides the errors again after discarding", () => {
    const invalid = paymentsReducer(
      paymentsReducer(initial, { type: "set-bank-field", field: "cbu", value: "1" }),
      { type: "request-save" },
    );
    const discarded = paymentsReducer(invalid, { type: "discard" });
    expect(discarded.showErrors).toBe(false);
    expect(getPaymentsView(discarded).bankErrors).toEqual({});
  });
});
