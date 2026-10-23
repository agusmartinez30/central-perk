import { formatPrice } from "@/shared/lib/format-price";
import { Card } from "@/shared/ui";
import type { FinancialSummary, SalesBar } from "./overview-view";

/** Height in px of the tallest bar inside the 130px chart ("Sales Bars"). */
const MAX_BAR_HEIGHT = 92;

type SalesOverviewProps = {
  bars: SalesBar[];
  summary: FinancialSummary;
};

/** "Ventas del período": hourly bars plus the financial summary tiles. */
export function SalesOverview({ bars, summary }: SalesOverviewProps) {
  const tiles = [
    { label: "Cuentas cerradas", value: String(summary.closedBills) },
    { label: "Ticket promedio", value: formatPrice(summary.averageTicket) },
    { label: "Pedidos confirmados", value: String(summary.confirmedOrders) },
  ];

  return (
    <Card as="section" aria-label="Ventas del período" className="flex h-full flex-1 flex-col gap-2.5 p-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-ink">Ventas del período</h3>
        <p className="text-[17px] font-bold text-success">{formatPrice(summary.total)}</p>
      </div>
      <ul className="flex h-[130px] items-end justify-center gap-4">
        {bars.map((bar) => (
          <li key={bar.hour} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[11px]/[1.25] font-bold text-ink">{formatPrice(bar.total)}</span>
            <span
              aria-hidden="true"
              className="w-full rounded-t-[5px] bg-brand"
              style={{ height: Math.max(4, Math.round(bar.ratio * MAX_BAR_HEIGHT)) }}
            />
            <span className="text-[11px]/[1.25] text-muted">{bar.hour}</span>
          </li>
        ))}
      </ul>
      <dl className="flex gap-[7px]">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex min-h-[66px] flex-1 flex-col gap-[3px] rounded-field bg-cream px-2.5 py-2">
            <dt className="text-[11px]/[1.25] font-semibold text-muted">{tile.label}</dt>
            <dd className="text-[17px]/[1.25] font-bold text-ink">{tile.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[11px] text-muted">Solo pagos confirmados · horario local del negocio</p>
    </Card>
  );
}
