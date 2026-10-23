import clsx from "clsx";
import { Grid2x2, List, Search, type LucideIcon } from "lucide-react";
import { TABLE_FILTERS, type TableFilter } from "./tables-view";

export type TablesView = "grid" | "list";

type SearchAndFiltersProps = {
  query: string;
  onQueryChange: (query: string) => void;
  filter: TableFilter;
  onFilterChange: (filter: TableFilter) => void;
  counts: Record<TableFilter, number>;
  view: TablesView;
  onViewChange: (view: TablesView) => void;
};

const VIEW_OPTIONS: readonly { id: TablesView; label: string; icon: LucideIcon }[] = [
  { id: "grid", label: "Vista en cuadrícula", icon: Grid2x2 },
  { id: "list", label: "Vista en lista", icon: List },
];

/** "Search and Filters" row: "Buscar mesa", "Status Chips" and the "Selector de vista". */
export function SearchAndFilters({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  counts,
  view,
  onViewChange,
}: SearchAndFiltersProps) {
  return (
    <div className="flex h-10 w-full shrink-0 items-center justify-between">
      <div className="flex items-center gap-3">
        <label className="flex h-10 w-[250px] items-center gap-2.5 rounded-[10px] bg-surface px-3.5 outline-1 -outline-offset-[0.5px] outline-line focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-brand">
          <Search size={17} aria-hidden="true" className="shrink-0 text-muted" />
          <span className="sr-only">Buscar mesa</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar mesa..."
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
          />
        </label>
        <div role="group" aria-label="Filtrar por estado" className="flex items-center gap-1.5">
          {TABLE_FILTERS.map((chip) => {
            const active = chip.id === filter;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={active}
                aria-label={`${chip.label} (${counts[chip.id]})`}
                onClick={() => onFilterChange(chip.id)}
                className={clsx(
                  "flex h-[34px] items-center rounded-[18px] px-3.5 text-[13px] font-bold whitespace-nowrap outline-1 -outline-offset-[0.5px] transition-colors",
                  active
                    ? "bg-brand text-white outline-brand"
                    : "bg-surface text-muted outline-line hover:text-ink",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        role="group"
        aria-label="Selector de vista"
        className="flex h-10 w-[88px] shrink-0 items-center gap-0.5 rounded-[10px] bg-sand p-[3px]"
      >
        {VIEW_OPTIONS.map(({ id, label, icon: Icon }) => {
          const active = id === view;
          return (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={active}
              onClick={() => onViewChange(id)}
              className={clsx(
                "flex h-[34px] w-[39px] items-center justify-center rounded-nav",
                active ? "bg-surface text-brand" : "bg-sand text-muted hover:text-ink",
              )}
            >
              <Icon size={16} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
