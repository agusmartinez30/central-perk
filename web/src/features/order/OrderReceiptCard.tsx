import clsx from "clsx";
import type { Ars, OrderStatus } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";

type OrderReceiptCardProps = {
  number: string;
  status: OrderStatus;
  customerName: string;
  itemCount: number;
  total: Ars;
  className?: string;
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  sent: "Recibido",
  preparing: "En preparación",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const statusTones: Record<OrderStatus, string> = {
  sent: "bg-brand-tint text-brand",
  preparing: "bg-warning-bg text-warning",
  delivered: "bg-success-bg text-success",
  cancelled: "bg-danger-bg text-danger",
};

const row = "flex items-center justify-between border-t border-line px-3.5";

/** Receipt of a sent order (screen 06): number, status, customer, items and total. */
export function OrderReceiptCard({
  number,
  status,
  customerName,
  itemCount,
  total,
  className,
}: OrderReceiptCardProps) {
  return (
    <section
      aria-label={`Pedido #${number}`}
      className={clsx(
        "flex w-full flex-col rounded-2xl bg-surface outline-1 -outline-offset-[0.5px] outline-line outline-solid",
        className,
      )}
    >
      <div className="flex h-[82px] items-center justify-between px-3.5 py-[13px]">
        <div className="flex flex-col gap-px">
          <span className="text-[10.5px] font-bold text-muted">Número de pedido</span>
          <span className="font-display text-[36px] leading-none font-bold text-ink">#{number}</span>
        </div>
        <span
          className={clsx(
            "flex h-7 items-center gap-1.5 rounded-[14px] px-2.5 text-[10.5px] font-bold",
            statusTones[status],
          )}
        >
          <span className="size-[7px] rounded-full bg-current" aria-hidden="true" />
          {ORDER_STATUS_LABELS[status]}
        </span>
      </div>
      <dl className="flex flex-col">
        <div className={clsx(row, "h-9")}>
          <dt className="text-[11.5px] text-muted">Cliente</dt>
          <dd className="text-[12.5px] font-bold text-ink">{customerName}</dd>
        </div>
        <div className={clsx(row, "h-9")}>
          <dt className="text-[11.5px] text-muted">Productos</dt>
          <dd className="text-[12.5px] font-bold text-ink">{itemCount}</dd>
        </div>
        <div className={clsx(row, "h-11")}>
          <dt className="text-[11.5px] text-muted">Total del pedido</dt>
          <dd className="text-[18px] font-bold text-brand">{formatPrice(total)}</dd>
        </div>
      </dl>
    </section>
  );
}
