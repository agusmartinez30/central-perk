"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Armchair } from "lucide-react";
import { TABLES_BOARD } from "@/mocks/service-day";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { SearchAndFilters, type TablesView } from "./SearchAndFilters";
import { TableBoard } from "./TableBoard";
import { TableDetailPanel } from "./TableDetailPanel";
import { SummaryMetrics, TablesHeader } from "./TablesHeader";
import { countTablesByFilter, filterTables, getSummaryMetrics, type TableFilter } from "./tables-view";

/**
 * Forced variants: `empty` (no tables configured yet) and `no-results` (search with no match).
 * Their copy is not in the 02 export.
 */
export const TABLES_FORCED_STATES = ["empty", "no-results"] as const;

/** Query that `?state=no-results` pre-fills: no table has that number. */
const NO_RESULTS_QUERY = "Mesa 99";

/**
 * 02 · Gestión de mesas. Container: owns filters, search, view mode and the selected table,
 * and feeds the presentational pieces from the `TABLES_BOARD` derived from the service day.
 */
export function TablesScreen() {
  const forcedState = useScreenState(TABLES_FORCED_STATES);
  const board = TABLES_BOARD;
  const tables = useMemo(() => (forcedState === "empty" ? [] : board.tables), [forcedState, board.tables]);

  const [filter, setFilter] = useState<TableFilter>("all");
  const [query, setQuery] = useState(() => (forcedState === "no-results" ? NO_RESULTS_QUERY : ""));
  const [view, setView] = useState<TablesView>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    forcedState ? null : board.selectedTableId,
  );

  const visibleTables = useMemo(() => filterTables(tables, { filter, query }), [tables, filter, query]);
  const selectedTable = tables.find((table) => table.id === selectedId) ?? null;

  const clearFilters = () => {
    setFilter("all");
    setQuery("");
  };

  const emptyState =
    tables.length === 0
      ? {
          icon: Armchair,
          title: "Todavía no hay mesas habilitadas",
          description: "Cuando habilites mesas desde Mesas y códigos QR, vas a verlas acá.",
        }
      : {
          title: "No encontramos mesas",
          description: "Probá con otro número de mesa o cambiá el filtro de estado.",
          action: { label: "Limpiar búsqueda y filtros", onClick: clearFilters },
        };

  return (
    <div className="flex flex-1 flex-col gap-2.5 px-7 pt-5 pb-3">
      <TablesHeader syncedAt={board.syncedAt} />
      <SummaryMetrics metrics={getSummaryMetrics(tables)} />
      <SearchAndFilters
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        counts={countTablesByFilter(tables)}
        view={view}
        onViewChange={setView}
      />
      {/* With the quick-detail panel open the board shrinks to the 860px of the export. */}
      <div className={clsx("flex flex-1 flex-col", selectedTable ? "w-[860px]" : "w-full")}>
        <TableBoard
          tables={visibleTables}
          view={view}
          selectedId={selectedId}
          onSelect={setSelectedId}
          emptyState={emptyState}
        />
      </div>
      {selectedTable && <TableDetailPanel table={selectedTable} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
