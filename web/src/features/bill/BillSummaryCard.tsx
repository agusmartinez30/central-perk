import type { Ars } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";
import { formatUnitCount } from "@/features/table-session";

type BillSummaryCardProps = {
  table: string;
  orderCount: number;
  itemCount: number;
  total: Ars;
  /** "Importe pendiente de pago" while open, "Importe final registrado" once closed. */
  caption: string;
};

/** "Resumen de la mesa" card of screen 08: table, orders, units and the bill total. */
export function BillSummaryCard({ table, orderCount, itemCount, total, caption }: BillSummaryCardProps) {
  const rows = [
    { label: "Mesa", value: table },
    { label: "Pedidos realizados", value: String(orderCount) },
    { label: "Productos", value: formatUnitCount(itemCount) },
  ];

  return (
    <section
      aria-label="Resumen de la mesa"
      className="flex w-full flex-col rounded-2xl bg-surface px-3.5 pt-3 outline-1 -outline-offset-[0.5px] outline-line outline-solid"
    >
      <h2 className="text-[14px] font-bold text-ink">Resumen de la mesa</h2>
      <dl className="flex flex-col py-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex h-[22px] items-center justify-between">
            <dt className="text-[10.5px] text-muted">{row.label}</dt>
            <dd className="text-[11px] font-bold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex h-[69px] items-center justify-between border-t border-line">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold tracking-[0.8px] text-muted">TOTAL</span>
          <span className="text-[9.5px] text-muted">{caption}</span>
        </div>
        <span className="text-[25px] font-bold tracking-[-0.5px] text-brand">{formatPrice(total)}</span>
      </div>
    </section>
  );
}
