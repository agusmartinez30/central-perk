import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type StateCardProps = {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  /**
   * `state`: compact status card (06A–C). `empty`: larger empty state with a display title (07C).
   * `section`: small sand placeholder for an empty section inside a screen (business detail).
   */
  variant?: "state" | "empty" | "section";
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
  if (variant === "section") {
    return (
      <div className={clsx("flex w-full flex-col items-center gap-[7px] rounded-2xl bg-sand p-[18px] text-center", className)}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
          <Icon size={19} aria-hidden="true" />
        </span>
        <h3 className="text-[13px] font-bold text-ink">{title}</h3>
        {children ? <p className="text-[11px] leading-[15px] text-muted">{children}</p> : null}
      </div>
    );
  }

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
