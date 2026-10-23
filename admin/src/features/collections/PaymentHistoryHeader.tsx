import clsx from "clsx";
import {
  Banknote,
  ChartNoAxesColumnIncreasing,
  CircleCheckBig,
  Landmark,
  LockKeyhole,
  type LucideIcon,
} from "lucide-react";
import type { CollectionMetric } from "./collections-view";

/** "Payment History Header": title, subtitle and the "History Read Only Notice". */
export function PaymentHistoryHeader() {
  return (
    <header className="flex w-full shrink-0 items-end justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="text-[25px] font-bold whitespace-nowrap text-ink">Historial de cobros</h2>
        <p className="text-[12px] whitespace-nowrap text-muted">
          Consultá las operaciones registradas y las cuentas cerradas.
        </p>
      </div>
      <p className="flex h-[34px] items-center gap-[7px] rounded-field bg-surface px-[11px] outline-1 -outline-offset-[0.5px] outline-line">
        <LockKeyhole size={13} aria-hidden="true" className="shrink-0 text-success" />
        <span className="text-[11px] font-bold whitespace-nowrap text-muted">Historial de solo lectura</span>
      </p>
    </header>
  );
}

const METRIC_STYLES: Record<CollectionMetric["id"], { background: string; icon: LucideIcon }> = {
  total: { background: "bg-brand-wash", icon: Banknote },
  accounts: { background: "bg-surface", icon: CircleCheckBig },
  average: { background: "bg-surface", icon: ChartNoAxesColumnIncreasing },
  transfers: { background: "bg-success-bg", icon: Landmark },
};

/** "Payment Metrics": four tiles over the selected period. */
export function PaymentMetrics({ metrics }: { metrics: CollectionMetric[] }) {
  return (
    <ul aria-label="Resumen de cobros" className="flex h-[82px] w-full shrink-0 gap-3">
      {metrics.map((metric) => {
        const { background, icon: Icon } = METRIC_STYLES[metric.id];
        return (
          <li
            key={metric.id}
            className={clsx(
              "flex h-[82px] flex-1 flex-col gap-[7px] rounded-card px-[15px] py-[13px] outline-1 -outline-offset-[0.5px] outline-line",
              background,
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[11px] font-bold whitespace-nowrap text-muted">{metric.label}</span>
              <Icon size={15} aria-hidden="true" className="shrink-0 text-brand" />
            </div>
            <span className="text-[25px] font-bold whitespace-nowrap text-ink">{metric.value}</span>
          </li>
        );
      })}
    </ul>
  );
}
