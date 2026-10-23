import { History } from "lucide-react";

/** "Payment Settings Header": breadcrumb, title, subtitle and the "Audit Status" pill. */
export function PaymentSettingsHeader() {
  return (
    <header className="flex w-full shrink-0 items-end justify-between">
      <div className="flex flex-col gap-[3px]">
        <p className="text-[11px] font-bold whitespace-nowrap text-brand">Configuración / Pagos</p>
        <h2 className="text-[24px] font-bold whitespace-nowrap text-ink">Configuración de pagos</h2>
        <p className="text-[12px] whitespace-nowrap text-muted">Administrá las opciones de cobro de tu restaurante.</p>
      </div>
      <p className="flex h-8 items-center gap-[7px] rounded-nav bg-surface px-2.5 outline-1 -outline-offset-[0.5px] outline-line">
        <History size={13} aria-hidden="true" className="shrink-0 text-muted" />
        <span className="text-[11px] font-bold whitespace-nowrap text-muted">Todos los cambios quedan registrados</span>
      </p>
    </header>
  );
}
