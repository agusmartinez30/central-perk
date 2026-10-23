"use client";

import { useReducer } from "react";
import { PAYMENT_SETTINGS } from "@/mocks/payments";
import { createPaymentsState, getPaymentsView, paymentsReducer } from "./payments-state";
import { PaymentSettingsForm } from "./PaymentSettingsForm";
import { PaymentSettingsHeader } from "./PaymentSettingsHeader";
import { PaymentSettingsNavigation } from "./PaymentSettingsNavigation";
import { PaymentSettingsSaveBar } from "./PaymentSettingsSaveBar";
import { SettingsPreviewColumn } from "./SettingsPreviewColumn";

/**
 * 06 · Configuración de pagos. Container: owns the saved settings and the draft (pure
 * `paymentsReducer`), fed by `PAYMENT_SETTINGS`. Nothing persists beyond the session.
 */
export function PaymentSettingsScreen() {
  const [state, dispatch] = useReducer(paymentsReducer, PAYMENT_SETTINGS, createPaymentsState);
  const view = getPaymentsView(state);

  return (
    // The workspace fills the viewport under the 72px top bar, as in the 1440×900 export.
    <div className="flex h-[calc(100dvh-72px)] min-h-[700px] flex-col gap-3 px-7 pt-[18px] pb-4">
      <PaymentSettingsHeader />
      <div className="flex min-h-0 w-full flex-1 items-start gap-3">
        <PaymentSettingsNavigation tab={state.tab} onTabChange={(tab) => dispatch({ type: "select-tab", tab })} />
        <PaymentSettingsForm
          draft={state.draft}
          lockedMethods={view.lockedMethods}
          transferModeBlocked={view.issues.some((issue) => issue.id === "transfer-mode-requirements")}
          onToggleMethod={(method) => dispatch({ type: "toggle-method", method })}
          onToggleRequestMode={(mode) => dispatch({ type: "toggle-request-mode", mode })}
        />
        <SettingsPreviewColumn modes={view.previewModes} />
      </div>
      <PaymentSettingsSaveBar
        title={view.title}
        meta={view.meta}
        dirty={view.dirty}
        onDiscard={() => dispatch({ type: "discard" })}
        onSave={() => {
          // Saving goes through the confirmation dialog (T3).
        }}
      />
    </div>
  );
}
