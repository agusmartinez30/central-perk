import type {
  AcceptedPaymentMethod,
  BillPaymentMethod,
  PaymentSettings,
  SavedPaymentSettings,
} from "@/mocks/types";
import {
  BANK_FIELDS,
  PAYMENT_METHOD_OPTIONS,
  REQUEST_MODE_OPTIONS,
  applySettings,
  canDisableMethod,
  formatChangesTitle,
  formatVersionMeta,
  getSettingsChanges,
  getSettingsIssues,
  validateBankAccount,
  type BankAccountErrors,
  type BankField,
  type RequestModeOption,
  type SettingsChange,
  type SettingsIssue,
} from "./payment-settings";

/** "Payment Settings Navigation" tabs with content; "Seguridad" has no design yet. */
export type SettingsTab = "methods" | "modes" | "bank";

export type PaymentsState = {
  /** Last confirmed configuration (in memory only). */
  saved: SavedPaymentSettings;
  /** Edits not saved yet. */
  draft: PaymentSettings;
  tab: SettingsTab;
  /** "Save Confirmation Dialog" open. */
  confirmOpen: boolean;
  /** A save was attempted with errors: every bank error is shown, not only edited fields. */
  showErrors: boolean;
};

export type PaymentsAction =
  | { type: "select-tab"; tab: SettingsTab }
  | { type: "toggle-method"; method: AcceptedPaymentMethod }
  | { type: "toggle-request-mode"; mode: BillPaymentMethod }
  | { type: "set-bank-field"; field: BankField; value: string }
  | { type: "discard" }
  | { type: "request-save" }
  | { type: "cancel-save" }
  /** `now`: local "HH:MM" time of the save. */
  | { type: "confirm-save"; now: string };

function copySettings(settings: PaymentSettings): PaymentSettings {
  return {
    methods: { ...settings.methods },
    requestModes: { ...settings.requestModes },
    bankAccount: { ...settings.bankAccount },
  };
}

export function createPaymentsState(
  saved: SavedPaymentSettings,
  overrides: Partial<Omit<PaymentsState, "saved">> = {},
): PaymentsState {
  return {
    saved,
    draft: copySettings(saved.settings),
    tab: "methods",
    confirmOpen: false,
    showErrors: false,
    ...overrides,
  };
}

export function paymentsReducer(state: PaymentsState, action: PaymentsAction): PaymentsState {
  switch (action.type) {
    case "select-tab":
      return { ...state, tab: action.tab };
    case "toggle-method": {
      const { methods } = state.draft;
      if (!canDisableMethod(methods, action.method)) return state;
      return {
        ...state,
        draft: { ...state.draft, methods: { ...methods, [action.method]: !methods[action.method] } },
      };
    }
    case "toggle-request-mode": {
      const { requestModes } = state.draft;
      return {
        ...state,
        draft: { ...state.draft, requestModes: { ...requestModes, [action.mode]: !requestModes[action.mode] } },
      };
    }
    case "set-bank-field":
      return {
        ...state,
        draft: { ...state.draft, bankAccount: { ...state.draft.bankAccount, [action.field]: action.value } },
      };
    case "discard":
      return { ...state, draft: copySettings(state.saved.settings), showErrors: false, confirmOpen: false };
    case "request-save": {
      const issues = getSettingsIssues(state.draft);
      if (issues.length > 0) {
        const bankInvalid = issues.some((issue) => issue.id === "invalid-bank-account");
        return { ...state, showErrors: true, confirmOpen: false, tab: bankInvalid ? "bank" : state.tab };
      }
      if (getSettingsChanges(state.saved.settings, state.draft).length === 0) return state;
      return { ...state, confirmOpen: true };
    }
    case "cancel-save":
      return { ...state, confirmOpen: false };
    case "confirm-save": {
      const saved = applySettings(state.saved, state.draft, action.now);
      return { ...state, saved, draft: copySettings(saved.settings), confirmOpen: false, showErrors: false };
    }
  }
}

export type PaymentsView = {
  changes: SettingsChange[];
  dirty: boolean;
  issues: SettingsIssue[];
  /** Save bar title: "Configuración sin cambios" or "N cambios sin guardar". */
  title: string;
  /** Save bar meta: "Versión 18 · actualizada hoy 09:42". */
  meta: string;
  /** Enabled methods that cannot be turned off (the last one left). */
  lockedMethods: AcceptedPaymentMethod[];
  /** Request modes the customer would see on the 08 screen. */
  previewModes: RequestModeOption[];
  /** Bank errors to show: edited fields only, or all of them after a save attempt. */
  bankErrors: BankAccountErrors;
};

function getVisibleBankErrors({ saved, draft, showErrors }: PaymentsState): BankAccountErrors {
  const errors = validateBankAccount(draft.bankAccount);
  if (showErrors) return errors;
  const visible: BankAccountErrors = {};
  for (const { id } of BANK_FIELDS) {
    if (errors[id] && draft.bankAccount[id] !== saved.settings.bankAccount[id]) visible[id] = errors[id];
  }
  return visible;
}

export function getPaymentsView(state: PaymentsState): PaymentsView {
  const { saved, draft } = state;
  const changes = getSettingsChanges(saved.settings, draft);
  return {
    changes,
    dirty: changes.length > 0,
    issues: getSettingsIssues(draft),
    title: formatChangesTitle(changes.length),
    meta: formatVersionMeta(saved),
    lockedMethods: PAYMENT_METHOD_OPTIONS.map((option) => option.id).filter(
      (method) => !canDisableMethod(draft.methods, method),
    ),
    previewModes: REQUEST_MODE_OPTIONS.filter((option) => draft.requestModes[option.id]),
    bankErrors: getVisibleBankErrors(state),
  };
}
