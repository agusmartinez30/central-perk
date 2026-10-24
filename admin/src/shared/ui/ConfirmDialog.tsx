"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

export type ConfirmDialogProps = {
  title: string;
  description: string;
  /** Extra line under the description (09F "Se conservan la mesa…"). */
  note?: ReactNode;
  /** null shows only the cancel button (the dialog just explains). */
  confirmLabel: string | null;
  cancelLabel?: string;
  /** Confirm button color: danger for destructive actions. */
  tone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm?: () => void;
};

/**
 * Confirmation `alertdialog` over the dimmed main area (the 09F pattern). Nothing happens until
 * the confirm button; cancel, Escape or the scrim close it. Focus starts on cancel, stays inside
 * the dialog and returns to the opener on close.
 */
export function ConfirmDialog({
  title,
  description,
  note,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "danger",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
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
    // The dialog sits 228px below the top bar, centered over the 1220px main area.
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
            // At most two focusable buttons: Tab and Shift+Tab move between them.
            event.preventDefault();
            const next = document.activeElement === cancelRef.current && confirmRef.current ? confirmRef : cancelRef;
            next.current?.focus();
          }
        }}
        className="flex min-h-[260px] w-[400px] flex-col gap-3 rounded-auth bg-surface p-5 shadow-[0_8px_24px_#10101022] outline-1 -outline-offset-[0.5px] outline-line"
      >
        <TriangleAlert size={26} aria-hidden="true" className={clsx("shrink-0", tone === "danger" ? "text-danger" : "text-warning")} />
        <h2 id={titleId} className="text-[17px] font-bold text-ink">
          {title}
        </h2>
        <p id={descriptionId} className="w-full text-[12px]/[17px] text-muted">
          {description}
        </p>
        {note && <p className="text-[11px] font-semibold text-brand">{note}</p>}
        <div className="flex w-full justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex h-9 items-center rounded-nav bg-surface px-3 text-[11px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
          >
            {cancelLabel}
          </button>
          {confirmLabel && (
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              className={clsx(
                "flex h-9 items-center rounded-nav px-3 text-[11px] font-bold text-white outline-1 -outline-offset-[0.5px]",
                tone === "danger" ? "bg-danger outline-danger hover:bg-danger/90" : "bg-brand outline-brand hover:bg-brand/92",
              )}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
