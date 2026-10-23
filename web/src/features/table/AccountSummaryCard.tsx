import type { Ars } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";
import { formatOrderCount } from "@/features/table-session";

type AccountSummaryCardProps = {
  total: Ars;
  orderCount: number;
  table: string;
  paymentLabel: string;
};

/** Blue shared-account summary of screen 07: accumulated total, order count and payment chip. */
export function AccountSummaryCard({ total, orderCount, table, paymentLabel }: AccountSummaryCardProps) {
  return (
    <section
      aria-label="Cuenta compartida"
      className="flex h-[116px] w-full items-center justify-between rounded-panel bg-brand p-4 text-white"
    >
      <div className="flex flex-col gap-1">
        <p className="text-[10.5px] font-bold text-white/75">Total acumulado de la mesa</p>
        <p className="text-[32px] leading-none font-bold tracking-[-0.8px]">{formatPrice(total)}</p>
        <p className="text-[9.5px] text-white/65">Cuenta compartida · Mesa {table}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="text-[11px] font-bold">{formatOrderCount(orderCount)}</p>
        <span className="rounded-xl bg-surface px-2 py-[5px] text-[9.5px] font-bold text-brand">
          {paymentLabel}
        </span>
      </div>
    </section>
  );
}
