import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export type NoticeTone = "info" | "success" | "danger";

type NoticeProps = {
  tone: NoticeTone;
  icon?: LucideIcon;
  title?: string;
  children: ReactNode;
  className?: string;
};

const toneClasses: Record<NoticeTone, { box: string; accent: string }> = {
  info: { box: "bg-brand-wash", accent: "text-brand" },
  success: { box: "bg-success-bg", accent: "text-success" },
  danger: { box: "bg-danger-bg", accent: "text-danger" },
};

/**
 * Tinted message box. With a title it renders the stacked layout of "Generic Recovery
 * Confirmation" (11B); without one, the compact row of "Fictional Code Notice" (11D).
 */
export function Notice({ tone, icon: Icon, title, children, className }: NoticeProps) {
  const { box, accent } = toneClasses[tone];
  const role = tone === "danger" ? "alert" : "status";

  if (!title) {
    return (
      <div role={role} className={clsx("flex w-full items-center gap-2 rounded-nav p-2.5", box, className)}>
        {Icon && <Icon size={15} aria-hidden="true" className={clsx("shrink-0", accent)} />}
        <p className={clsx("text-[10px] font-semibold", accent)}>{children}</p>
      </div>
    );
  }

  return (
    <div role={role} className={clsx("flex w-full flex-col gap-[9px] rounded-[10px] p-4", box, className)}>
      <div className="flex items-center gap-[9px]">
        {Icon && <Icon size={20} aria-hidden="true" className={clsx("shrink-0", accent)} />}
        <p className={clsx("text-[13px] font-bold", accent)}>{title}</p>
      </div>
      <p className="text-[11px]/[15px] text-ink">{children}</p>
    </div>
  );
}
