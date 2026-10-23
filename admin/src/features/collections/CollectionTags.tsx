import { Banknote, CreditCard, Landmark, type LucideIcon } from "lucide-react";
import type { CollectionMethod, CollectionStatus } from "@/mocks/types";
import { getMethodLabel, getStatusBadge } from "./collections-view";

/** The export only shows the cash icon (banknote); transfer and card reuse the 05 filter/metric icons. */
const METHOD_ICONS: Record<CollectionMethod, LucideIcon> = {
  cash: Banknote,
  transfer: Landmark,
  card: CreditCard,
};

/** "Row Payment Method": sand chip with the payment method actually used. */
export function PaymentMethodChip({ method }: { method: CollectionMethod }) {
  const Icon = METHOD_ICONS[method];
  return (
    <span className="inline-flex h-7 w-fit items-center gap-[7px] rounded-nav bg-sand px-2.5">
      <Icon size={14} aria-hidden="true" className="shrink-0 text-muted" />
      <span className="text-[11px] font-semibold whitespace-nowrap text-ink">{getMethodLabel(method)}</span>
    </span>
  );
}

/** "Row Payment Status" / "Drawer Payment Status": 26px green pill with a 6px dot. */
export function PaymentStatusPill({ status }: { status: CollectionStatus }) {
  const { label } = getStatusBadge(status);
  return (
    <span className="inline-flex h-[26px] w-fit shrink-0 items-center gap-1.5 rounded-[13px] bg-success-bg px-2.5">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-success" />
      <span className="text-[11px] font-bold whitespace-nowrap text-success">{label}</span>
    </span>
  );
}
