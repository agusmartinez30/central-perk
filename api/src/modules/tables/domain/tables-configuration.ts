import type { Space } from './space.js';
import type { TableActivitySnapshot, VenueTable } from './table.js';

/** The venue's table configuration: spaces in display order and tables by number. */
export interface TablesConfiguration {
  spaces: Space[];
  tables: VenueTable[];
}

/** What a customer's QR scan learns about its table. */
export interface PublicTable {
  number: number;
  label: string;
  spaceName: string;
}

/** The table only when it is enabled and `token` is its active credential; otherwise `null`, without saying why. */
export function resolvePublicTable(config: TablesConfiguration, number: number, token: string): PublicTable | null {
  const table = config.tables.find((candidate) => candidate.number === number);
  if (!table || !table.enabled || table.qr?.token !== token) return null;
  const space = config.spaces.find((candidate) => candidate.id === table.spaceId);
  return { number: table.number, label: table.label, spaceName: space?.name ?? '' };
}

export interface TablesRepository {
  load(): Promise<TablesConfiguration>;
  /** Saves names, styles and order (the array order); spaces missing from the list are deleted. */
  saveSpaces(spaces: readonly Space[]): Promise<void>;
  /** Creates or updates the table with its layout and credentials (new tokens are added, newly revoked ones updated). */
  saveTable(table: VenueTable): Promise<void>;
  /** Deletes the table and revokes its active credential; credentials are kept so tokens and numbers are never reused. */
  deleteTable(id: string, revokedAt: Date): Promise<void>;
  /** Highest table number ever used, deleted tables included; 0 when none. */
  highestTableNumber(): Promise<number>;
  /** Highest audit number of a QR rotation; 0 when none. */
  highestAuditNumber(): Promise<number>;
  /** Whether any credential ever issued (active or revoked) carries the token. */
  isTokenTaken(token: string): Promise<boolean>;
}

/** Session facts the configuration rules depend on; owned by the table sessions once they exist. */
export interface TableActivity {
  activityOf(tableId: string): Promise<TableActivitySnapshot>;
}

/** Non-guessable QR tokens (10 alphanumeric characters). */
export interface QrTokenGenerator {
  generate(): string;
}
