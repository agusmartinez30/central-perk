import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPageItems } from "@/shared/lib/pagination";

const PAGE_BUTTON = "flex size-[30px] shrink-0 items-center justify-center rounded-[7px] text-[11px] font-bold";
const IDLE_PAGE = "bg-surface text-muted outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream";

export type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

/** Previous/next arrows (sand when unavailable) and numbered pages. */
export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  const arrow = (direction: "previous" | "next") => {
    const target = direction === "previous" ? page - 1 : page + 1;
    const disabled = target < 1 || target > pageCount;
    const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onPageChange(target)}
        aria-label={direction === "previous" ? "Página anterior" : "Página siguiente"}
        className={clsx(PAGE_BUTTON, disabled ? "bg-sand text-muted" : clsx(IDLE_PAGE, "text-ink"))}
      >
        <Icon size={13} aria-hidden="true" />
      </button>
    );
  };

  return (
    <nav aria-label="Paginación" className="flex items-center gap-1.5">
      {arrow("previous")}
      {getPageItems(page, pageCount).map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} aria-hidden="true" className={clsx(PAGE_BUTTON, IDLE_PAGE)}>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-label={`Página ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={clsx(
              PAGE_BUTTON,
              item === page ? "bg-brand text-white outline-1 -outline-offset-[0.5px] outline-brand" : IDLE_PAGE,
            )}
          >
            {item}
          </button>
        ),
      )}
      {arrow("next")}
    </nav>
  );
}
