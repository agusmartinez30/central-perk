import type { LucideIcon } from "lucide-react";
import type { Ars } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";
import { formatOrderCount } from "@/features/table-session";

type AccountStatusCardProps = {
  statusLabel: string;
  statusIcon: LucideIcon;
  table: string;
  orderCount: number;
  total: Ars;
  paymentLabel: string;
  paymentIcon: LucideIcon;
};

/** "Estado de tu cuenta" card of screen 09: status chip, table, orders, total and payment line. */
export function AccountStatusCard({
  statusLabel,
  statusIcon: StatusIcon,
  table,
  orderCount,
  total,
  paymentLabel,
  paymentIcon: PaymentIcon,
}: AccountStatusCardProps) {
  return (
    <section
      aria-label="Estado de tu cuenta"
      className="flex w-full flex-col overflow-hidden rounded-2xl bg-surface outline-1 -outline-offset-[0.5px] outline-line outline-solid"
    >
      <div className="flex h-[54px] items-center justify-between px-3.5">
        <h2 className="text-[14px] font-bold text-ink">Estado de tu cuenta</h2>
        <span className="flex items-center gap-1.5 rounded-[13px] bg-brand-tint px-[9px] py-1.5 text-brand">
          <StatusIcon size={13} aria-hidden="true" />
          <span className="text-[9.5px] font-bold">{statusLabel}</span>
        </span>
      </div>
      <dl className="flex flex-col px-3.5 py-1.5">
        <div className="flex h-7 items-center justify-between">
          <dt className="text-[10.5px] text-muted">Mesa</dt>
          <dd className="text-[11px] font-bold text-ink">{table}</dd>
        </div>
        <div className="flex h-7 items-center justify-between">
          <dt className="text-[10.5px] text-muted">Pedidos realizados</dt>
          <dd className="text-[11px] font-bold text-ink">{orderCount}</dd>
        </div>
      </dl>
      <div className="flex min-h-[54px] items-center justify-between border-t border-line px-3.5 py-1.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10.5px] font-bold text-muted">Total de la cuenta</span>
          <span className="text-[29px] leading-none font-bold text-brand">{formatPrice(total)}</span>
        </div>
        <span className="text-[10.5px] font-bold text-ink">{formatOrderCount(orderCount)}</span>
      </div>
      <div className="flex h-8 items-center justify-center gap-[7px] bg-brand-tint px-[11px] text-brand">
        <PaymentIcon size={14} aria-hidden="true" />
        <span className="text-[9.5px] font-bold">{paymentLabel}</span>
      </div>
    </section>
  );
}
