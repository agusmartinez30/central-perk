import clsx from "clsx";
import { ArrowRight, ChevronLeft, ChevronRight, ReceiptText, SearchX, type LucideIcon } from "lucide-react";
import type { ManagedCollection } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";
import { formatCollectionDate, formatTableLabel, getPageItems } from "./collections-view";
import { PaymentMethodChip, PaymentStatusPill } from "./CollectionTags";

/** Widths of the "History Header · …" cells; "Acción" takes the rest of the row. */
const COLUMNS = [
  { label: "Fecha y hora", width: "w-[160px]" },
  { label: "Mesa", width: "w-[86px]" },
  { label: "Operación", width: "w-[126px]" },
  { label: "Medio de pago", width: "w-[150px]" },
  { label: "Importe", width: "w-[120px]" },
  { label: "Empleado", width: "w-[110px]" },
  { label: "Estado", width: "w-[120px]" },
  { label: "Acción", width: "" },
] as const;

export type TableEmptyState = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};

export const NO_COLLECTIONS_ICON = ReceiptText;
export const NO_RESULTS_ICON = SearchX;

type PaymentHistoryTableProps = {
  collections: ManagedCollection[];
  emptyState: TableEmptyState | null;
  /** "History Result Count". */
  resultCount: string;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onViewDetail: (id: string) => void;
};

const CELL = "px-3 align-middle";

/** "History · COB-NNNN" row. */
function PaymentRow({
  collection,
  onViewDetail,
}: { collection: ManagedCollection } & Pick<PaymentHistoryTableProps, "onViewDetail">) {
  return (
    <tr className="h-[62px] border-b border-line bg-surface">
      <td className={clsx(CELL, "text-[12px] font-semibold whitespace-nowrap text-ink")}>
        {formatCollectionDate(collection)}
        <br />
        {collection.time}
      </td>
      <td className={clsx(CELL, "text-[12px] font-bold whitespace-nowrap text-ink")}>{formatTableLabel(collection)}</td>
      <th scope="row" className={clsx(CELL, "text-left text-[12px] font-bold whitespace-nowrap text-brand")}>
        {collection.id}
      </th>
      <td className={CELL}>
        <PaymentMethodChip method={collection.method} />
      </td>
      <td className={clsx(CELL, "text-[13px] font-bold whitespace-nowrap text-ink")}>{formatPrice(collection.amount)}</td>
      <td className={clsx(CELL, "text-[12px] font-semibold whitespace-nowrap text-ink")}>{collection.confirmedBy}</td>
      <td className={CELL}>
        <PaymentStatusPill status={collection.status} />
      </td>
      <td className={CELL}>
        <button
          type="button"
          onClick={() => onViewDetail(collection.id)}
          aria-label={`Ver detalle ${collection.id}`}
          className="flex h-[34px] items-center gap-[7px] rounded-nav bg-surface px-[11px] text-[11px] font-bold whitespace-nowrap text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
        >
          Ver detalle
          <ArrowRight size={13} aria-hidden="true" className="shrink-0 text-brand" />
        </button>
      </td>
    </tr>
  );
}

function EmptyState({ icon: Icon, title, description, action }: TableEmptyState) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <Icon size={28} aria-hidden="true" className="text-muted" />
      <p className="text-[14px] font-bold text-ink">{title}</p>
      <p className="max-w-[360px] text-[12px] text-muted">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 flex h-[34px] items-center rounded-nav px-3 text-[11px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

const PAGE_BUTTON = "flex size-[30px] shrink-0 items-center justify-center rounded-[7px] text-[11px] font-bold";
const IDLE_PAGE = "bg-surface text-muted outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream";

/** "Server Pagination": previous/next arrows (sand when unavailable) and numbered pages. */
function Pagination({ page, pageCount, onPageChange }: Pick<PaymentHistoryTableProps, "page" | "pageCount" | "onPageChange">) {
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

/**
 * "Payment History Data Table": sand "History Table Header", one row per collection of the
 * current page and the "History Pagination" filling the rest of the card.
 */
export function PaymentHistoryTable({
  collections,
  emptyState,
  resultCount,
  page,
  pageCount,
  onPageChange,
  onViewDetail,
}: PaymentHistoryTableProps) {
  return (
    <section
      aria-label="Historial de cobros"
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-card bg-surface outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div className="min-h-0 shrink overflow-y-auto">
        <table className="w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-[1] bg-sand">
            <tr className="h-[42px]">
              {COLUMNS.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={clsx("px-3 text-left text-[11px] font-bold whitespace-nowrap text-muted", column.width)}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          {!emptyState && (
            <tbody>
              {collections.map((collection) => (
                <PaymentRow key={collection.id} collection={collection} onViewDetail={onViewDetail} />
              ))}
            </tbody>
          )}
        </table>
      </div>
      {emptyState && <EmptyState {...emptyState} />}
      <footer
        className={clsx(
          "flex min-h-11 w-full items-center justify-between px-3.5",
          emptyState ? "shrink-0" : "flex-1",
        )}
      >
        <p className="text-[11px] font-semibold whitespace-nowrap text-muted">{resultCount}</p>
        <Pagination page={page} pageCount={pageCount} onPageChange={onPageChange} />
      </footer>
    </section>
  );
}
