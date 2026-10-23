import { RefreshCw } from "lucide-react";
import clsx from "clsx";
import type { OverviewPeriod } from "@/mocks/types";

const PERIODS: { id: OverviewPeriod; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "yesterday", label: "Ayer" },
  { id: "last-7-days", label: "Últimos 7 días" },
  { id: "custom", label: "Personalizado" },
];

type DashboardHeaderProps = {
  period: OverviewPeriod;
  onPeriodChange: (period: OverviewPeriod) => void;
  onRefresh: () => void;
  refreshing: boolean;
};

/** Title, period filter and manual refresh ("Dashboard Header"). */
export function DashboardHeader({ period, onPeriodChange, onRefresh, refreshing }: DashboardHeaderProps) {
  return (
    <div className="flex items-end justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="text-[25px] font-bold text-ink">Resumen general</h2>
        <p className="text-[11px] text-muted">Toda la actividad de tu restaurante en un solo lugar.</p>
      </div>
      <div className="flex items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Período"
          className="flex h-[38px] gap-[3px] rounded-field bg-surface p-1 outline-1 -outline-offset-[0.5px] outline-line"
        >
          {PERIODS.map((option) => {
            const selected = option.id === period;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onPeriodChange(option.id)}
                className={clsx(
                  "flex h-full items-center rounded-chip px-2.5 text-[9px] whitespace-nowrap transition-colors",
                  selected ? "bg-brand font-bold text-white" : "font-semibold text-muted hover:text-ink",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Actualizar datos"
          className="flex size-[38px] items-center justify-center rounded-field bg-surface text-brand outline-1 -outline-offset-[0.5px] outline-line hover:bg-brand-wash"
        >
          <RefreshCw size={15} aria-hidden="true" className={clsx(refreshing && "animate-spin")} />
        </button>
      </div>
    </div>
  );
}
