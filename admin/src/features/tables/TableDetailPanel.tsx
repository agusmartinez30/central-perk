import { ChefHat, ShieldCheck, WalletCards, X } from "lucide-react";
import type { ManagedTable } from "@/mocks/types";
import { InfoTag, StatusBadge } from "./TableTags";
import {
  formatAccountTotal,
  formatTableLabel,
  getCardAlert,
  getPaymentPreferenceLabel,
  getStatusBadge,
  getTableDetailStats,
} from "./tables-view";

type TableDetailPanelProps = {
  table: ManagedTable;
  onClose: () => void;
};

/** "Detalle seleccionado": quick-detail side panel over the right edge of the screen. */
export function TableDetailPanel({ table, onClose }: TableDetailPanelProps) {
  const label = formatTableLabel(table.number);
  const payment = getPaymentPreferenceLabel(table);
  const alert = getCardAlert(table);

  return (
    <aside
      aria-label={`Detalle rápido · ${label}`}
      className="fixed top-[76px] right-0 bottom-1 z-20 flex w-80 flex-col gap-[18px] bg-surface p-6 shadow-drawer"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold tracking-[1.2px] whitespace-nowrap text-muted">
            DETALLE RÁPIDO
          </p>
          <h3 className="text-[24px] font-bold whitespace-nowrap text-ink">{label}</h3>
        </div>
        <button
          type="button"
          aria-label="Cerrar detalle"
          onClick={onClose}
          className="flex size-5 items-center justify-center text-muted hover:text-ink"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <StatusBadge {...getStatusBadge(table)} />
      <div className="flex w-full flex-col gap-1 rounded-card bg-cream p-4">
        <p className="text-[12px] whitespace-nowrap text-muted">Total cuenta compartida</p>
        <p className="text-[28px] font-bold whitespace-nowrap text-ink">{formatAccountTotal(table)}</p>
      </div>
      <dl className="flex w-full flex-col gap-2.5">
        {getTableDetailStats(table).map((stat) => (
          <div key={stat.label} className="flex items-center justify-between text-[12px] whitespace-nowrap">
            <dt className="text-muted">{stat.label}</dt>
            <dd className="font-bold text-ink">{stat.value}</dd>
          </div>
        ))}
      </dl>
      {payment && <InfoTag icon={WalletCards} label={payment} tone="danger" />}
      {alert && <InfoTag icon={ChefHat} label={alert} tone="warning" />}
      <div className="flex-1" />
      <div className="flex w-full items-center gap-2">
        <ShieldCheck size={15} aria-hidden="true" className="shrink-0 text-muted" />
        <p className="flex-1 text-[11px]/[14px] text-muted">
          Solo personal autorizado puede cobrar y cerrar la mesa.
        </p>
      </div>
      <button
        type="button"
        className="flex h-11 w-full shrink-0 items-center justify-center rounded-[10px] bg-brand text-[13px] font-bold whitespace-nowrap text-white hover:bg-brand/92"
      >
        Ver detalle de mesa
      </button>
    </aside>
  );
}
