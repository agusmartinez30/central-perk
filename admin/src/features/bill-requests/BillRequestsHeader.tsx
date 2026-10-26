import clsx from "clsx";
import { Radio } from "lucide-react";
import type { RequestMetric } from "./bill-requests-view";
import { REQUEST_TONE_CLASSES } from "./BillRequestTags";

/** Compact 50px operational header from ADMIN 04. */
export function BillRequestsHeader() {
  return (
    <header className="flex h-[50px] w-full shrink-0 items-center justify-between">
      <div className="flex flex-col gap-[3px]">
        <h1 className="text-[24px] leading-none font-extrabold whitespace-nowrap text-ink">Solicitudes de cuenta</h1>
        <p className="text-[12px] whitespace-nowrap text-muted">
          Priorizá la atención, validá el cobro y cerrá cada solicitud con seguridad.
        </p>
      </div>
      <p className="flex h-[34px] items-center gap-2 rounded-field bg-surface px-[11px] outline-1 -outline-offset-[0.5px] outline-line">
        <Radio size={14} aria-hidden="true" className="shrink-0 text-success" />
        <span className="text-[11px] font-semibold whitespace-nowrap text-muted">Actualización automática</span>
      </p>
    </header>
  );
}

/** "Métrica · …" tiles: contextual status washes and operational sublabels. */
const METRIC_BACKGROUNDS: Record<RequestMetric["id"], string> = {
  pending: "bg-warning-bg",
  attending: "bg-brand-wash",
  transfers: "bg-danger-bg",
  finalized: "bg-success-bg",
};

const METRIC_SUBLABELS: Record<RequestMetric["id"], string> = {
  pending: "requieren atención",
  attending: "personal asignado",
  transfers: "transferencia manual",
  finalized: "cerradas en el turno",
};

/** "Request Metrics": four tiles. */
export function RequestMetrics({ metrics }: { metrics: RequestMetric[] }) {
  return (
    <ul aria-label="Resumen de solicitudes" className="flex h-[68px] w-full shrink-0 gap-2.5">
      {metrics.map((metric) => (
        <li
          key={metric.id}
          className={clsx(
            "flex h-[68px] flex-1 flex-row items-center justify-between rounded-[10px] px-3.5 py-2.5",
            METRIC_BACKGROUNDS[metric.id],
          )}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-extrabold whitespace-nowrap text-muted">{metric.label}</span>
            <span className={clsx("text-[10px] font-semibold whitespace-nowrap", REQUEST_TONE_CLASSES[metric.tone].text)}>
              {METRIC_SUBLABELS[metric.id]}
            </span>
          </div>
          <span className={clsx("text-[27px] font-extrabold whitespace-nowrap", REQUEST_TONE_CLASSES[metric.tone].text)}>
            {metric.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
