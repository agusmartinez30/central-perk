"use client";

import { useEffect, useReducer, useRef } from "react";
import { PAYMENT_SETTINGS, PAYMENT_SETTINGS_VIEWED_AT } from "@/mocks/payments";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { BankAccountForm } from "./BankAccountForm";
import { createPaymentsState, getPaymentsView, paymentsReducer, type PaymentsState } from "./payments-state";
import { PaymentSettingsForm } from "./PaymentSettingsForm";
import { PaymentSettingsHeader } from "./PaymentSettingsHeader";
import { PaymentSettingsNavigation } from "./PaymentSettingsNavigation";
import { PaymentSettingsSaveBar } from "./PaymentSettingsSaveBar";
import { SaveConfirmationDialog } from "./SaveConfirmationDialog";
import { SettingsPreviewColumn } from "./SettingsPreviewColumn";

/**
 * Forced variants: `bank` ("Datos bancarios" export), `bank-errors` (invalid alias and CBU after a
 * save attempt; not in the exports) and `confirm` ("Confirmar cambios" export, with a pending
 * change to the staff instructions so there is something to save).
 */
export const PAYMENTS_FORCED_STATES = ["bank", "bank-errors", "confirm"] as const;

type ForcedState = (typeof PAYMENTS_FORCED_STATES)[number];

function initPaymentsState(forcedState: ForcedState | null): PaymentsState {
  const state = createPaymentsState(PAYMENT_SETTINGS, { now: PAYMENT_SETTINGS_VIEWED_AT });
  const { bankAccount } = state.draft;
  switch (forcedState) {
    case "bank":
      return { ...state, tab: "bank" };
    case "bank-errors":
      return {
        ...state,
        tab: "bank",
        showErrors: true,
        draft: { ...state.draft, bankAccount: { ...bankAccount, alias: "CAFE", cbu: "0000000000000000000001" } },
      };
    case "confirm":
      return {
        ...state,
        confirmOpen: true,
        draft: {
          ...state.draft,
          bankAccount: {
            ...bankAccount,
            staffInstructions: "Verificar la acreditación en el banco antes de confirmar el pago.",
          },
        },
      };
    default:
      return state;
  }
}

/** Local "HH:MM" of `date`, for "actualizada hoy 10:15". */
function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * 06 · Configuración de pagos, under Configuración (`/settings/payments`). Container: owns the saved
 * settings, the draft, the active tab and the save confirmation (pure `paymentsReducer`), fed by
 * `PAYMENT_SETTINGS` and viewed at the service-day clock. Saving only applies the draft in memory
 * after "Confirmar y guardar"; nothing persists beyond the session.
 */
export function PaymentSettingsScreen() {
  const forcedState = useScreenState(PAYMENTS_FORCED_STATES);
  const [state, dispatch] = useReducer(paymentsReducer, forcedState, initPaymentsState);
  const view = getPaymentsView(state);
  const transferModeBlocked = view.issues.some((issue) => issue.id === "transfer-mode-requirements");
  const blockedIssue = state.showErrors && view.issues.length > 0 ? view.issues[0].message : undefined;

  // A confirmed save removes the save bar (and the dialog's opener): move focus to the saved status.
  const statusRef = useRef<HTMLParagraphElement>(null);
  const savedVersion = state.saved.version;
  const initialVersion = useRef(savedVersion);
  useEffect(() => {
    if (savedVersion !== initialVersion.current) statusRef.current?.focus();
  }, [savedVersion]);

  return (
    // The workspace fills the viewport under the 72px top bar, as in the 1440×900 export.
    <div className="flex h-[calc(100dvh-72px)] min-h-[640px] flex-col px-8 pt-5 pb-5">
      <PaymentSettingsHeader tab={state.tab} savedAgo={view.savedAgo} meta={view.meta} statusRef={statusRef} />
      <PaymentSettingsNavigation tab={state.tab} onTabChange={(tab) => dispatch({ type: "select-tab", tab })} />
      <div className="mt-5 flex min-h-0 w-full flex-1 items-start gap-5">
        {state.tab === "bank" ? (
          <BankAccountForm
            account={state.draft.bankAccount}
            errors={view.bankErrors}
            transferModeBlocked={transferModeBlocked}
            onFieldChange={(field, value) => dispatch({ type: "set-bank-field", field, value })}
          />
        ) : (
          <PaymentSettingsForm
            draft={state.draft}
            lockedMethods={view.lockedMethods}
            transferModeBlocked={transferModeBlocked}
            onToggleMethod={(method) => dispatch({ type: "toggle-method", method })}
            onToggleRequestMode={(mode) => dispatch({ type: "toggle-request-mode", mode })}
          />
        )}
        <SettingsPreviewColumn tab={state.tab} modes={view.previewModes} account={state.draft.bankAccount} />
      </div>
      {view.dirty && (
        <PaymentSettingsSaveBar
          issue={blockedIssue}
          onDiscard={() => dispatch({ type: "discard" })}
          onSave={() => dispatch({ type: "request-save" })}
        />
      )}
      {state.confirmOpen && (
        <SaveConfirmationDialog
          onCancel={() => dispatch({ type: "cancel-save" })}
          onConfirm={() => dispatch({ type: "confirm-save", now: formatClock(new Date()) })}
        />
      )}
    </div>
  );
}
