import type {
  AcceptedPaymentMethod,
  BillPaymentMethod,
  PaymentSettings,
  SavedPaymentSettings,
} from "@/mocks/types";
import {
  PAYMENT_METHOD_OPTIONS,
  REQUEST_MODE_OPTIONS,
  canDisableMethod,
  formatChangesTitle,
  formatVersionMeta,
  getSettingsChanges,
  getSettingsIssues,
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
};

export type PaymentsAction =
  | { type: "select-tab"; tab: SettingsTab }
  | { type: "toggle-method"; method: AcceptedPaymentMethod }
  | { type: "toggle-request-mode"; mode: BillPaymentMethod }
  | { type: "discard" };

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
  return { saved, draft: copySettings(saved.settings), tab: "methods", ...overrides };
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
    case "discard":
      return { ...state, draft: copySettings(state.saved.settings) };
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
};

export function getPaymentsView({ saved, draft }: PaymentsState): PaymentsView {
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
  };
}
