import clsx from "clsx";
import { ChevronDown, Volume2, VolumeX } from "lucide-react";
import type { OrderMetric } from "./orders-view";
import { ORDER_TONE_CLASSES } from "./OrderTags";

type SoundControlProps = {
  enabled: boolean;
  onToggle: () => void;
};

/** "Sound Control": new-order chime toggle. */
function SoundControl({ enabled, onToggle }: SoundControlProps) {
  const Icon = enabled ? Volume2 : VolumeX;
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={onToggle}
      className="flex h-[34px] items-center gap-2 rounded-[9px] bg-surface px-[11px] text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
    >
      <Icon size={15} aria-hidden="true" className="shrink-0" />
      <span className="text-[11px] font-semibold whitespace-nowrap">
        {enabled ? "Sonido activado" : "Sonido desactivado"}
      </span>
      <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-muted" />
    </button>
  );
}

type OrdersHeaderProps = SoundControlProps;

/** "Page Header": title, subtitle and the "Sound Control". */
export function OrdersHeader({ enabled, onToggle }: OrdersHeaderProps) {
  return (
    <header className="flex w-full shrink-0 items-end justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="text-[28px] font-bold whitespace-nowrap text-ink">Gestión de pedidos</h2>
        <p className="text-[13px] whitespace-nowrap text-muted">
          Organizá los pedidos de las mesas en tiempo real.
        </p>
      </div>
      <SoundControl enabled={enabled} onToggle={onToggle} />
    </header>
  );
}

/** The export leaves "Recibidos" white and tints the other two tiles. */
const METRIC_BACKGROUNDS: Record<OrderMetric["id"], string> = {
  received: "bg-surface",
  preparing: "bg-warning-bg",
  delivered: "bg-success-bg",
};

/** "Order Metrics": one tile per kitchen stage. */
export function OrderMetrics({ metrics }: { metrics: OrderMetric[] }) {
  return (
    <ul aria-label="Resumen de pedidos" className="flex h-[82px] w-full shrink-0 gap-3">
      {metrics.map((metric) => (
        <li
          key={metric.id}
          className={clsx(
            "flex h-[82px] flex-1 flex-col gap-[7px] rounded-card px-3.5 py-3 outline-1 -outline-offset-[0.5px] outline-line",
            METRIC_BACKGROUNDS[metric.id],
          )}
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-[12px] font-semibold whitespace-nowrap text-muted">{metric.label}</span>
            <span aria-hidden="true" className={clsx("size-2 rounded-full", ORDER_TONE_CLASSES[metric.tone].dot)} />
          </div>
          <span className="text-[26px] font-bold whitespace-nowrap text-ink">{metric.value}</span>
        </li>
      ))}
    </ul>
  );
}
