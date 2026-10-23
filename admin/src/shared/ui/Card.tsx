import type { ReactNode } from "react";
import clsx from "clsx";

type CardProps = {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
  "aria-label"?: string;
};

/** White dashboard card with the 1px line outline and 12px radius of the exports. */
export function Card({ children, className, as: Tag = "div", ...rest }: CardProps) {
  return (
    <Tag
      className={clsx(
        "rounded-card bg-surface outline-1 -outline-offset-[0.5px] outline-line",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
