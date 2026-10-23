import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export type StatusPillTone = "info" | "success" | "warning" | "danger" | "neutral";

type StatusPillProps = {
  children: ReactNode;
  tone?: StatusPillTone;
  icon?: LucideIcon;
  /** `sm`: order badge (26px). `md`: account status chip (30px). */
  size?: "sm" | "md";
  className?: string;
};

const toneClasses: Record<StatusPillTone, string> = {
  info: "bg-brand-tint text-brand",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-brand-mist text-muted",
};

export function StatusPill({
  children,
  tone = "info",
  icon: Icon,
  size = "sm",
  className,
}: StatusPillProps) {
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center font-bold whitespace-nowrap",
        size === "sm"
          ? "h-[26px] gap-1 rounded-[13px] px-[9px] text-[9.5px]"
          : "h-[30px] gap-[7px] rounded-[15px] px-[11px] text-[10.5px]",
        toneClasses[tone],
        className,
      )}
    >
      {Icon ? <Icon size={size === "sm" ? 12 : 14} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
