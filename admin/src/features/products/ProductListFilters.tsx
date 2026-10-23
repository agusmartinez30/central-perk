import clsx from "clsx";
import { ChevronDown, CircleCheck, Clock3, Eye, Search, Tags, type LucideIcon } from "lucide-react";
import {
  AVAILABILITY_FILTER_OPTIONS,
  CATEGORY_FILTER_OPTIONS,
  MOMENT_FILTER_OPTIONS,
  PUBLICATION_FILTER_OPTIONS,
  type FilterOption,
  type ProductFilters,
} from "./product-catalog";
import type { FilterKey } from "./products-state";

type ProductListFiltersProps = {
  filters: ProductFilters;
  onQueryChange: (query: string) => void;
  onFilterChange: <K extends FilterKey>(filter: K, value: ProductFilters[K]) => void;
};

const FIELD_CLASSES =
  "h-10 rounded-field bg-surface outline-1 -outline-offset-[0.5px] outline-line focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-brand";

type SelectFilterProps<T extends string> = {
  label: string;
  icon: LucideIcon;
  value: T;
  options: readonly FilterOption<T>[];
  onChange: (value: T) => void;
};

/** "Product Filter · …": native select with the 07A leading icon and chevron. */
function SelectFilter<T extends string>({ label, icon: Icon, value, options, onChange }: SelectFilterProps<T>) {
  return (
    <label className={clsx("relative flex items-center", FIELD_CLASSES)}>
      <span className="sr-only">{label}</span>
      <Icon size={13} aria-hidden="true" className="pointer-events-none absolute left-2.5 text-muted" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-full cursor-pointer appearance-none bg-transparent pr-7 pl-[29px] text-[11px] font-semibold text-ink outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} aria-hidden="true" className="pointer-events-none absolute right-2.5 text-muted" />
    </label>
  );
}

/** "Product List Filters": "Product Search" and the four "Product Filter Selects". */
export function ProductListFilters({ filters, onQueryChange, onFilterChange }: ProductListFiltersProps) {
  return (
    <div className="flex h-11 w-full shrink-0 items-center justify-between">
      <label className={clsx("flex w-[330px] items-center gap-2 px-[11px]", FIELD_CLASSES)}>
        <Search size={14} aria-hidden="true" className="shrink-0 text-muted" />
        <span className="sr-only">Buscar producto</span>
        <input
          type="search"
          value={filters.query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar producto..."
          className="h-full min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
        />
      </label>
      <div className="flex items-center gap-[7px]">
        <SelectFilter
          label="Categoría"
          icon={Tags}
          value={filters.category}
          options={CATEGORY_FILTER_OPTIONS}
          onChange={(value) => onFilterChange("category", value)}
        />
        <SelectFilter
          label="Momento"
          icon={Clock3}
          value={filters.moment}
          options={MOMENT_FILTER_OPTIONS}
          onChange={(value) => onFilterChange("moment", value)}
        />
        <SelectFilter
          label="Publicación"
          icon={Eye}
          value={filters.publication}
          options={PUBLICATION_FILTER_OPTIONS}
          onChange={(value) => onFilterChange("publication", value)}
        />
        <SelectFilter
          label="Disponibilidad"
          icon={CircleCheck}
          value={filters.availability}
          options={AVAILABILITY_FILTER_OPTIONS}
          onChange={(value) => onFilterChange("availability", value)}
        />
      </div>
    </div>
  );
}
