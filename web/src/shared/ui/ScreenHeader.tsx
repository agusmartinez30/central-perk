import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { TableBadge } from "./TableBadge";

type ScreenHeaderProps = {
  title: string;
  /** Back navigation target; when omitted, `onBack` is used instead. */
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  /** View transition types for the back link, e.g. `NAV_BACK` to slide back. */
  backTransitionTypes?: string[];
  /** Table number for the trailing badge; omit to hide it. */
  table?: string;
  /** Custom trailing content, rendered instead of the table badge. */
  trailing?: ReactNode;
  className?: string;
  /** Overrides the title styles, e.g. a smaller size for longer titles. */
  titleClassName?: string;
  /** `display`: script title next to the back button. `centered`: small centered title (business detail). */
  variant?: "display" | "centered";
};

const backBase =
  "flex shrink-0 items-center justify-center rounded-full bg-surface text-ink outline-1 -outline-offset-[0.5px] outline-line outline-solid";

export function ScreenHeader({
  title,
  backHref,
  onBack,
  backLabel = "Volver",
  backTransitionTypes,
  table,
  trailing,
  className,
  titleClassName,
  variant = "display",
}: ScreenHeaderProps) {
  const centered = variant === "centered";
  const backClasses = clsx(backBase, centered ? "size-11" : "size-10");
  const backIcon = <ArrowLeft size={centered ? 20 : 19} aria-hidden="true" />;
  const back = backHref ? (
    <Link
      href={backHref}
      aria-label={backLabel}
      transitionTypes={backTransitionTypes}
      className={backClasses}
    >
      {backIcon}
    </Link>
  ) : onBack ? (
    <button type="button" aria-label={backLabel} onClick={onBack} className={backClasses}>
      {backIcon}
    </button>
  ) : null;

  if (centered) {
    return (
      <header className={clsx("flex h-16 w-full items-center justify-between px-4 py-2", className)}>
        {back ?? <span className="size-11 shrink-0" aria-hidden="true" />}
        <h1 className={clsx("truncate px-2 text-[16px] font-bold text-ink", titleClassName)}>{title}</h1>
        {/* Balances the back button so the title stays centered. */}
        {trailing ?? <span className="size-11 shrink-0" aria-hidden="true" />}
      </header>
    );
  }

  return (
    <header className={clsx("flex h-12 w-full items-center justify-between px-4", className)}>
      <div className="flex min-w-0 items-center gap-[11px]">
        {back}
        <h1
          className={clsx(
            "truncate font-display text-[31px] leading-none font-bold text-ink",
            titleClassName,
          )}
        >
          {title}
        </h1>
      </div>
      {trailing ?? (table ? <TableBadge table={table} /> : null)}
    </header>
  );
}
