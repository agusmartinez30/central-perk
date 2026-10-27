import type { StaffRef } from '../domain/qr-credential.js';
import {
  disableBlock,
  normalizeTableDraft,
  removalBlock,
  tableDraftIssues,
  tableIdFor,
  type TableDraft,
  type VenueTable,
} from '../domain/table.js';
import { getFreeLayout, type TableShape } from '../domain/table-layout.js';
import type { TablesConfiguration } from '../domain/tables-configuration.js';
import { InvalidTableError, TableHasHistoryError, TableHasOpenSessionError } from '../domain/tables-errors.js';
import { findTable, issueCredential, type TablesDeps } from './tables-deps.js';

/** Spaces and tables as the admin table screens show them. */
export class GetTablesConfiguration {
  constructor(private readonly deps: TablesDeps) {}

  execute(): Promise<TablesConfiguration> {
    return this.deps.tables.load();
  }
}

function validDraft(config: TablesConfiguration, input: TableDraft, editingId: string | null): TableDraft {
  const issues = tableDraftIssues(input, config, editingId);
  if (issues.length > 0) throw new InvalidTableError(issues);
  return normalizeTableDraft(input);
}

export type NewTable = TableDraft & { shape?: TableShape };

/** Adds a table with the next number (never reused), a free spot in its space and a fresh QR credential. */
export class CreateTable {
  constructor(private readonly deps: TablesDeps) {}

  async execute({ shape, ...input }: NewTable, staff: StaffRef): Promise<TablesConfiguration> {
    const config = await this.deps.tables.load();
    const draft = validDraft(config, input, null);
    const number = (await this.deps.tables.highestTableNumber()) + 1;
    const layout = getFreeLayout(config.tables, draft.spaceId);
    const table: VenueTable = {
      id: tableIdFor(number),
      number,
      ...draft,
      version: 1,
      layout: shape ? { ...layout, shape } : layout,
      qr: await issueCredential(this.deps, staff),
      revokedQrs: [],
    };
    await this.deps.tables.saveTable(table);
    return this.deps.tables.load();
  }
}

/** Saves the form keeping number and credential; a new space re-places the table. Always bumps the version. */
export class UpdateTable {
  constructor(private readonly deps: TablesDeps) {}

  async execute(id: string, input: TableDraft): Promise<TablesConfiguration> {
    const config = await this.deps.tables.load();
    const current = findTable(config, id);
    const draft = validDraft(config, input, id);
    if (current.enabled && !draft.enabled && disableBlock(await this.deps.activity.activityOf(id))) {
      throw new TableHasOpenSessionError();
    }
    const layout =
      current.spaceId === draft.spaceId
        ? current.layout
        : getFreeLayout(
            config.tables.filter((table) => table.id !== id),
            draft.spaceId,
          );
    await this.deps.tables.saveTable({ ...current, ...draft, layout, version: current.version + 1 });
    return this.deps.tables.load();
  }
}

/** Row quick action: enabling is always allowed, disabling is refused while a session is open. */
export class SetTableEnabled {
  constructor(private readonly deps: TablesDeps) {}

  async execute(id: string, enabled: boolean): Promise<TablesConfiguration> {
    const config = await this.deps.tables.load();
    const current = findTable(config, id);
    if (current.enabled === enabled) return config;
    if (!enabled && disableBlock(await this.deps.activity.activityOf(id))) throw new TableHasOpenSessionError();
    await this.deps.tables.saveTable({ ...current, enabled, version: current.version + 1 });
    return this.deps.tables.load();
  }
}

/** Deletes a table that never had a session, revoking its QR credential. */
export class DeleteTable {
  constructor(private readonly deps: TablesDeps) {}

  async execute(id: string): Promise<TablesConfiguration> {
    findTable(await this.deps.tables.load(), id);
    const block = removalBlock(await this.deps.activity.activityOf(id));
    if (block === 'table_has_open_session') throw new TableHasOpenSessionError();
    if (block === 'table_has_history') throw new TableHasHistoryError();
    await this.deps.tables.deleteTable(id, this.deps.clock.now());
    return this.deps.tables.load();
  }
}
