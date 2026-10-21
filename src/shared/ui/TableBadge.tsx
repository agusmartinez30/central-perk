import { Armchair } from "lucide-react";
import clsx from "clsx";

type TableBadgeProps = {
  table: string;
  className?: string;
};

export function TableBadge({ table, className }: TableBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-2xl bg-brand-tint px-[11px] text-brand",
        className,
      )}
    >
      <Armchair size={14} aria-hidden="true" />
      <span className="text-[11px] font-bold whitespace-nowrap">Mesa {table}</span>
    </span>
  );
}
