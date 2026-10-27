import { rotateCredential, type StaffRef } from '../domain/qr-credential.js';
import { resolvePublicTable, type PublicTable, type TablesConfiguration } from '../domain/tables-configuration.js';
import { TableNotFoundError } from '../domain/tables-errors.js';
import { findTable, issueCredential, type TablesDeps } from './tables-deps.js';

/** Revokes the table's active QR (its printed code stops working) with the next audit number and issues a new one. */
export class RegenerateTableQr {
  constructor(private readonly deps: TablesDeps) {}

  async execute(id: string, staff: StaffRef): Promise<TablesConfiguration> {
    const table = findTable(await this.deps.tables.load(), id);
    const auditNumber = (await this.deps.tables.highestAuditNumber()) + 1;
    const issued = await issueCredential(this.deps, staff);
    const rotated = rotateCredential(table, issued, this.deps.clock.now(), auditNumber);
    await this.deps.tables.saveTable({ ...rotated, version: table.version + 1 });
    return this.deps.tables.load();
  }
}

/** Public: the table a scanned QR (`?mesa=07&qr=<token>`) belongs to; not found when disabled, rotated or unknown. */
export class ResolveTableQr {
  constructor(private readonly deps: TablesDeps) {}

  async execute({ number, token }: { number: number; token: string }): Promise<PublicTable> {
    const table = resolvePublicTable(await this.deps.tables.load(), number, token);
    if (!table) throw new TableNotFoundError();
    return table;
  }
}
