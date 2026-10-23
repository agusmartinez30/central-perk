import clsx from "clsx";
import { formatRealtimeLabel, type SummaryMetric } from "./tables-view";
import { TONE_CLASSES } from "./TableTags";

/** "Page Header": title, subtitle and the "Realtime Status" pill. */
export function TablesHeader({ syncedAt }: { syncedAt: string }) {
  return (
    <header className="flex w-full shrink-0 items-end justify-between">
      <div className="flex flex-col gap-[5px]">
        <h2 className="text-[28px] font-bold whitespace-nowrap text-ink">Gestión de mesas</h2>
        <p className="text-[13px] whitespace-nowrap text-muted">
          Estado de las mesas y cuentas activas del restaurante.
        </p>
      </div>
      <p
        role="status"
        className="flex items-center gap-[7px] rounded-nav bg-success-bg px-[11px] py-2"
      >
        <span aria-hidden="true" className="size-[7px] rounded-full bg-success" />
        <span className="text-[11px] font-bold whitespace-nowrap text-success">
          {formatRealtimeLabel(syncedAt)}
        </span>
      </p>
    </header>
  );
}

/** "Summary Metrics": one tinted tile per table activity. */
export function SummaryMetrics({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <ul aria-label="Resumen de mesas" className="flex h-[88px] w-full shrink-0 gap-3">
      {metrics.map((metric) => {
        const tone = TONE_CLASSES[metric.tone];
        return (
          <li
            key={metric.id}
            className={clsx("flex h-[88px] flex-1 flex-col gap-2.5 rounded-card p-4", tone.wash)}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[13px] font-semibold whitespace-nowrap text-muted">
                {metric.label}
              </span>
              <span aria-hidden="true" className={clsx("size-[9px] rounded-full", tone.dot)} />
            </div>
            <span className="text-[30px] font-bold whitespace-nowrap text-ink">{metric.value}</span>
          </li>
        );
      })}
    </ul>
  );
}
