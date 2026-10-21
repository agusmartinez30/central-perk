import type { ReactNode } from "react";
import clsx from "clsx";

type BottomDockProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Fixed bottom area aligned with the 390px MobileFrame column. It hosts the floating
 * cart CTA and the bottom navigation; pages must reserve space with bottom padding.
 */
export function BottomDock({ children, className }: BottomDockProps) {
  return (
    <div
      className={clsx(
        "pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[390px] flex-col gap-5 px-4 pb-[max(8px,env(safe-area-inset-bottom))] *:pointer-events-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
