import type { SavedPaymentSettings } from "./types";

/**
 * Payment configuration of the 06 exports: every method but "Otro" and every request mode
 * enabled, version 18. The bank data is the export's own fictional placeholder ("FICTICIO",
 * "Banco Demo", an all-zero CBU whose check digits are trivially valid); it is not a real account.
 */
export const PAYMENT_SETTINGS: SavedPaymentSettings = {
  version: 18,
  updatedAt: "09:42",
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
