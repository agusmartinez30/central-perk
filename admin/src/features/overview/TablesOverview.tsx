import clsx from "clsx";
import type { TableSnapshot, TableStatus } from "@/mocks/types";
import { Card } from "@/shared/ui";
import { PanelHeader } from "./PanelHeader";
import { formatTablesSummary, summarizeTables } from "./overview-view";

const TABLES_PER_ROW = 4;

const TILE_STYLES: Record<TableStatus, { tile: string; number: string; state: string; label: string }> = {
  free: {
    tile: "bg-cream outline-1 -outline-offset-[0.5px] outline-line",
    number: "text-ink",
    state: "text-success",
    label: "Libre",
  },
  occupied: {
    tile: "bg-brand-wash outline-1 -outline-offset-[0.5px] outline-line",
    number: "text-brand",
    state: "text-brand",
    label: "Ocupada",
  },
  "bill-requested": {
    tile: "bg-brand-wash outline-2 -outline-offset-1 outline-danger",
    number: "text-brand",
    state: "text-danger",
    label: "Cuenta",
  },
};

function TableTile({ table }: { table: TableSnapshot }) {
  const style = TILE_STYLES[table.status];
  const number = `M${String(table.number).padStart(2, "0")}`;
  return (
    <li
      className={clsx(
        "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-nav",
        style.tile,
      )}
    >
      <span className={clsx("text-[10px] font-bold", style.number)}>{number}</span>
      <span className={clsx("text-[7px] font-semibold", style.state)}>{style.label}</span>
    </li>
  );
}

/** "Estado de las mesas" panel with the 4-column table grid. */
export function TablesOverview({ tables }: { tables: TableSnapshot[] }) {
  const rows: TableSnapshot[][] = [];
  for (let index = 0; index < tables.length; index += TABLES_PER_ROW) {
    rows.push(tables.slice(index, index + TABLES_PER_ROW));
  }

  return (
    <Card as="section" aria-label="Estado de las mesas" className="flex h-full flex-1 flex-col gap-2 p-3">
      <PanelHeader title="Estado de las mesas" linkLabel="Ver todas →" href="/tables" />
      <p className="text-[8px] text-muted">{formatTablesSummary(summarizeTables(tables))}</p>
      <Card className="flex flex-1 flex-col gap-2.5 p-3.5">
        {rows.map((row, index) => (
          <ul key={index} className="flex flex-1 gap-[7px]">
            {row.map((table) => (
              <TableTile key={table.number} table={table} />
            ))}
          </ul>
        ))}
      </Card>
    </Card>
  );
}
