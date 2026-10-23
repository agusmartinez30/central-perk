import type { ReactNode } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";

type AcknowledgementCheckboxProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
};

/** Confirmation checkbox card that gates the bill request (screen 08). */
export function AcknowledgementCheckbox({ checked, disabled = false, onChange, children }: AcknowledgementCheckboxProps) {
  return (
    <label
      className={clsx(
        "flex min-h-[58px] w-full items-center gap-3 rounded-card bg-surface px-3 py-3 outline-1 -outline-offset-[0.5px] outline-line outline-solid",
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={clsx(
          "flex size-6 shrink-0 items-center justify-center rounded-md peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40",
          checked
            ? "bg-brand text-white"
            : "bg-surface outline-[1.5px] -outline-offset-[0.75px] outline-brand outline-solid",
        )}
      >
        {checked ? <Check size={16} strokeWidth={3} /> : null}
      </span>
      <span className="text-[11px] leading-[14px] font-bold text-ink">{children}</span>
    </label>
  );
}
