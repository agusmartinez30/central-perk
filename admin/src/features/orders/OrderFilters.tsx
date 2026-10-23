import clsx from "clsx";
import { Armchair, ChevronDown, Search } from "lucide-react";
import type { TableOption } from "./orders-view";

type OrderFiltersProps = {
  tableOptions: TableOption[];
  table: TableOption["value"];
  onTableChange: (table: TableOption["value"]) => void;
  query: string;
  onQueryChange: (query: string) => void;
  showDelivered: boolean;
  onShowDeliveredChange: (show: boolean) => void;
};

const FIELD_CLASSES =
  "h-10 rounded-[10px] bg-surface outline-1 -outline-offset-[0.5px] outline-line focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-brand";

/** "Filters" row: "Table Selector", "Order Search" and the "Delivered Toggle". */
export function OrderFilters({
  tableOptions,
  table,
  onTableChange,
  query,
  onQueryChange,
  showDelivered,
  onShowDeliveredChange,
}: OrderFiltersProps) {
  return (
    <div className="flex h-12 w-full shrink-0 items-center justify-between">
      <div className="flex items-center gap-2.5">
        <label className={clsx("relative flex w-[190px] items-center", FIELD_CLASSES)}>
          <span className="sr-only">Filtrar por mesa</span>
          <Armchair size={16} aria-hidden="true" className="pointer-events-none absolute left-3 text-muted" />
          <select
            value={String(table)}
            onChange={(event) =>
              onTableChange(event.target.value === "all" ? "all" : Number(event.target.value))
            }
            className="h-full w-full cursor-pointer appearance-none bg-transparent pr-9 pl-[37px] text-[12px] font-semibold text-ink outline-none"
          >
            {tableOptions.map((option) => (
              <option key={option.value} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute right-3 text-muted"
          />
        </label>
        <label className={clsx("flex w-[250px] items-center gap-[9px] px-3", FIELD_CLASSES)}>
          <Search size={16} aria-hidden="true" className="shrink-0 text-muted" />
          <span className="sr-only">Buscar pedido</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar por número..."
            className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
          />
        </label>
      </div>
      <label className="flex cursor-pointer items-center gap-[9px]">
        <span className="text-[12px] font-semibold whitespace-nowrap text-ink">Mostrar entregados</span>
        <button
          type="button"
          role="switch"
          aria-checked={showDelivered}
          onClick={() => onShowDeliveredChange(!showDelivered)}
          className={clsx(
            "flex h-5 w-9 items-center rounded-[10px] p-0.5 transition-colors",
            showDelivered ? "justify-end bg-brand" : "justify-start bg-line",
          )}
        >
          <span aria-hidden="true" className="size-4 rounded-full bg-surface" />
        </button>
      </label>
    </div>
  );
}
