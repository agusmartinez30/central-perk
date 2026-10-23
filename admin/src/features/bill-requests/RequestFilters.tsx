import clsx from "clsx";
import { ArrowDownWideNarrow, ChevronDown, Search } from "lucide-react";
import {
  PAYMENT_FILTERS,
  SORT_OPTIONS,
  STATUS_FILTERS,
  type PaymentFilter,
  type RequestSort,
  type StatusFilter,
} from "./bill-requests-view";

type RequestFiltersProps = {
  query: string;
  onQueryChange: (query: string) => void;
  sort: RequestSort;
  onSortChange: (sort: RequestSort) => void;
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  payment: PaymentFilter;
  onPaymentChange: (payment: PaymentFilter) => void;
};

const FIELD_CLASSES =
  "h-10 rounded-field bg-surface outline-1 -outline-offset-[0.5px] outline-line focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-brand";

type ChipProps = {
  label: string;
  selected: boolean;
  onSelect: () => void;
  variant: "status" | "payment";
};

/** "Filter · …" (brand when selected) and "Payment Filter · …" (ink when selected) chips. */
function Chip({ label, selected, onSelect, variant }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={clsx(
        "flex h-8 items-center rounded-nav text-[11px] whitespace-nowrap outline-1 -outline-offset-[0.5px]",
        variant === "status" ? "px-[11px]" : "px-2.5",
        selected
          ? variant === "status"
            ? "bg-brand font-bold text-white outline-brand"
            : "bg-ink font-semibold text-white outline-ink"
          : "bg-surface font-semibold text-muted outline-line hover:bg-cream",
      )}
    >
      {label}
    </button>
  );
}

/** "Request Filters": "Search and Sort" over the status and payment "Filter Groups". */
export function RequestFilters({
  query,
  onQueryChange,
  sort,
  onSortChange,
  status,
  onStatusChange,
  payment,
  onPaymentChange,
}: RequestFiltersProps) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-2.5">
      <div className="flex w-full items-center justify-between">
        <label className={clsx("flex w-[420px] items-center gap-[9px] px-3", FIELD_CLASSES)}>
          <Search size={15} aria-hidden="true" className="shrink-0 text-muted" />
          <span className="sr-only">Buscar solicitud</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar por mesa, cliente o solicitud..."
            className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
          />
        </label>
        <label className={clsx("relative flex items-center", FIELD_CLASSES)}>
          <span className="sr-only">Ordenar solicitudes</span>
          <ArrowDownWideNarrow
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 text-muted"
          />
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as RequestSort)}
            className="h-full cursor-pointer appearance-none bg-transparent pr-[33px] pl-[34px] text-[11px] font-semibold text-ink outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute right-3 text-muted" />
        </label>
      </div>
      <div className="flex w-full items-center justify-between">
        <div role="group" aria-label="Filtrar por estado" className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <Chip
              key={filter.id}
              label={filter.label}
              selected={status === filter.id}
              onSelect={() => onStatusChange(filter.id)}
              variant="status"
            />
          ))}
        </div>
        <div role="group" aria-label="Filtrar por preferencia de pago" className="flex items-center gap-1.5">
          {PAYMENT_FILTERS.map((filter) => (
            <Chip
              key={filter.id}
              label={filter.label}
              selected={payment === filter.id}
              onSelect={() => onPaymentChange(filter.id)}
              variant="payment"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
