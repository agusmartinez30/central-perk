"use client";

import { useEffect, useId, useRef } from "react";
import { TriangleAlert } from "lucide-react";

type RegenerateDialogProps = { onCancel: () => void; onConfirm: () => void };

/**
 * 09F "Regenerate QR Confirmation" over the dimmed 09C ("Dialog Scrim"). Nothing changes until
 * "Regenerar código"; "Cancelar", Escape or the scrim keep the current code. Focus starts on
 * "Cancelar", stays inside the dialog and returns to the opener on close.
 */
export function RegenerateDialog({ onCancel, onConfirm }: RegenerateDialogProps) {
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
    // The 09F dialog sits 228px below the top bar, centered over the 1220px main area.
    <div
      className="fixed top-[72px] right-0 bottom-0 left-[220px] z-40 flex items-start justify-center bg-ink/33 pt-[228px]"
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
        className="flex min-h-[260px] w-[400px] flex-col gap-3 rounded-auth bg-surface p-5 shadow-[0_8px_24px_#10101022] outline-1 -outline-offset-[0.5px] outline-line"
      >
        <TriangleAlert size={26} aria-hidden="true" className="shrink-0 text-danger" />
        <h2 id={titleId} className="text-[17px] font-bold text-ink">
          ¿Regenerar código QR?
        </h2>
        <p id={descriptionId} className="w-full text-[12px]/[17px] text-muted">
          El código anterior dejará de funcionar. Tendrás que reemplazar el QR impreso de esta mesa.
        </p>
        <p className="text-[11px] font-semibold text-brand">Se conservan la mesa, sesiones activas, pedidos y pagos.</p>
        <div className="flex w-full justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex h-9 items-center rounded-nav bg-surface px-3 text-[11px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="flex h-9 items-center rounded-nav bg-danger px-3 text-[11px] font-bold text-white outline-1 -outline-offset-[0.5px] outline-danger hover:bg-danger/90"
          >
            Regenerar código
          </button>
        </div>
      </div>
    </div>
  );
}
