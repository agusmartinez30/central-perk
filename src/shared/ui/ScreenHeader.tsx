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
  /** Table number for the trailing badge; omit to hide it. */
  table?: string;
  /** Custom trailing content, rendered instead of the table badge. */
  trailing?: ReactNode;
  className?: string;
  /** Overrides the title styles, e.g. a smaller size for longer titles. */
  titleClassName?: string;
};

const backClasses =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-ink outline-1 -outline-offset-[0.5px] outline-line outline-solid";

export function ScreenHeader({
  title,
  backHref,
  onBack,
  backLabel = "Volver",
  table,
  trailing,
  className,
  titleClassName,
}: ScreenHeaderProps) {
  const backIcon = <ArrowLeft size={19} aria-hidden="true" />;
  const back = backHref ? (
    <Link href={backHref} aria-label={backLabel} className={backClasses}>
      {backIcon}
    </Link>
  ) : onBack ? (
    <button type="button" aria-label={backLabel} onClick={onBack} className={backClasses}>
      {backIcon}
    </button>
  ) : null;

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
