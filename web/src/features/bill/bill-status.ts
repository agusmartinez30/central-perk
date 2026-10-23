import type { PaymentPreference, TableStatus } from "@/features/table-session";
import { getPaymentOption } from "./payment-options";

/** Variants that `?state=` can force on `/table/bill/status` (09 and 09A–E). */
export const BILL_STATUS_FORCED_STATES = [
  "requested",
  "attending",
  "closed",
  "reopened",
  "offline",
  "invalid",
] as const;
export type BillStatusForcedState = (typeof BILL_STATUS_FORCED_STATES)[number];

/** `not-requested`: the table is open and never asked for the bill (sent back to 08). */
export type BillStatusView = BillStatusForcedState | "not-requested";

/** Picks the screen 09 variant from the table status; a forced state always wins. */
export function getBillStatusView(
  tableStatus: TableStatus,
  forced: BillStatusForcedState | null,
): BillStatusView {
  if (forced) return forced;
  return tableStatus === "open" ? "not-requested" : tableStatus;
}

/** Payment line of the 09 status card, e.g. "Preferencia: En caja · Pago pendiente". */
export function getPaymentStatusLabel(preference: PaymentPreference | null): string {
  return `Preferencia: ${getPaymentOption(preference ?? "cashier").label} · Pago pendiente`;
}
