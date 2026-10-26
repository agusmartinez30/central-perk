import clsx from "clsx";

/** "Texto pendiente" of the 06 save bar. */
export const UNSAVED_CHANGES_TITLE = "Tenés cambios sin guardar";

type PaymentSettingsSaveBarProps = {
  /** First broken rule after a blocked save, shown in the danger tone instead of the title. */
  issue?: string;
  onDiscard: () => void;
  onSave: () => void;
};

/**
 * "Barra de guardado": shown only while there are unsaved changes, with "Descartar" and
 * "Guardar cambios" (which opens the confirmation, or reveals the broken rules).
 */
export function PaymentSettingsSaveBar({ issue, onDiscard, onSave }: PaymentSettingsSaveBarProps) {
  return (
    <div className="mt-3.5 flex h-[54px] w-full shrink-0 items-center justify-between rounded-[10px] bg-surface px-3.5 shadow-[0px_-2px_10px_#1010100d] outline-1 -outline-offset-[0.5px] outline-line">
      <p role="status" className="flex items-center gap-2">
        <span aria-hidden="true" className={clsx("size-2 shrink-0 rounded-full", issue ? "bg-danger" : "bg-warning")} />
        <span className={clsx("text-[12px] font-bold whitespace-nowrap", issue ? "text-danger" : "text-ink")}>
          {issue ?? UNSAVED_CHANGES_TITLE}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDiscard}
          className="flex h-[38px] items-center rounded-[7px] bg-surface px-3.5 text-[12px] font-bold text-muted outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream hover:text-ink"
        >
          Descartar
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex h-[38px] items-center rounded-[7px] bg-brand px-4 text-[12px] font-extrabold whitespace-nowrap text-white hover:bg-brand/92"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
