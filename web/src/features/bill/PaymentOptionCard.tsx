import clsx from "clsx";
import type { PaymentOption } from "./payment-options";

type PaymentOptionCardProps = {
  option: PaymentOption;
  name: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

/** Radio card for one payment preference (screen 08). */
export function PaymentOptionCard({ option, name, checked, disabled = false, onSelect }: PaymentOptionCardProps) {
  const Icon = option.icon;
  return (
    <label
      className={clsx(
        "flex min-h-20 w-full items-center gap-3 rounded-card bg-surface px-3 py-3 outline-solid",
        checked ? "outline-[1.5px] -outline-offset-[0.75px] outline-brand" : "outline-1 -outline-offset-[0.5px] outline-line",
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
      )}
    >
      <input
        type="radio"
        name={name}
        value={option.id}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        className={clsx(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          checked ? "bg-brand text-white" : "bg-lilac text-brand",
        )}
      >
        <Icon size={19} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[14px] font-bold text-ink">{option.label}</span>
        <span className="text-[11px] leading-[14px] text-muted">{option.description}</span>
      </span>
      <span
        aria-hidden="true"
        className={clsx(
          "flex size-5 shrink-0 items-center justify-center rounded-full bg-surface outline-2 -outline-offset-1 outline-solid peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40",
          checked ? "outline-brand" : "outline-faint",
        )}
      >
        {checked ? <span className="size-2.5 rounded-full bg-brand" /> : null}
      </span>
    </label>
  );
}
