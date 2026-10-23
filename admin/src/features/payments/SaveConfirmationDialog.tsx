"use client";

import { useEffect, useId, useRef } from "react";
import { GitCompareArrows, ShieldCheck } from "lucide-react";

type SaveConfirmationDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * "Save Confirmation Dialog" over the main area ("Save Confirmation Backdrop"). Nothing is saved
 * until "Confirmar y guardar"; "Cancelar", Escape or the backdrop keep the draft as it is. Focus
 * starts on "Cancelar", stays inside the dialog and returns to the opener on close.
 */
export function SaveConfirmationDialog({ onCancel, onConfirm }: SaveConfirmationDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    return () => opener?.focus();
  }, []);

  return (
    // The 06 dialog sits 214px below the top bar, centered over the 1220px main area.
    <div
      className="fixed top-[72px] right-0 bottom-0 left-[220px] z-40 flex items-start justify-center bg-ink/30 pt-[214px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onCancel();
          } else if (event.key === "Tab") {
            // Two focusable buttons: Tab and Shift+Tab move between them.
            event.preventDefault();
            const next = document.activeElement === cancelRef.current ? confirmRef : cancelRef;
            next.current?.focus();
          }
        }}
        className="flex w-[440px] flex-col gap-3.5 rounded-auth bg-surface p-5 shadow-modal"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-brand-wash text-brand">
          <ShieldCheck size={18} aria-hidden="true" />
        </span>
        <h2 id={titleId} className="text-[18px] font-bold text-ink">
          ¿Guardar cambios de pagos?
        </h2>
        <p id={descriptionId} className="w-full text-[12px]/[17px] text-muted">
          Los cambios afectarán las futuras solicitudes de cuenta. Las solicitudes existentes conservarán su
          modalidad original.
        </p>
        <p className="flex w-full items-center gap-2 rounded-[9px] bg-cream p-2.5 text-muted">
          <GitCompareArrows size={14} aria-hidden="true" className="shrink-0" />
          <span className="text-[11px] font-bold">Se verificará la versión antes de guardar.</span>
        </p>
        <div className="flex w-full gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex h-10 flex-1 items-center justify-center rounded-[9px] text-[12px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="flex h-10 flex-1 items-center justify-center rounded-[9px] bg-brand text-[12px] font-bold text-white hover:bg-brand/92"
          >
            Confirmar y guardar
          </button>
        </div>
      </div>
    </div>
  );
}
