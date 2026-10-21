import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type StateCardProps = {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  /** `state`: compact status card (06A–C). `empty`: larger empty state with a display title (07C). */
  variant?: "state" | "empty";
  /** Spins the icon, for pending states. */
  spinIcon?: boolean;
  className?: string;
};

/** Centered white card with an icon holder, a title and supporting text. */
export function StateCard({
  icon: Icon,
  title,
  children,
  variant = "state",
  spinIcon = false,
  className,
}: StateCardProps) {
  const isEmpty = variant === "empty";
  return (
    <div
      className={clsx(
        "flex w-full flex-col items-center justify-center gap-3 bg-surface text-center outline-1 -outline-offset-[0.5px] outline-line outline-solid",
        isEmpty ? "min-h-[250px] rounded-panel p-6" : "min-h-[184px] rounded-2xl p-5",
        className,
      )}
    >
      <span
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand",
          isEmpty ? "size-[72px]" : "size-[52px]",
        )}
      >
        <Icon size={isEmpty ? 32 : 25} className={clsx(spinIcon && "animate-spin")} aria-hidden="true" />
      </span>
      <h2
        className={clsx(
          "font-bold text-ink",
          isEmpty ? "font-display text-[27px] leading-none" : "text-[17px]",
        )}
      >
        {title}
      </h2>
      {children ? (
        <p
          className={clsx(
            "text-[11.5px] leading-4 text-muted",
            isEmpty ? "max-w-[280px]" : "max-w-[300px]",
          )}
        >
          {children}
        </p>
      ) : null}
    </div>
  );
}
