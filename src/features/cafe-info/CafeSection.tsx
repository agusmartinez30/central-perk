import type { ReactNode } from "react";
import clsx from "clsx";

type CafeSectionProps = {
  title: string;
  /** Short helper line under the title. */
  hint?: string;
  /** Content at the end of the title row, e.g. the opening badge. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Section of the business detail: script title, optional hint, then its content. */
export function CafeSection({ title, hint, aside, children, className }: CafeSectionProps) {
  return (
    <section aria-label={title} className={clsx("flex w-full flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-[23px] leading-none font-bold text-ink">{title}</h2>
          {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
