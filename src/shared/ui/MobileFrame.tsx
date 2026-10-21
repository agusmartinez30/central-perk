import type { ReactNode } from "react";
import clsx from "clsx";

type MobileFrameProps = {
  children: ReactNode;
  className?: string;
};

/** Centers the app in a 390px-wide column, matching the mobile designs. */
export function MobileFrame({ children, className }: MobileFrameProps) {
  return (
    <div
      className={clsx(
        "relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-cream",
        className,
      )}
    >
      {children}
    </div>
  );
}
