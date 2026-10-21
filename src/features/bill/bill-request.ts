import type { PaymentPreference, TableStatus } from "@/features/table-session";

/** Variants of screen 08: the form plus 08B–F. */
export type BillRequestView = "form" | "sending" | "updated" | "error" | "requested" | "closed";

/** Variants that `?state=` can force on `/table/bill`. */
export const BILL_REQUEST_FORCED_STATES = ["sending", "updated", "error", "requested", "closed"] as const;
export type BillRequestForcedState = (typeof BILL_REQUEST_FORCED_STATES)[number];

type BillRequestViewInput = {
  tableStatus: TableStatus;
  /** True from the confirmation until the status screen opens. */
  sending: boolean;
  forced: BillRequestForcedState | null;
  /** The table total differs from the one shown when the screen opened. */
  totalChanged: boolean;
};

/**
 * Picks the screen 08 variant. An in-flight request wins (so the store turning `requested`
 * never flashes 08C before navigating), then a forced state, then the table session.
 */
export function getBillRequestView({
  tableStatus,
  sending,
  forced,
  totalChanged,
}: BillRequestViewInput): BillRequestView {
  if (sending) return "sending";
  if (forced) return forced;
  if (tableStatus === "closed") return "closed";
  if (tableStatus === "requested" || tableStatus === "attending") return "requested";
  return totalChanged ? "updated" : "form";
}

/** Views where the request can still be sent (08, 08D and the 08E retry). */
const CONFIRMABLE_VIEWS: readonly BillRequestView[] = ["form", "updated", "error"];

type ConfirmInput = {
  view: BillRequestView;
  preference: PaymentPreference | null;
  acknowledged: boolean;
  orderCount: number;
};

/** The request needs a payment preference, the acknowledgement and something to pay. */
export function canConfirmBillRequest({ view, preference, acknowledged, orderCount }: ConfirmInput): boolean {
  return CONFIRMABLE_VIEWS.includes(view) && preference !== null && acknowledged && orderCount > 0;
}

const SINGLE_REQUEST_NOTE =
  "La solicitud se envía una sola vez. Luego queda bloqueada hasta que el personal la gestione.";

const STATE_HINTS: Record<Exclude<BillRequestView, "form">, string> = {
  sending: "Validando el estado de la cuenta",
  updated: "Revisá el nuevo total antes de confirmar",
  error: "No se registró ninguna solicitud",
  requested: "El personal fue notificado",
  closed: "Pago gestionado por el personal",
};

type HintInput = Pick<ConfirmInput, "view" | "preference" | "acknowledged">;

/** Note under the footer actions of screen 08 and its variants. */
export function getBillRequestHint({ view, preference, acknowledged }: HintInput): string {
  if (view !== "form") return STATE_HINTS[view];
  return preference !== null && !acknowledged
    ? "Seleccioná la confirmación para continuar"
    : SINGLE_REQUEST_NOTE;
}
