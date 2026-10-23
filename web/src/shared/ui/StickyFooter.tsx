import type { ReactNode } from "react";
import clsx from "clsx";

type StickyFooterProps = {
  children: ReactNode;
  /** `plain`: cream bar with a top border. `raised`: white bar with an upward shadow. */
  variant?: "plain" | "raised";
  className?: string;
};

export function StickyFooter({ children, variant = "plain", className }: StickyFooterProps) {
  return (
    <div
      className={clsx(
        "sticky bottom-0 z-20 mt-auto w-full px-4 pt-2.5 pb-[max(16px,env(safe-area-inset-bottom))]",
        variant === "plain" ? "border-t border-line bg-cream" : "bg-surface shadow-bar",
        className,
      )}
    >
      {children}
    </div>
  );
}
