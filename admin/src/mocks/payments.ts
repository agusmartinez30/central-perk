import type { SavedPaymentSettings } from "./types";

/**
 * Payment configuration of the 06 exports: every method but "Otro" and every request mode
 * enabled, version 18, saved four minutes before the screen is viewed ("Guardado hace 4 min"). The bank data is the export's own fictional placeholder ("FICTICIO",
 * "Banco Demo", an all-zero CBU whose check digits are trivially valid); it is not a real account.
 */
export const PAYMENT_SETTINGS: SavedPaymentSettings = {
  version: 18,
  updatedAt: "14:38",
  settings: {
    methods: { cash: true, card: true, transfer: true, other: false },
    requestModes: { table: true, register: true, transfer: true },
    bankAccount: {
      holder: "Café Central SRL · FICTICIO",
      bank: "Banco Demo",
      alias: "CAFE.CENTRAL.DEMO",
      cbu: "0000000000000000000000",
      staffInstructions: "Verificar la acreditación antes de confirmar el pago.",
    },
  },
};

/**
 * Clock the payment settings are viewed at: the service-day `now` (14:42), repeated here because
 * the service day imports this module.
 */
export const PAYMENT_SETTINGS_VIEWED_AT = "14:42";
