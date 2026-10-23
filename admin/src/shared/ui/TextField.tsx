import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  id: string;
  label: string;
  /** Leading lucide icon inside the input ("mail"…). */
  icon?: LucideIcon;
  /** Trailing control inside the input, e.g. a visibility toggle. */
  trailing?: ReactNode;
  invalid?: boolean;
  /** Extra classes for the `<input>` (e.g. the larger password dots). */
  inputClassName?: string;
};

/** Labelled 48px input with the focused outline of the auth exports. */
export function TextField({
  id,
  label,
  icon: Icon,
  trailing,
  invalid = false,
  inputClassName,
  ...inputProps
}: TextFieldProps) {
  return (
    <div className="flex w-full flex-col gap-[7px]">
      <label htmlFor={id} className="text-[12px] font-semibold text-ink">
        {label}
      </label>
      <div
        className={clsx(
          "flex h-12 w-full items-center gap-2.5 rounded-field bg-surface pl-3.5",
          trailing ? "pr-0.5" : "pr-3.5",
          invalid
            ? "outline-2 -outline-offset-1 outline-danger"
            : "outline-1 -outline-offset-[0.5px] outline-line focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-brand",
        )}
      >
        {Icon && <Icon size={18} aria-hidden="true" className="shrink-0 text-muted" />}
        <input
          id={id}
          aria-invalid={invalid || undefined}
          className={clsx(
            "h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted",
            inputClassName,
          )}
          {...inputProps}
        />
        {trailing}
      </div>
    </div>
  );
}
