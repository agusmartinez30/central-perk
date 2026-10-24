"use client";

import { useId, type ReactNode } from "react";

type FieldProps = { label: string; error?: string; children: (props: { id: string; describedBy?: string }) => ReactNode };

/** 09B "Field Label" 9px → 11px above a 36px cream field; the error line is invented. */
export function Field({ label, error, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={id} className="text-[11px] font-bold text-muted">
        {label}
      </label>
      {children({ id, describedBy: error ? errorId : undefined })}
      {error && (
        <p id={errorId} className="-mt-1 text-[11px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export const fieldClass =
  "h-9 w-full rounded-nav bg-cream px-[11px] text-[12px] text-ink outline-none focus:outline-2 focus:outline-brand aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-danger";

/** Group label for radio-style pickers (shape, icon, tone). */
export function PickerLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-[11px] font-bold text-muted">
      {children}
    </p>
  );
}
