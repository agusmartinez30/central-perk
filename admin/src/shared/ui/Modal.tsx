"use client";

import clsx from "clsx";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { FOCUSABLE_SELECTOR, getTrapTarget } from "./focus-trap";

export type ModalProps = {
  /** Id of the heading that names the dialog. */
  labelledBy: string;
  onClose: () => void;
  /** Width class of the dialog card. */
  className?: string;
  children: ReactNode;
};

/**
 * Centered `dialog` over the dimmed viewport. Focus starts on the first field (else the first
 * focusable element), stays inside and returns to the opener on close; Escape, the scrim and the
 * close button call `onClose`. It sits below `ConfirmDialog` (z-40), which can stack on top.
 */
export function Modal({ labelledBy, onClose, className = "w-[440px]", children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const first =
      dialog?.querySelector<HTMLElement>("input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled])") ??
      dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-ink/33 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
          } else if (event.key === "Tab" && dialogRef.current) {
            const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
              (element) => !element.hidden && element.tabIndex >= 0,
            );
            const target = getTrapTarget(focusable.length, focusable.indexOf(document.activeElement as HTMLElement), event.shiftKey);
            if (target === null) return;
            event.preventDefault();
            focusable[target].focus();
          }
        }}
        className={clsx(
          "relative flex max-h-full max-w-full flex-col overflow-y-auto rounded-auth bg-surface p-5 shadow-modal outline-1 -outline-offset-[0.5px] outline-line",
          className,
        )}
      >
        {children}
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-nav text-muted hover:bg-cream hover:text-ink"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
