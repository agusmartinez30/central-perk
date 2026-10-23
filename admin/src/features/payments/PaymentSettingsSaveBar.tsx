import { Save } from "lucide-react";

type PaymentSettingsSaveBarProps = {
  /** "Configuración sin cambios" or "N cambios sin guardar". */
  title: string;
  /** "Versión 18 · actualizada hoy 09:42". */
  meta: string;
  dirty: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

/**
 * "Payment Settings Save Bar". "Guardar cambios" keeps the export's look but is disabled while
 * there is nothing to save; "Descartar cambios" (not in the exports) appears with pending changes.
 */
export function PaymentSettingsSaveBar({ title, meta, dirty, onDiscard, onSave }: PaymentSettingsSaveBarProps) {
  return (
    <div className="flex h-16 w-full shrink-0 items-center justify-between rounded-card bg-surface px-3.5 outline-1 -outline-offset-[0.5px] outline-line">
      <div className="flex flex-col gap-0.5" role="status">
        <p className="text-[12px] font-bold whitespace-nowrap text-ink">{title}</p>
        <p className="text-[11px] whitespace-nowrap text-muted">{meta}</p>
      </div>
      <div className="flex items-center gap-2">
        {dirty && (
          <button
            type="button"
            onClick={onDiscard}
            className="flex h-10 items-center rounded-[9px] px-3.5 text-[12px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
          >
            Descartar cambios
          </button>
        )}
        <button
          type="button"
          disabled={!dirty}
          onClick={onSave}
          className="flex h-10 items-center gap-[7px] rounded-[9px] bg-brand px-3.5 text-white enabled:hover:bg-brand/92 disabled:cursor-not-allowed"
        >
          <span className="text-[12px] font-bold whitespace-nowrap">Guardar cambios</span>
          <Save size={14} aria-hidden="true" className="shrink-0" />
        </button>
      </div>
    </div>
  );
}
