import { Minus, Plus } from "lucide-react";
import clsx from "clsx";

type QuantityStepperProps = {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Disables the minus button (e.g. the detail screen never goes below 1). */
  canDecrement?: boolean;
  /** `lg`: product detail (48px pill). `sm`: compact cart row (32px). */
  size?: "lg" | "sm";
  /** Item name used in the accessible button labels. */
  itemLabel?: string;
  className?: string;
};

const sizes = {
  lg: {
    box: "h-12 gap-3.5 rounded-3xl bg-surface p-1 outline-1 -outline-offset-[0.5px] outline-line outline-solid",
    button: "size-10",
    minus: "bg-cream",
    icon: 17,
    value: "min-w-[10px] text-[15px]",
  },
  sm: {
    box: "h-8 gap-2 rounded-2xl bg-cream p-[3px]",
    button: "size-[26px]",
    minus: "bg-surface",
    icon: 13,
    value: "min-w-[7px] text-[11px]",
  },
} as const;

export function QuantityStepper({
  value,
  onDecrement,
  onIncrement,
  canDecrement = true,
  size = "lg",
  itemLabel,
  className,
}: QuantityStepperProps) {
  const styles = sizes[size];
  const suffix = itemLabel ? ` de ${itemLabel}` : "";

  return (
    <div className={clsx("inline-flex shrink-0 items-center", styles.box, className)}>
      <button
        type="button"
        onClick={onDecrement}
        disabled={!canDecrement}
        aria-label={`Quitar una unidad${suffix}`}
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-full text-ink disabled:text-faint",
          styles.button,
          styles.minus,
        )}
      >
        <Minus size={styles.icon} aria-hidden="true" />
      </button>
      <span aria-live="polite" className={clsx("text-center font-bold text-ink", styles.value)}>
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Agregar una unidad${suffix}`}
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-full bg-brand text-white active:bg-brand-2",
          styles.button,
        )}
      >
        <Plus size={styles.icon} aria-hidden="true" />
      </button>
    </div>
  );
}
