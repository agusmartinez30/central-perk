import clsx from "clsx";
import { ArrowDownWideNarrow, ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import {
  PAYMENT_FILTERS,
  SORT_OPTIONS,
  type PaymentFilter,
  type RequestSort,
  type StatusFilter,
} from "./bill-requests-view";

type RequestToolbarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  sort: RequestSort;
  onSortChange: (sort: RequestSort) => void;
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  payment: PaymentFilter;
  onPaymentChange: (payment: PaymentFilter) => void;
};

const QUICK_FILTERS: readonly { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes" },
  { id: "attending", label: "En atención" },
  { id: "payment-review", label: "Por verificar" },
];

const CONTROL =
  "h-[34px] rounded-[7px] focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand";

/** Compact operational toolbar: search, status shortcuts, payment filter and deterministic sort. */
export function RequestToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  status,
  onStatusChange,
  payment,
  onPaymentChange,
}: RequestToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Filtros de solicitudes"
      className="flex h-[46px] w-full shrink-0 items-center gap-2 rounded-[10px] bg-surface px-2 py-1.5 outline-1 -outline-offset-[0.5px] outline-line"
    >
      <label className="flex h-[34px] w-[310px] shrink-0 items-center gap-2 rounded-[7px] bg-cream px-2.5 focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-brand">
        <Search size={15} aria-hidden="true" className="shrink-0 text-muted" />
        <span className="sr-only">Buscar por mesa, cliente o solicitud</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Mesa, cliente o solicitud…"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
        />
      </label>
      <div role="group" aria-label="Filtrar por estado" className="flex items-center gap-2">
        {QUICK_FILTERS.map((filter) => {
          const selected = status === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onStatusChange(filter.id)}
              className={clsx(
                CONTROL,
                "shrink-0 px-2.5 text-[10px] font-extrabold whitespace-nowrap outline-1 -outline-offset-[0.5px]",
                selected ? "bg-brand-wash text-brand outline-brand/20" : "bg-surface text-muted outline-line hover:bg-cream",
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      <label className="relative flex shrink-0 items-center">
        <span className="sr-only">Filtrar por preferencia de pago</span>
        <SlidersHorizontal size={14} aria-hidden="true" className="pointer-events-none absolute left-2.5 z-[1] text-muted" />
        <select
          value={payment}
          onChange={(event) => onPaymentChange(event.target.value as PaymentFilter)}
          className={clsx(
            CONTROL,
            "max-w-[116px] cursor-pointer appearance-none bg-surface pr-7 pl-8 text-[10px] font-bold text-muted outline-1 -outline-offset-[0.5px] outline-line",
          )}
        >
          {PAYMENT_FILTERS.map((filter) => (
            <option key={filter.id} value={filter.id}>
              {filter.id === "all" ? "Más filtros" : filter.label}
            </option>
          ))}
        </select>
        <ChevronDown size={12} aria-hidden="true" className="pointer-events-none absolute right-2.5 text-muted" />
      </label>
      <label className="relative ml-auto flex shrink-0 items-center">
        <span className="sr-only">Ordenar solicitudes</span>
        <ArrowDownWideNarrow size={14} aria-hidden="true" className="pointer-events-none absolute left-2.5 z-[1] text-muted" />
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as RequestSort)}
          className={clsx(
            CONTROL,
            "cursor-pointer appearance-none bg-cream pr-7 pl-8 text-[10px] font-bold text-muted",
          )}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={12} aria-hidden="true" className="pointer-events-none absolute right-2.5 text-muted" />
      </label>
    </div>
  );
}
