import clsx from "clsx";
import { Clock3, CreditCard, Landmark, Store, type LucideIcon } from "lucide-react";
import type { BillPaymentMethod, ManagedBillRequest } from "@/mocks/types";
import { formatWait, getPaymentLabel, getStatusBadge, getWaitTone, type RequestTone } from "./bill-requests-view";

/** Wash, text and dot classes of each request tone. */
export const REQUEST_TONE_CLASSES: Record<RequestTone, { wash: string; text: string; dot: string }> = {
  brand: { wash: "bg-brand-wash", text: "text-brand", dot: "bg-brand" },
  warning: { wash: "bg-warning-bg", text: "text-warning", dot: "bg-warning" },
  success: { wash: "bg-success-bg", text: "text-success", dot: "bg-success" },
  danger: { wash: "bg-danger-bg", text: "text-danger", dot: "bg-danger" },
};

/** "Request Status" / "Panel Status": 26px pill with a 6px dot. */
export function StatusPill({ status }: { status: ManagedBillRequest["status"] }) {
  const { label, tone } = getStatusBadge(status);
  const classes = REQUEST_TONE_CLASSES[tone];
  return (
    <span className={clsx("inline-flex h-[26px] w-fit shrink-0 items-center gap-1.5 rounded-[13px] px-2.5", classes.wash)}>
      <span aria-hidden="true" className={clsx("size-1.5 shrink-0 rounded-full", classes.dot)} />
      <span className={clsx("text-[11px] font-bold whitespace-nowrap", classes.text)}>{label}</span>
    </span>
  );
}

const WAIT_CLASSES = {
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-sand text-muted",
} as const;

/** "Waiting Indicator": clock and minutes since the bill was requested. */
export function WaitingIndicator({ request }: { request: ManagedBillRequest }) {
  return (
    <span
      className={clsx(
        "inline-flex h-7 w-fit items-center gap-1.5 rounded-nav px-[9px]",
        WAIT_CLASSES[getWaitTone(request)],
      )}
    >
      <Clock3 size={13} aria-hidden="true" className="shrink-0" />
      <span className="text-[11px] font-bold whitespace-nowrap">{formatWait(request.waitMinutes)}</span>
    </span>
  );
}

/** The export uses the transfer icon (landmark) on every row; the other two are ours. */
const PAYMENT_ICONS: Record<BillPaymentMethod, LucideIcon> = {
  transfer: Landmark,
  table: CreditCard,
  register: Store,
};

/** "Payment Preference": sand chip with the payment method. */
export function PaymentPreference({ method }: { method: BillPaymentMethod }) {
  const Icon = PAYMENT_ICONS[method];
  return (
    <span className="inline-flex h-7 w-fit items-center gap-[7px] rounded-nav bg-sand px-2.5">
      <Icon size={14} aria-hidden="true" className="shrink-0 text-muted" />
      <span className="text-[11px] font-semibold whitespace-nowrap text-ink">{getPaymentLabel(method)}</span>
    </span>
  );
}
