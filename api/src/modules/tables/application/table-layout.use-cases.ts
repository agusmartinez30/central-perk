import type { VenueTable } from '../domain/table.js';
import {
  resolveMove,
  resolveResize,
  sameLayout,
  type LayoutResult,
  type PlanPoint,
  type PlanRect,
  type TableShape,
} from '../domain/table-layout.js';
import type { TablesConfiguration } from '../domain/tables-configuration.js';
import { TableOverlapError } from '../domain/tables-errors.js';
import { findTable, type TablesDeps } from './tables-deps.js';

/** Saves a resolved layout bumping the version; an unchanged layout keeps it, an overlap is refused. */
async function saveLayout(
  deps: TablesDeps,
  config: TablesConfiguration,
  table: VenueTable,
  result: LayoutResult<VenueTable>,
): Promise<TablesConfiguration> {
  if (!result.ok) {
    const { id, number, label } = result.conflict;
    throw new TableOverlapError({ id, number, label });
  }
  if (sameLayout(table.layout, result.layout)) return config;
  await deps.tables.saveTable({ ...table, layout: result.layout, version: table.version + 1 });
  return deps.tables.load();
}

/** Drops a table at a point of its plan: snapped to the grid and kept inside the plan. */
export class MoveTable {
  constructor(private readonly deps: TablesDeps) {}

  async execute(id: string, point: PlanPoint): Promise<TablesConfiguration> {
    const config = await this.deps.tables.load();
    const table = findTable(config, id);
    return saveLayout(this.deps, config, table, resolveMove(config.tables, table, point));
  }
}

/** Resizes a table's box: at least what its chairs need, inside the plan. */
export class ResizeTable {
  constructor(private readonly deps: TablesDeps) {}

  async execute(id: string, rect: PlanRect): Promise<TablesConfiguration> {
    const config = await this.deps.tables.load();
    const table = findTable(config, id);
    return saveLayout(this.deps, config, table, resolveResize(config.tables, table, rect));
  }
}

export class SetTableShape {
  constructor(private readonly deps: TablesDeps) {}

  async execute(id: string, shape: TableShape): Promise<TablesConfiguration> {
    const config = await this.deps.tables.load();
    const table = findTable(config, id);
    return saveLayout(this.deps, config, table, { ok: true, layout: { ...table.layout, shape } });
  }
}
