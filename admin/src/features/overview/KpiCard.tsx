import clsx from "clsx";
import { Card } from "@/shared/ui";
import type { Kpi, SignalTone } from "./overview-view";

export const signalClasses: Record<SignalTone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** Primary KPI tile ("KPI · …"). */
export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Card as="article" className="flex h-[88px] flex-1 flex-col gap-[5px] px-4 py-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-ink">{kpi.label}</h3>
        <span aria-hidden="true" className={clsx("size-2 rounded-full", signalClasses[kpi.tone])} />
      </div>
      <p className="text-[28px] font-bold text-ink">{kpi.value}</p>
      <p className="text-[9px] text-muted">{kpi.subtitle}</p>
    </Card>
  );
}
