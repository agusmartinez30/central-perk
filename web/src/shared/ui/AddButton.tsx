import { Plus } from "lucide-react";
import clsx from "clsx";

type AddButtonProps = {
  label: string;
  onClick: () => void;
  /** Diameter in px as used by the designs: 32 (featured card), 30 (row), 28 (explore card). */
  size?: 28 | 30 | 32;
  className?: string;
};

const sizeClasses = { 28: "size-7", 30: "size-[30px]", 32: "size-8" } as const;

/** Round brand "+" button for quick-adding a product. */
export function AddButton({ label, onClick, size = 32, className }: AddButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={clsx(
        "relative z-10 flex shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform active:scale-90 active:bg-brand-2",
        sizeClasses[size],
        className,
      )}
    >
      <Plus size={size === 32 ? 17 : 16} aria-hidden="true" />
    </button>
  );
}
