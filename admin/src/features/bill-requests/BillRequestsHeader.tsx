import clsx from "clsx";
import { Radio } from "lucide-react";
import type { RequestMetric } from "./bill-requests-view";
import { REQUEST_TONE_CLASSES } from "./BillRequestTags";

/** "Page Header": title, subtitle and the "Realtime Note". */
export function BillRequestsHeader() {
  return (
    <header className="flex w-full shrink-0 items-end justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="text-[25px] font-bold whitespace-nowrap text-ink">Solicitudes de cuenta</h2>
        <p className="text-[12px] whitespace-nowrap text-muted">
          Organizá y atendé las solicitudes de pago de tus mesas.
        </p>
      </div>
      <p className="flex h-[34px] items-center gap-2 rounded-field bg-surface px-[11px] outline-1 -outline-offset-[0.5px] outline-line">
        <Radio size={14} aria-hidden="true" className="shrink-0 text-success" />
        <span className="text-[11px] font-semibold whitespace-nowrap text-muted">Actualización automática</span>
      </p>
    </header>
  );
}

/** "Métrica · …" tiles: pending and in-attention tinted like their status, transfers white. */
const METRIC_BACKGROUNDS: Record<RequestMetric["id"], string> = {
  pending: "bg-warning-bg",
  attending: "bg-brand-wash",
  transfers: "bg-surface",
  finalized: "bg-success-bg",
};

/** "Request Metrics": four tiles. */
export function RequestMetrics({ metrics }: { metrics: RequestMetric[] }) {
  return (
    <ul aria-label="Resumen de solicitudes" className="flex h-[82px] w-full shrink-0 gap-3">
      {metrics.map((metric) => (
        <li
          key={metric.id}
          className={clsx(
            "flex h-[82px] flex-1 flex-col gap-[7px] rounded-card px-[15px] py-[13px] outline-1 -outline-offset-[0.5px] outline-line",
            METRIC_BACKGROUNDS[metric.id],
          )}
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-[11px] font-bold whitespace-nowrap text-muted">{metric.label}</span>
            <span
              aria-hidden="true"
              className={clsx("size-[7px] rounded-full", REQUEST_TONE_CLASSES[metric.tone].dot)}
            />
          </div>
          <span className="text-[27px] font-bold whitespace-nowrap text-ink">{metric.value}</span>
        </li>
      ))}
    </ul>
  );
}
