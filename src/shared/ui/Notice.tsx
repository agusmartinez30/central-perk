import type { ReactNode } from "react";
import { CircleCheck, Info, TriangleAlert, WifiOff, type LucideIcon } from "lucide-react";
import clsx from "clsx";

export type NoticeTone = "info" | "warning" | "error" | "success";

type NoticeProps = {
  tone?: NoticeTone;
  /** Overrides the tone's default icon. */
  icon?: LucideIcon;
  title?: string;
  children?: ReactNode;
  className?: string;
};

const toneClasses: Record<NoticeTone, { box: string; holder: string }> = {
  info: { box: "bg-brand-tint text-brand", holder: "bg-surface" },
  warning: { box: "bg-warning-bg text-warning", holder: "bg-white/65" },
  error: { box: "bg-danger-bg text-danger", holder: "bg-white/65" },
  success: { box: "bg-success-bg text-success", holder: "bg-surface" },
};

const defaultIcons: Record<NoticeTone, LucideIcon> = {
  info: Info,
  warning: TriangleAlert,
  error: WifiOff,
  success: CircleCheck,
};

/**
 * Inline feedback block. With a title it renders the "icon holder + heading + text"
 * layout; without one it renders the compact single-message layout.
 */
export function Notice({ tone = "info", icon, title, children, className }: NoticeProps) {
  const Icon = icon ?? defaultIcons[tone];
  const styles = toneClasses[tone];

  if (!title) {
    return (
      <div
        role="status"
        className={clsx(
          "flex w-full items-center gap-2.5 rounded-[13px] px-[13px] py-3",
          styles.box,
          className,
        )}
      >
        <Icon size={19} className="shrink-0" aria-hidden="true" />
        <p className="text-[10.5px] leading-[13px] font-bold">{children}</p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={clsx(
        "flex w-full items-center gap-[11px] rounded-card p-[13px]",
        styles.box,
        className,
      )}
    >
      <span
        className={clsx(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          styles.holder,
        )}
      >
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <p className="text-[12px] font-bold">{title}</p>
        {children ? <p className="text-[10.5px] leading-[13px]">{children}</p> : null}
      </div>
    </div>
  );
}
