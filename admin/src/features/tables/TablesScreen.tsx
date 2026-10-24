"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Armchair } from "lucide-react";
import { SERVICE_DAY, TABLES_BOARD } from "@/mocks/service-day";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { FloorPlan } from "./FloorPlan";
import { getPlanSummary, getSpacePlan, getSpaceTabs, type PlanTransform } from "./floor-plan";
import { TableBoard } from "./TableBoard";
import { TableDetailPanel } from "./TableDetailPanel";
import { PlanToolbar, TablesHeader, type TablesView } from "./TablesHeader";
import { filterTables } from "./tables-view";

/**
 * Forced variants: `empty` (no tables configured yet), `no-results` (search with no match),
 * `list` (the "Lista" view) and `terraza` (the Terraza plan). Only the plan of Salón with Mesa
 * 05 selected is in the 02 export.
 */
export const TABLES_FORCED_STATES = ["empty", "no-results", "list", "terraza"] as const;

/** Query that `?state=no-results` pre-fills: no table has that number. */
const NO_RESULTS_QUERY = "Mesa 99";

const DEFAULT_TRANSFORM: PlanTransform = { scale: 1, x: 0, y: 0 };

/**
 * 02 · Gestión de mesas. Container: owns the active space, view, search, zoom and the selected
 * table. Spaces, layout and capacities come from the 09 configuration of the service day; the
 * live state (status, account, time seated, kitchen) from `TABLES_BOARD`.
 */
export function TablesScreen() {
  const forcedState = useScreenState(TABLES_FORCED_STATES);
  const board = TABLES_BOARD;
  const { spaces } = SERVICE_DAY;
  const config = useMemo(() => (forcedState === "empty" ? [] : SERVICE_DAY.tables), [forcedState]);
  const live = useMemo(() => (forcedState === "empty" ? [] : board.tables), [forcedState, board.tables]);

  const [spaceId, setSpaceId] = useState(() => (forcedState === "terraza" ? "terraza" : (spaces[0]?.id ?? "")));
  const [view, setView] = useState<TablesView>(() => (forcedState === "list" ? "list" : "plan"));
  const [query, setQuery] = useState(() => (forcedState === "no-results" ? NO_RESULTS_QUERY : ""));
  const [transform, setTransform] = useState(DEFAULT_TRANSFORM);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    forcedState === "empty" || forcedState === "no-results" ? null : board.selectedTableId,
  );

  const plan = getSpacePlan(spaceId, config, live, query);
  const matches = filterTables(live, { filter: "all", query });
  const selectedTable = live.find((table) => table.id === selectedId) ?? null;
  const spaceName = spaces.find((space) => space.id === spaceId)?.name ?? "";
  const clearSearch = () => setQuery("");

  const planNotice =
    live.length === 0
      ? { title: "Todavía no hay mesas habilitadas" }
      : matches.length === 0
        ? { title: "No encontramos mesas", action: { label: "Limpiar búsqueda", onClick: clearSearch } }
        : plan.length === 0
          ? { title: `No hay mesas en ${spaceName}` }
          : null;

  return (
    // With the quick-detail panel open the content keeps the export's 900px column.
    <div
      className={clsx(
        "flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-3.5 px-6 pt-5 pb-4",
        selectedTable ? "w-[900px]" : "w-full",
      )}
    >
      <TablesHeader syncedAt={board.syncedAt} />
      <PlanToolbar
        summary={getPlanSummary(live)}
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={(next) => {
          // Back on the plan, show the space of the table picked in the list.
          const space = config.find((table) => table.number === selectedTable?.number)?.spaceId;
          if (next === "plan" && space && space !== spaceId) {
            setSpaceId(space);
            setTransform(DEFAULT_TRANSFORM);
          }
          setView(next);
        }}
      />
      {view === "plan" ? (
        <FloorPlan
          spaceName={spaceName}
          tables={plan}
          tabs={getSpaceTabs(spaces, config)}
          activeSpaceId={spaceId}
          selectedId={selectedId}
          transform={transform}
          notice={planNotice}
          onSelect={setSelectedId}
          onSpaceChange={(id) => {
            setSpaceId(id);
            setTransform(DEFAULT_TRANSFORM);
          }}
          onTransformChange={setTransform}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <TableBoard
            tables={matches}
            view="list"
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyState={
              live.length === 0
                ? {
                    icon: Armchair,
                    title: "Todavía no hay mesas habilitadas",
                    description: "Cuando habilites mesas desde Mesas y códigos QR, vas a verlas acá.",
                  }
                : {
                    title: "No encontramos mesas",
                    description: "Probá con otro número de mesa.",
                    action: { label: "Limpiar búsqueda", onClick: clearSearch },
                  }
            }
          />
        </div>
      )}
      {selectedTable && <TableDetailPanel table={selectedTable} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
