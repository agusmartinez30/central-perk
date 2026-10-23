import clsx from "clsx";
import {
  ArrowDownWideNarrow,
  CalendarRange,
  ChevronDown,
  CreditCard,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  METHOD_FILTERS,
  PERIOD_FILTERS,
  SORT_OPTIONS,
  type CollectionPeriod,
  type CollectionSort,
  type MethodFilter,
  type StaffFilter,
} from "./collections-view";

type PaymentHistoryFiltersProps = {
  period: CollectionPeriod;
  onPeriodChange: (period: CollectionPeriod) => void;
  /** "Custom Date Range" label of the selected period. */
  rangeLabel: string;
  query: string;
  onQueryChange: (query: string) => void;
  method: MethodFilter;
  onMethodChange: (method: MethodFilter) => void;
  staff: StaffFilter;
  staffOptions: readonly { id: StaffFilter; label: string }[];
  onStaffChange: (staff: StaffFilter) => void;
  sort: CollectionSort;
  onSortChange: (sort: CollectionSort) => void;
};

const FIELD_CLASSES =
  "h-10 rounded-field bg-surface outline-1 -outline-offset-[0.5px] outline-line focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-brand";

type SelectFilterProps<T extends string> = {
  label: string;
  icon: LucideIcon;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (value: T) => void;
};

/** "History Filter · …": native select with the 05 leading icon and chevron. */
function SelectFilter<T extends string>({ label, icon: Icon, value, options, onChange }: SelectFilterProps<T>) {
  return (
    <label className={clsx("relative flex items-center", FIELD_CLASSES)}>
      <span className="sr-only">{label}</span>
      <Icon size={13} aria-hidden="true" className="pointer-events-none absolute left-[11px] text-muted" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-full cursor-pointer appearance-none bg-transparent pr-[30px] pl-[31px] text-[11px] font-semibold text-ink outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} aria-hidden="true" className="pointer-events-none absolute right-[11px] text-muted" />
    </label>
  );
}

/** "Payment History Filters": "Quick Date Filters" over "History Search and Filters". */
export function PaymentHistoryFilters({
  period,
  onPeriodChange,
  rangeLabel,
  query,
  onQueryChange,
  method,
  onMethodChange,
  staff,
  staffOptions,
  onStaffChange,
  sort,
  onSortChange,
}: PaymentHistoryFiltersProps) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-2.5">
      <div className="flex items-center gap-[7px]">
        <div role="group" aria-label="Período" className="flex items-center gap-[7px]">
          {PERIOD_FILTERS.map((filter) => {
            const selected = period === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onPeriodChange(filter.id)}
                className={clsx(
                  "flex h-8 items-center rounded-nav px-[11px] text-[11px] font-bold whitespace-nowrap outline-1 -outline-offset-[0.5px]",
                  selected ? "bg-brand text-white outline-brand" : "bg-surface text-muted outline-line hover:bg-cream",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        {/* The custom range picker is not designed: the control only shows the selected period. */}
        <p
          aria-label={`Rango de fechas: ${rangeLabel}`}
          className="flex h-8 items-center gap-2 rounded-field bg-surface px-3 outline-1 -outline-offset-[0.5px] outline-line"
        >
          <CalendarRange size={15} aria-hidden="true" className="shrink-0 text-muted" />
          <span className="text-[11px] font-semibold whitespace-nowrap text-ink">{rangeLabel}</span>
          <ChevronDown size={13} aria-hidden="true" className="shrink-0 text-muted" />
        </p>
      </div>
      <div className="flex w-full items-center justify-between">
        <label className={clsx("flex w-[410px] items-center gap-[9px] px-3", FIELD_CLASSES)}>
          <Search size={15} aria-hidden="true" className="shrink-0 text-muted" />
          <span className="sr-only">Buscar cobro</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar mesa, cuenta u operación..."
            className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
          />
        </label>
        <div className="flex items-center gap-2">
          <SelectFilter
            label="Filtrar por medio de pago"
            icon={CreditCard}
            value={method}
            options={METHOD_FILTERS}
            onChange={onMethodChange}
          />
          <SelectFilter
            label="Filtrar por empleado"
            icon={Users}
            value={staff}
            options={staffOptions}
            onChange={onStaffChange}
          />
          <SelectFilter
            label="Ordenar operaciones"
            icon={ArrowDownWideNarrow}
            value={sort}
            options={SORT_OPTIONS}
            onChange={onSortChange}
          />
        </div>
      </div>
    </div>
  );
}
